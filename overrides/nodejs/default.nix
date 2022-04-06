{
  lib,
  pkgs,
  # dream2nix
  satisfiesSemver,
  ...
}:
let
  l = lib // builtins;
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
  correct-tsconfig-path = {
    inherit postPatch;
  };
  add-yarn = {
    nativeBuildInputs = old: old ++ [
      pkgs.yarn
    ];
  };
  solc-cache = import ./solc-cache.nix { inherit pkgs; };
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
    inherit add-yarn;
    add-solc = {
      XDG_CACHE_HOME = "${solc-cache}";
    };
  };
  "@boba/contracts" = {
    #inherit correct-tsconfig-path;
    inherit add-yarn;
    correct-tsconfig-path = {
      postPatch = ''
        substituteInPlace ./tsconfig.json --replace \
          '"extends": "../../../tsconfig.json"' \
          '"extends": "./tsconfig.build-copy.json"'
        cp ${./../..}/tsconfig.build.json \
          ./tsconfig.build-copy.json
      '';
    };
    add-hardhat-cache = let
      config-home = let
        telemetry-consent = pkgs.writeTextFile {
          name = "telemetry-consent.json";
          text = ''
            {
              "consent": false
            }
          '';
        };
      in
        pkgs.stdenv.mkDerivation rec {
          pname = "hardhat-config";
          version = "0.0.1";
          builder = pkgs.writeTextFile {
            name = "builder.sh";
            text = ''
              . $stdenv/setup
              mkdir -p $out/hardhat-nodejs/
              ln -sf ${telemetry-consent} $out/hardhat-nodejs/telemetry-consent.json
            '';
          };
        };
      data-home = let
        analytics = pkgs.writeTextFile {
          name = "analytics.json";
          text = ''
            {
              "analytics": {
                "clientId": "db6b71c6-9c4d-440e-aef5-e1d9b1d422fc"
              }
            }
          '';
        };
      in
        pkgs.stdenv.mkDerivation rec {
          pname = "hardhat-data";
          version = "0.0.1";
          builder = pkgs.writeTextFile {
            name = "builder.sh";
            text = ''
              . $stdenv/setup
              mkdir -p $out/hardhat-nodejs/
              ln -sf ${analytics} $out/hardhat-nodejs/analytics.json
            '';
          };
        };
    in {
      XDG_CACHE_HOME = "${solc-cache}";
      XDG_CONFIG_HOME = "${config-home}";
      XDG_DATA_HOME = "${data-home}";
    };
  };
  "@boba/gas-price-oracle" = { inherit correct-tsconfig-path; };
  "@boba/message-relayer-fast" = {
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
    cleanup-dir = {
      postFixup = ''
        rm -r `ls -A $out/lib/node_modules/@boba/message-relayer-fast/ | grep -v "package.json\|dist\|node_modules"`
      '';
    };
  };
  "@eth-optimism/common-ts" = {
    inherit add-yarn correct-tsconfig-path;
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
        rm -r `ls -A $out/lib/node_modules/@eth-optimism/contracts/ | grep -v "deployments\|dist\|artifacts\|package.json\|node_modules\|contracts"`
      '';
    };
    add-inputs = {
      nativeBuildInputs = old: old ++ [
        pkgs.yarn
        pkgs.nodePackages.node-pre-gyp
      ];
    };
  };
  "@eth-optimism/core-utils" = {
    correct-tsconfig-path = {
      _condition = satisfiesSemver "^0.6.0";
      postPatch = lib.concatStrings [ postPatch '' \
        substituteInPlace ./tsconfig.build-copy.json --replace \
          '"src/@types"' \
          '"src/@types/external"'
      ''];
    };
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
  "@eth-optimism/sdk" = {
    inherit correct-tsconfig-path;
    cleanup-dir = {
      postFixup = ''
        rm -r `ls -A $out/lib/node_modules/@eth-optimism/sdk/ | grep -v "package.json\|dist\|node_modules"`
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
  "@eth-optimism/integration-tests" = {
    correct-tsconfig-path = {
      postPatch = ''
        substituteInPlace ./tsconfig.json --replace \
          '"extends": "../tsconfig.json"' \
          '"extends": "./tsconfig-copy.json"'
        cp ${./../..}/tsconfig.build.json \
          ./tsconfig-copy.json
      '';
    };
  };
  "@boba/register" = {
    inherit add-yarn;
    cleanup-dir = {
      postFixup = ''
        rm -r `ls -A $out/lib/node_modules/@boba/register/ | grep -v "package.json\|node_modules\|addresses\|bin"`
      '';
    };
    correct-tsconfig-path = {
      postPatch = ''
        substituteInPlace ./tsconfig.json --replace \
          '"extends": "../../../tsconfig.json"' \
          '"extends": "./tsconfig-copy.json"'
        cp ${./../..}/tsconfig.build.json \
          ./tsconfig-copy.json
      '';
    };
  };
  "@openzeppelin/contracts" = {
    add-regenesis-patch = {
      prePatch = ''
        cp -r ${../../.}/patches .
        substituteInPlace ./patches/@openzeppelin+contracts+4.3.2.patch --replace \
          '/node_modules/@openzeppelin/contracts/' \
          '/'
      '';
      patches = [
        "./patches/@openzeppelin+contracts+4.3.2.patch"
      ];
    };
  };
  optimism = {
    add-inputs = {
      buildInputs = old: old ++ [
        pkgs.yarn
        pkgs.nodePackages.lerna
      ];
    };
  };
  usb.build = {
    buildInputs = with pkgs; [ udev python3 ];
    nativeBuildInputs = with pkgs; [ jq nodePackages.npm nodejs ];
  };
}
