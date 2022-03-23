{
  lib,
  pkgs,
  # dream2nix
  satisfiesSemver,
  ...
}:
let
  l = lib // builtins;
  correct-tsconfig-path = {
    #_condition = satisfiesSemver "^0.6.0";
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
      cp ${./../..}/tsconfig.build.json \
      ./tsconfig.build-copy.json
      cp ${./../..}/tsconfig.json \
      ./tsconfig-copy.json
    '';
  };
  # Create a solidity binaries cache. Compile these from source eventually
  amd64-list = builtins.fetchurl {
    url = "https://raw.githubusercontent.com/tgunnoe/solc-bin-test/master/hardhat-nodejs/compilers/linux-amd64/list.json";
    sha256 = "1jz29yy4fhavwjpk362gs9aczgjsf4jpgd92pr5afvzdgj1qr0ki";
  };
  solc-089-amd64 = builtins.fetchurl {
    url = "https://github.com/tgunnoe/solc-bin-test/raw/master/hardhat-nodejs/compilers/linux-amd64/solc-linux-amd64-v0.8.9+commit.e5eed63a";
    sha256 = "156b53bpy3aqmd8s7dyx9xsxk83w0mfcpmpqpam6nj9pmlgz2lgq";
  };
  solc-089-wasm = builtins.fetchurl {
    url = "https://github.com/tgunnoe/solc-bin-test/raw/master/hardhat-nodejs/compilers/wasm/soljson-v0.8.9+commit.e5eed63a.js";
    sha256 = "0b22s78s2fdywkcaykd04ih15ks7rhvbxhf6zmsh4ap3ma3zj9av";
  };
  solc-088-amd64 = builtins.fetchurl {
    url = "https://github.com/tgunnoe/solc-bin-test/raw/master/hardhat-nodejs/compilers/linux-amd64/solc-linux-amd64-v0.8.8+commit.dddeac2f";
    sha256 = "1c6bn1wa1m3b0h7qzcks7mrkzpk7iqxdx8rli7in2v0kdchv2xz6";
  };
  solc-066-amd64 = builtins.fetchurl {
    url = "https://github.com/tgunnoe/solc-bin-test/raw/master/hardhat-nodejs/compilers/linux-amd64/solc-linux-amd64-v0.6.6+commit.6c089d02";
    sha256 = "17ak1ahikf7drxjr4752jpzphsijarnw0s6vjxj99s82rkhd932x";
  };
  solc-0517-amd64 = builtins.fetchurl {
    url = "https://github.com/tgunnoe/solc-bin-test/raw/master/hardhat-nodejs/compilers/linux-amd64/solc-linux-amd64-v0.5.17+commit.d19bba13";
    sha256 = "1wqnkvqs2cs4xcckgny1ha55sbhvak4287lb2xy799gzsfjffp63";
  };
  solc-0517-wasm = builtins.fetchurl {
    url = "https://github.com/tgunnoe/solc-bin-test/raw/master/hardhat-nodejs/compilers/wasm/soljson-v0.5.17+commit.d19bba13.js";
    sha256 = "0d2pz9cy2p6wiw613kwhqd4wcq5xr9m5idvzgw8mwqfwzpqx7lbz";
  };
  solc-0411-amd64 = builtins.fetchurl {
    url = "https://github.com/tgunnoe/solc-bin-test/raw/master/hardhat-nodejs/compilers/linux-amd64/solc-linux-amd64-v0.4.11+commit.68ef5810";
    sha256 = "1skz68p6l6f9gzf4ffq17k63jirwp8jc1v8jhdprw0s5wa71738a";
  };
  wasm-list = builtins.fetchurl {
    url = "https://github.com/tgunnoe/solc-bin-test/raw/master/hardhat-nodejs/compilers/wasm/list.json";
    sha256 = "1kcpz9a74jss9kgy3nfhlvwbryv5i9db214g53pcrr0h62g9ikss";
  };
  solc-cache = pkgs.stdenv.mkDerivation rec {
    pname = "solc-cache";
    version = "0.0.1";
    builder = pkgs.writeTextFile {
      name = "builder.sh";
      text = ''
      . $stdenv/setup
      mkdir -p $out/hardhat-nodejs/compilers/linux-amd64/
      mkdir -p $out/hardhat-nodejs/compilers/wasm/
      ln -sf ${amd64-list} $out/hardhat-nodejs/compilers/linux-amd64/list.json
      ln -sf ${wasm-list} $out/hardhat-nodejs/compilers/wasm/list.json
      ln -sf ${solc-089-amd64} $out/hardhat-nodejs/compilers/linux-amd64/solc-linux-amd64-v0.8.9+commit.e5eed63a
      ln -sf ${solc-088-amd64} $out/hardhat-nodejs/compilers/linux-amd64/solc-linux-amd64-v0.8.8+commit.dddeac2f
      ln -sf ${solc-066-amd64} $out/hardhat-nodejs/compilers/linux-amd64/solc-linux-amd64-v0.6.6+commit.6c089d02
      ln -sf ${solc-0517-amd64} $out/hardhat-nodejs/compilers/linux-amd64/solc-linux-amd64-v0.5.17+commit.d19bba13
      ln -sf ${solc-0411-amd64} $out/hardhat-nodejs/compilers/linux-amd64/solc-linux-amd64-v0.4.11+commit.68ef5810
      ln -sf ${solc-0517-wasm} $out/hardhat-nodejs/compilers/wasm/soljson-v0.5.17+commit.d19bba13.js
      ln -sf ${solc-089-wasm} $out/hardhat-nodejs/compilers/wasm/soljson-v0.8.9+commit.e5eed63a.js
    '';
    };
  };
