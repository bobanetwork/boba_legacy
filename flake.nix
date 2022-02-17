{
  description = "Boba stack with Optimism";

  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixos-21.11";
  #inputs.nixpkgs.url = "path:/home/tgunnoe/src/nixpkgs";
  inputs.dream2nix.url = "github:nix-community/dream2nix";
  #inputs.dream2nix.url = "path:/home/tgunnoe/src/boba/dream2nix";
  inputs.dream2nix.inputs.nixpkgs.follows = "nixpkgs";
  inputs.flake-utils.url = "github:numtide/flake-utils";
  inputs.flake-utils.inputs.nixpkgs.follows = "nixpkgs";
  inputs.hardhat-src.url = "github:nomiclabs/hardhat";
  inputs.hardhat-src.flake = false;
  outputs = { self, nixpkgs, flake-utils, dream2nix, hardhat-src }@inp:
    flake-utils.lib.eachDefaultSystem (system:
      let
        version = builtins.substring 0 8 self.lastModifiedDate;
        pkgs = nixpkgs.legacyPackages.${system};
        dream2nix = inp.dream2nix.lib.init {
          #systems = system;
          pkgs = pkgs;
          config = {
            projectRoot = ./. ;
            repoName = "optimism";
            packagesDir = "./packages";
            # overridesDirs = [ "${inputs.dream2nix}/overrides" ];
          };
        };
        packages = flake-utils.lib.flattenTree {
          # hardhat = (dream2nix.makeFlakeOutputs {
          #   source = hardhat-src;
          #   pname = "hardhat";
          #   packageOverrides = {
          #     root = {
          #       add-inputs = {
          #         nativeBuildInputs = old: old ++ [
          #           pkgs.nodePackages.yarn
          #         ];
          #       };
          #     };
          #   };
          # }).defaultPackage.${system};
          optimism = (dream2nix.makeFlakeOutputs {
            source = ./.;
            pname = "optimism";
            packageOverrides = {
              optimism = {
                add-inputs = {
                  nativeBuildInputs = old: old ++ [
                    pkgs.yarn
                    #packages.hardhat
                    # pkgs.nodePackages_latest.yarn
                    pkgs.nodePackages.lerna
                  ];
                  buildInputs = old: old ++ [
                  ];
                };
              };
            };
          }).defaultPackage.${system};

          # dtl = (dream2nix.riseAndShine {
          #   source = ./packages/data-transport-layer;
          # }).defaultPackage.${system};

          l2geth = pkgs.buildGoModule {
            pname = "l2geth";
            inherit version;

            src = ./l2geth;

            doCheck = false;

            # Use fakeSha256 when the dependencies change
            #vendorSha256 = pkgs.lib.fakeSha256;
            vendorSha256 = "sha256-gHz9A0K2CeqkH+vQ2rV0Um1xp5NrRApB81ASx1iOsp0=";
            outputs = [ "out" "geth" "clef" ];

            # Move binaries to separate outputs and symlink them back to $out
            postInstall = pkgs.lib.concatStringsSep "\n" (
              builtins.map (bin: "mkdir -p \$${bin}/bin && mv $out/bin/${bin} \$${bin}/bin/ && ln -s \$${bin}/bin/${bin} $out/bin/") [ "geth" "clef" ]
            );
            runVend = true;
            subPackages = [
              "cmd/abigen"
              "cmd/bootnode"
              "cmd/checkpoint-admin"
              "cmd/clef"
              "cmd/devp2p"
              "cmd/ethkey"
              "cmd/evm"
              "cmd/faucet"
              "cmd/geth"
              "cmd/p2psim"
              "cmd/puppeth"
              "cmd/rlpdump"
              "cmd/utils"
              "cmd/wnode"
            ];

            # Fix for usb-related segmentation faults on darwin
            propagatedBuildInputs = [ pkgs.libusb1 ] ++
                                    pkgs.lib.optionals pkgs.stdenv.isDarwin [
                                      pkgs.libobjc pkgs.IOKit
                                    ];

            passthru.tests = { inherit (pkgs.nixosTests) geth; };
          };
          l2geth-image = pkgs.dockerTools.buildImage {
            name = "l2geth";
            contents = [
              packages.l2geth
            ];
            config = {
              Cmd = [ "bash" ];
            };
          };
        };
        apps = {
          l2geth = flake-utils.lib.mkApp {
            drv = packages.l2geth; };
        };
      in
        {
          packages = packages;
          apps = apps;
          defaultPackage = packages.l2geth;
          defaultApp = apps.l2geth;
        }
    );
}
