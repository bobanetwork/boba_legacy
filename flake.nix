{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-21.11";
    dream2nix = {
      url = "github:nix-community/dream2nix";
      #url = "path:/home/tgunnoe/src/boba/dream2nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    flake-utils = {
      url = "github:numtide/flake-utils";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    hardhat = {
      url = "github:tgunnoe/hardhat-flake";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.dream2nix.follows = "dream2nix";
    };
    devshell = {
      url = "github:numtide/devshell";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
    devshell,
    dream2nix,
    hardhat,
  } @inputs:
    let
      lib = nixpkgs.lib;

      supportedSystems = [ "x86_64-linux" "x86_64-darwin" "aarch64-linux" "aarch64-darwin" ];

      boba-monorepo = inputs.dream2nix.lib2.init {
        systems = supportedSystems;
        config.projectRoot = ./. ;
        config.overridesDirs = [ ./overrides ];
      };

      boba =
        flake-utils.lib.eachDefaultSystem (system:
          let
            pkgs = import nixpkgs {
              inherit system;
              overlays = [ devshell.overlay ];
            };
          in
          rec {
            packages = flake-utils.lib.flattenTree {
              dtl-image = pkgs.dockerTools.buildLayeredImage {
                maxLayers = 125;
                name = "dtl";
                contents = [
                  self.packages.${system}."@eth-optimism/data-transport-layer"
                ];
                config = {
                  Cmd = [  ];
                };
              };
              l2geth-image = pkgs.dockerTools.buildLayeredImage {
                name = "l2geth";
                contents = [
                ];
                config = {
                  Cmd = [ "${self.packages.${system}."@eth-optimism/l2geth"}/bin/geth" ];
                };
              };
            };
            nixpkgs = pkgs;
            defaultPackage = packages.l2geth;
            apps = {
              l2geth = flake-utils.lib.mkApp { drv = packages.l2geth; };
            };

            defaultApp = apps.l2geth;
            shell = import ./shell.nix { inherit self system pkgs hardhat; };
            shells =
              let
                bobapkgs = self.packages.${system};
              in
              {
                "@eth-optimism/data-transport-layer" = pkgs.devshell.mkShell {
                  name = "Data Transport Layer";
                  env = [
                    {
                      name = "HTTP_PORT";
                      value = 8080;
                    }
                  ];
                };
              };
          }
        );
    in
      lib.recursiveUpdate
        (boba-monorepo.makeFlakeOutputs {
          pname = "boba";
          source = ./. ;
          settings = [
            {
              #subsystemInfo.noDev = true;
            }
          ];
          inject = {
            express-prom-bundle."6.4.1" = [
              ["prom-client" "13.2.0"]
            ];
            "@eth-optimism/core-utils"."0.8.1"  = [
              [ "@types/node" "15.14.9" ]
            ];
          };
          packageOverrides = {
            "@openzeppelin/contracts" = {
              add-regenesis-patch = {
                prePatch = ''
                  cp -r ${./.}/patches .
                  substituteInPlace ./patches/@openzeppelin+contracts+4.3.2.patch --replace \
                    '/node_modules/@openzeppelin/contracts/' \
                    '/'
                '';
                patches = [
                  "./patches/@openzeppelin+contracts+4.3.2.patch"
                ];
              };
            };
          };

        })
        {
          packages = boba.packages;
          apps = boba.apps;
          devShell = boba.shell;
          devShells = boba.shells;
        };
}