in
{
  "@eth-optimism/l2geth" = {
    build = let
      l2geth = pkgs.buildGoModule {
        pname = "l2geth";
        version = "0.0.1";
        src = ./../../l2geth;
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
        ln -s ${l2geth.geth}/bin $out/bin
        rm -rf $out/lib
      '';
    };
  };
  "@boba/turing-hybrid-compute" = {
    add-solc = {
      XDG_CACHE_HOME = "${solc-cache}";
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
        cp ${./../..}/tsconfig.build.json \
          ./tsconfig.build-copy.json
      '';
    };
    add-solc = {
      XDG_CACHE_HOME = "${solc-cache}";
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
        cp ${./../..}/tsconfig.build.json \
          ./tsconfig.build-copy.json
        cp ${./../..}/tsconfig.json \
          ./tsconfig-copy.json
      '';
    };
  };
  "@eth-optimism/common-ts" = {
    inherit correct-tsconfig-path;
    cleanup-dir = {
      postFixup = ''
        rm -r `ls -A $out/lib/node_modules/@eth-optimism/common-ts/ | grep -v "package.json\|dist\|node_modules"`
      '';
    };
  };
  "@eth-optimism/message-relayer" = { inherit correct-tsconfig-path; };
  "@eth-optimism/contracts" = {
    inherit correct-tsconfig-path;
    add-solc = {
      XDG_CACHE_HOME = "${solc-cache}";
    };
    cleanup-dir = {
      postFixup = ''
        rm -r `ls -A $out/lib/node_modules/@eth-optimism/contracts/ | grep -v "deployments\|dist\|artifacts\|package.json\|node_modules"`
      '';
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
    inherit correct-tsconfig-path;
    add-inputs = {
      buildInputs = old: old ++ [
      ];
      nativeBuildInputs = old: old ++ [
        pkgs.yarn
        pkgs.nodePackages.node-pre-gyp
      ];
    };
    cleanup-dir = {
      postFixup = ''
        rm -r `ls -A $out/lib/node_modules/@eth-optimism/core-utils/ | grep -v "package.json\|dist\|node_modules"`
      '';
    };
  };
  "@eth-optimism/data-transport-layer" = {
    inherit correct-tsconfig-path;
    add-solc = {
      XDG_CACHE_HOME = "${solc-cache}";
    };
    install-symlinks = {
      installPhase = ''
        ln -s $out/lib/node_modules/@eth-optimism/data-transport-layer/dist $out/dist
      '';
    };
    cleanup-dir = {
      postFixup = ''
        rm -r `ls -A $out/lib/node_modules/@eth-optimism/data-transport-layer/ | grep -v "package.json\|dist\|node_modules"`
      '';
    };
  };

  "@boba/register" = {
    add-solc = {
      XDG_CACHE_HOME = "${solc-cache}";
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
}
