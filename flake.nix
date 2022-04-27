{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    dream2nix = {
      url = "github:nix-community/dream2nix/2480581482e3cabe55c938cdaa70d9fc692f6983";
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
        config.overridesDirs = [ ./nix/overrides ];
      };

      boba =
        flake-utils.lib.eachDefaultSystem (system:
          let
            pkgs = import nixpkgs {
              inherit system;
              overlays = [ devshell.overlay ];
            };
            # TODO: Make this an overlay instead
            bobapkgs = self.packages.${system};
          in
          rec {
            packages = flake-utils.lib.flattenTree {
              monorepo = pkgs.stdenv.mkDerivation {
                pname = "boba-monorepo";
                version = "0.0.1";
                builder = pkgs.writeTextFile {
                  name = "builder.sh";
                  text = ''
                    . $stdenv/setup
                    mkdir -p $out/boba
                    mkdir -p $out/optimism
                    ln -sf ${bobapkgs."@eth-optimism/l2geth"} $out/l2geth
                    ln -sf ${bobapkgs."@eth-optimism/core-utils"} $out/optimism/core-utils
                    ln -sf ${bobapkgs."@eth-optimism/common-ts"} $out/optimism/common-ts
                    ln -sf ${bobapkgs."@eth-optimism/data-transport-layer"} $out/optimism/data-transport-layer
                    ln -sf ${bobapkgs."@eth-optimism/contracts"} $out/optimism/contracts
                    ln -sf ${bobapkgs."@eth-optimism/message-relayer"} $out/optimism/message-relayer
                    ln -sf ${bobapkgs."@eth-optimism/sdk"} $out/optimism/sdk
                    ln -sf ${bobapkgs."@eth-optimism/hardhat-node"} $out/hardhat
                    ln -sf ${bobapkgs."@boba/contracts"} $out/boba/contracts
                    ln -sf ${bobapkgs."@boba/gas-price-oracle"} $out/boba/gas-price-oracle
                    ln -sf ${bobapkgs."@boba/gateway"} $out/boba/gateway
                    ln -sf ${bobapkgs."@boba/turing-hybrid-compute"} $out/boba/turing
                    ln -sf ${bobapkgs."@eth-optimism/replica-healthcheck"} $out/optimism/replica-healthcheck
                  '';
                };
              };
              #docker = import ./nix/docker.nix { inherit pkgs bobapkgs; };
              dtl-image = pkgs.dockerTools.buildLayeredImage {
                maxLayers = 125;
                name = "dtl";
                contents = [
                  bobapkgs."@eth-optimism/data-transport-layer"
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
                  Cmd = [ "${bobapkgs."@eth-optimism/l2geth"}/bin/geth" ];
                };
              };
              hardhat-image = pkgs.dockerTools.buildLayeredImage {
                name = "l1_chain";
                contents = [
                ];
                config = {
                  ExposedPorts = {
                    "8545" = {};
                  };
                  Cmd = [ "${bobapkgs."@eth-optimism/hardhat-node"}/bin/hardhat node --network hardhat" ];
                };
              };
            };
            nixpkgs = pkgs;
            defaultPackage = packages.monorepo;
            apps = {
              l2geth = flake-utils.lib.mkApp { drv = packages.l2geth; };
            };

            defaultApp = apps.l2geth;

            shell = import ./devshell.nix { inherit bobapkgs pkgs; };
            shells =
              let

              in
              {
                "@eth-optimism/data-transport-layer" = pkgs.devshell.mkShell {
                  name = "Data Transport Layer";
                  devshell.startup.node-env.text = "export PATH=$PATH:${bobapkgs."@eth-optimism/data-transport-layer"}/.bin";
                };
                "@eth-optimism/contracts" = pkgs.devshell.mkShell {
                  name = "Optimism Contracts";
                  devshell.startup.node-env.text = "export PATH=$PATH:${bobapkgs."@eth-optimism/contracts"}/lib/node_modules/.bin";
                  packages = with pkgs; with bobapkgs; [
                    bobapkgs."@eth-optimism/hardhat-node"
                  ];

                  commands = [
                    {
                      name = "build";
                      help = "build with hardhat, eg: hardhat compile";
                      category = "build";
                      command = "hardhat compile $@";
                    }
                    {
                      name = "test";
                      help = "test contracts with hardhat";
                      category = "test";
                      command = "hardhat test $@";
                    }
                    {
                      name = "validate";
                      help = "validate contracts with hardhat";
                      category = "validate";
                      command = "hardhat validateOutput $@";
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
          source = builtins.path {
            name = "boba";
            path = ./.;
            filter = path: _: baseNameOf path != "flake.nix" && baseNameOf path != "overrides";
          };
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
            "@eth-optimism/integration-tests"."0.2.3" = [
              [ "@openzeppelin/contracts" "4.3.2" ]
            ];
          };
        })
        {
          packages = boba.packages;
          apps = boba.apps;
          defaultPackage = boba.defaultPackage;
          devShell = boba.shell;
          devShells = boba.shells;

        };
}
