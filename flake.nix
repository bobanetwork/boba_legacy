{
  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixos-21.11";
  #inputs.dream2nix.url = "github:nix-community/dream2nix";
  inputs.dream2nix.url = "github:tgunnoe/dream2nix/git-plus-resolved";
  inputs.dream2nix.inputs.nixpkgs.follows = "nixpkgs";
  inputs.solc-bin.url = "github:tgunnoe/solc-bin-test";
  inputs.solc-bin.flake = false;

  outputs = { self, nixpkgs, dream2nix, solc-bin }@inputs:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs {
        inherit system;
      };
      dream2nix = inputs.dream2nix.lib2.init {
        pkgs = pkgs;
        config.projectRoot = ./. ;
      };

      # some override required for multiple packages
      correct-tsconfig-path = {
        postPatch = ''
            if [ -f "./tsconfig.build.json" ];
            then
            substituteInPlace ./tsconfig.build.json --replace \
              '"extends": "../../tsconfig.build.json"' \
              '"extends": "./tsconfig.build-copy.json"'
            fi
            substituteInPlace ./tsconfig.json --replace \
              '"extends": "../../tsconfig.json"' \
              '"extends": "./tsconfig-copy.json"'
            cp ${./.}/tsconfig.build.json \
              ./tsconfig.build-copy.json
            cp ${./.}/tsconfig.json \
              ./tsconfig-copy.json

          '';
      };
    in
      dream2nix.makeFlakeOutputs {
        pname = "boba";
        source = ./. ;
        packageOverrides =
          # let
          #   # Ideally, these should be built and cached from source
          #   solc-cache = pkgs.stdenv.mkDerivation {
          #     pname = "solc-cache";
          #     version = "0.8.9";
          #     src = builtins.fetchurl {
          #       url = "https://github.com/ethereum/solc-bin/raw/gh-pages/linux-amd64/solc-linux-amd64-v0.8.9+commit.e5eed63a";
          #       sha256 = "156b53bpy3aqmd8s7dyx9xsxk83w0mfcpmpqpam6nj9pmlgz2lgq";
          #     };
          #     nativeBuildInputs = [
          #       pkgs.cmake
          #     ];
          #   };

          # in
          {
          "@eth-optimism/l2geth" = {
            build = let
              l2geth = pkgs.buildGoModule {
                pname = "l2geth";
                version = builtins.substring 0 8 self.lastModifiedDate;
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
            in {
              buildInputs = old: old ++ [
                pkgs.python3
                pkgs.jq
                pkgs.nodejs

              ];
              installPhase = ''
              ln -s ${l2geth}/bin $out/bin
              rm -rf $out/lib
              '';
            };
          };
          "@boba/turing-hybrid-compute" = {
            add-solc = {
                XDG_CACHE_HOME = "${solc-bin}";
            };
            add-inputs = {
              buildInputs = old: old ++ [
                pkgs.yarn
                #solc-cache
              ];
            };
          };
          "@boba/contracts" = {
            #inherit correct-tsconfig-path;
            correct-tsconfig-path = {
              postPatch = ''
                substituteInPlace ./tsconfig.json --replace \
                  '"extends": "../../../tsconfig.json"' \
                  '"extends": "./tsconfig.build-copy.json"'
                cp ${./.}/tsconfig.build.json \
                  ./tsconfig.build-copy.json
              '';
            };
            add-solc = {
                XDG_CACHE_HOME = "${solc-bin}";
            };
            add-inputs = {
              buildInputs = old: old ++ [
                pkgs.yarn
                #solc-cache
              ];
              nativeBuildInputs = old: old ++ [
                pkgs.udev
              ];

            };
          };
          "@boba/gas-price-oracle" = { inherit correct-tsconfig-path; };
          "@boba/message-relayer-fast" = {
            #inherit correct-tsconfig-path;
            correct-tsconfig-path = {
              postPatch = ''
                substituteInPlace ./tsconfig.json --replace \
                  '"extends": "../../../tsconfig.json"' \
                  '"extends": "./tsconfig-copy.json"'
                substituteInPlace ./tsconfig.build.json --replace \
                  '"extends": "../../../tsconfig.build.json"' \
                  '"extends": "./tsconfig.build-copy.json"'
                cp ${./.}/tsconfig.build.json \
                  ./tsconfig.build-copy.json
                cp ${./.}/tsconfig.json \
                  ./tsconfig-copy.json
              '';
            };
          };
          "@eth-optimism/common-ts" = { inherit correct-tsconfig-path; };
          "@eth-optimism/message-relayer" = { inherit correct-tsconfig-path; };
          "@eth-optimism/contracts" = {
            inherit correct-tsconfig-path;
            add-solc = {
                XDG_CACHE_HOME = "${solc-bin}";
            };
            add-inputs = {
              buildInputs = old: old ++ [

                #solc-cache
              ];
              nativeBuildInputs = old: old ++ [
                pkgs.yarn
                pkgs.nodePackages.node-pre-gyp
              ];
            };
          };
          "@eth-optimism/core-utils" = {

            #_condition = pkg: inputs.dream2nix.lib."x86_64-linux".utils.satisfiesSemver "^0.6.0" pkg;
            #_condition = pkg: pkg.version == "0.6.0";
            inherit correct-tsconfig-path;
            add-inputs = {
              buildInputs = old: old ++ [
                #solc-cache
              ];
              nativeBuildInputs = old: old ++ [
                pkgs.yarn
                pkgs.nodePackages.node-pre-gyp
              ];
            };
          };
          "@eth-optimism/data-transport-layer" = {
            inherit correct-tsconfig-path;
            add-solc = {
                XDG_CACHE_HOME = "${solc-bin}";
            };
            add-inputs = {
              buildInputs = old: old ++ [

                #solc-cache
              ];
              nativeBuildInputs = old: old ++ [
                #pkgs.yarn
                #pkgs.nodePackages.node-pre-gyp
              ];
            };
          };

          "@boba/register" = {
            add-solc = {
                XDG_CACHE_HOME = "${solc-bin}";
            };
            add-inputs = {
              buildInputs = old: old ++ [
                #pkgs.yarn
                #solc-cache
              ];
            };
          };
          optimism = {
            add-inputs = {
              buildInputs = old: old ++ [
                pkgs.yarn
                pkgs.nodePackages.lerna
                #solc-cache
              ];
            };
          };
          usb.build = {
            buildInputs = with pkgs; [ udev python3 ];
            nativeBuildInputs = with pkgs; [ jq nodePackages.npm nodejs ];
          };
        };
      };
}
