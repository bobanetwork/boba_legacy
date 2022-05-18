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
              #default = packages.monorepo;
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
            };
            docker-images = import ./nix/docker.nix { inherit pkgs bobapkgs; };
            go-packages = import ./nix/gopkgs.nix { inherit self pkgs bobapkgs; };
            apps = {
              default = apps.l2geth;
              l2geth = flake-utils.lib.mkApp { drv = packages.l2geth; };
            };

            shells = import ./nix/shell.nix { inherit bobapkgs pkgs; };
          }
        );
    in
      lib.recursiveUpdate
        # The 2nix translation of boba's monorepo
        (boba-monorepo.makeFlakeOutputs {
          pname = "boba";
          source = builtins.path {
            name = "boba";
            path = ./.;
            filter = path: _: baseNameOf path != "flake.nix" && baseNameOf path != "nix";
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
            "@nomiclabs/hardhat-ethers"."2.0.4" = [
              ["hardhat" "2.9.3"]
            ];
            "@nomiclabs/hardhat-waffle"."2.0.2" = [
              ["hardhat" "2.9.3"]
              ["@nomiclabs/hardhat-ethers" "2.0.4"]
            ];
            "@nomiclabs/hardhat-etherscan"."2.1.8" = [
              ["hardhat" "2.9.3"]
            ];
            "@typechain/hardhat"."3.1.0" = [
              ["hardhat" "2.9.3"]
              ["typechain" "6.1.0"]
            ];
            "hardhat-deploy"."0.9.29" = [
              ["hardhat" "2.9.3"]
            ];
            "hardhat-gas-reporter"."1.0.7" = [
              ["hardhat" "2.9.3"]
            ];
            "hardhat-output-validator"."0.1.19" = [
              ["hardhat" "2.9.3"]
            ];
            "request-promise-native"."1.0.9" = [
              ["request" "2.88.2"]
            ];
            "solidity-coverage"."0.7.18" = [
              ["hardhat" "2.9.3"]
            ];
            "@boba/turing-kyc"."0.1.0"  = [
              [ "@types/node" "15.14.9" ]
            ];
            "@eth-optimism/core-utils"."0.8.1"  = [
              [ "@types/node" "15.14.9" ]
            ];
          };
        })
        # All other flake outputs that aren't generated by dream2nix
        {
          packages = lib.recursiveUpdate
            (lib.recursiveUpdate boba.packages boba.docker-images) boba.go-packages;
          apps = boba.apps;
          devShells = boba.shells;

        };
}
