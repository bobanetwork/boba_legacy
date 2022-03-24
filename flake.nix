{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-21.11";
    dream2nix = {
      #url = "github:nix-community/dream2nix";
      # while waiting fy my PRs to be merged above:
      url = "github:tgunnoe/dream2nix/workspace-name-fix";
      #url = "path:/home/tgunnoe/src/boba/dream2nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    flake-utils = {
      url = "github:numtide/flake-utils";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    openzeppelin-contracts = {
      url = "github:openzeppelin/openzeppelin-contracts";
      flake = false;
    };
    hardhat = {
      url = "github:nomiclabs/hardhat";
      flake = false;
    };
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
    dream2nix,
    hardhat,
    openzeppelin-contracts
  } @inputs:
    let
      lib = nixpkgs.lib;

      supportedSystems = [ "x86_64-linux" "x86_64-darwin" "aarch64-linux" "aarch64-darwin" ];

      boba-monorepo = inputs.dream2nix.lib2.init {
        systems = supportedSystems;
        #pkgs = pkgs;
        config.projectRoot = ./. ;
        config.overridesDirs = [ ./overrides ];
      };
      hardhat = inputs.dream2nix.lib2.init {
        systems = supportedSystems;
        #pkgs = pkgs;
        config.projectRoot = ./.;
        config.overridesDirs = [ ./overrides ];
      };

      boba =
        flake-utils.lib.eachDefaultSystem (system:
          let
            pkgs = nixpkgs.legacyPackages.${system};
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
            defaultPackage = packages.l2geth;
            apps.boba = flake-utils.lib.mkApp { drv = packages.l2geth; };
            defaultApp = apps.boba;
          }
        );
    in
      lib.recursiveUpdate
        (hardhat.makeFlakeOutputs {
          pname = "hardhat";
          source = inputs.hardhat;
          packageOverrides = {
            hardhat = {
              correct-tsconfig-path = {
                postPatch = ''
                  substituteInPlace ./tsconfig.json --replace \
                    '"extends": "../../config/typescript/tsconfig.json"' \
                    '"extends": "./config/typescript/tsconfig.json"'
                  substituteInPlace ./src/tsconfig.json --replace \
                    '"extends": "../../../config/typescript/tsconfig.json"' \
                    '"extends": "../config/typescript/tsconfig.json"'

                  cp -r ${inputs.hardhat}/config/ \
                    ./

                  '';
                };
              };
          };
        })
        ( lib.recursiveUpdate
          (boba-monorepo.makeFlakeOutputs {
          pname = "boba";
          source = ./. ;
          inject = {
            express-prom-bundle."6.4.1" = [
              ["prom-client" "13.2.0"]
            ];
            "@eth-optimism/core-utils"."0.8.1"  = [
              [ "@types/node" "15.14.9" ]
            ];

            # "@eth-optimism/smock"."1.1.10"  = [
            #   ["@eth-optimism/core-utils" "0.6.0"]
            # ];
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

          #defaultPackage."x86_64-linux" = self.packages."x86_64-linux".optimism;
        });
}
