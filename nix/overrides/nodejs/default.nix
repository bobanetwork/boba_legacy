{
  lib,
  pkgs,
  # dream2nix
  satisfiesSemver,
  ...
}:
let
  l = lib // builtins;

  # To keep subpackages purified, we need to point directly to the monorepo's
  # tsconfig files, and not to the monorepo itself.
  tsconfig-build = l.path {
    name = "tsconfig-build";
    path = ./../../../tsconfig.build.json;
  };
  tsconfig = l.path {
    name = "tsconfig";
    path = ./../../../tsconfig.json;
  };
  postPatch = ''
    if grep -q ../../../ ./tsconfig.json; then
      if [ -f "./tsconfig.build.json" ];
      then
        substituteInPlace ./tsconfig.build.json --replace \
          '"extends": "../../../tsconfig.build.json"' \
          '"extends": "./tsconfig.build-copy.json"'
      fi
      substituteInPlace ./tsconfig.json --replace \
        '"extends": "../../../tsconfig.json"' \
        '"extends": "./tsconfig.build-copy.json"'
    else
      if [ -f "./tsconfig.build.json" ];
      then
        substituteInPlace ./tsconfig.build.json --replace \
          '"extends": "../../tsconfig.build.json"' \
          '"extends": "./tsconfig.build-copy.json"'
      fi
      substituteInPlace ./tsconfig.json --replace \
        '"extends": "../../tsconfig.json"' \
        '"extends": "./tsconfig.build-copy.json"'
    fi
    cp ${tsconfig-build} ./tsconfig.build-copy.json
  '';
  correct-tsconfig-path = {
    inherit postPatch;
  };
  add-yarn = {
    nativeBuildInputs = old: old ++ [
      pkgs.yarn
    ];
  };
  add-solc = {
    XDG_CACHE_HOME = "${solc-cache}";
  };
  solc-cache = import ./solc-cache.nix { inherit pkgs; };
in
{
  "@boba/turing-hybrid-compute" = {
    inherit add-yarn add-solc;
    cleanup-dir = {
      postFixup = ''
        rm -r `ls -A $out/lib/node_modules/@boba/turing-hybrid-compute/ | \
          grep -v "package.json\|artifacts\|node_modules\|contracts\|cache"`
        ln -s $out/lib/node_modules/@boba/turing-hybrid-compute $out/turing
      '';
    };
  };
  "@boba/contracts" = {
    inherit add-yarn correct-tsconfig-path;
    add-ts-node = {
      postInstall = ''
        mkdir -p $out/bin
        ln -s $out/lib/node_modules/@boba/contracts $out/contracts
        ln -s $out/contracts/node_modules/ts-node/dist/bin.js $out/bin/ts-node
      '';
    };
    cleanup-dir = {
      postFixup = ''
        rm -r `ls -A $out/lib/node_modules/@boba/contracts/ | grep -v \
        "deployments\|bin\|deploy\|dist\|artifacts\|package.json\|preSupported\|node_modules\|contracts\|hardhat.config.ts\|tsconfig\|cache"`
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
  "@boba/gas-price-oracle" = {
    inherit correct-tsconfig-path;
    install-symlinks = {
      postInstall = ''
        mkdir -p $out/bin
        ln -s $out/lib/node_modules/@boba/gas-price-oracle/exec/run-gas-price-oracle.js $out/bin/gas-price-oracle.js
        ln -s $out/lib/node_modules/@boba/gas-price-oracle/ $out/gas-price-oracle
      '';
    };
    cleanup-dir = {
      postFixup = ''
        rm -r `ls -A $out/lib/node_modules/@boba/gas-price-oracle/ | \
          grep -v "package.json\|dist\|node_modules\|exec\|scripts"`
      '';
    };
  };
  "@boba/message-relayer-fast" = {
    inherit correct-tsconfig-path;
    cleanup-dir = {
      postFixup = ''
        rm -r `ls -A $out/lib/node_modules/@boba/message-relayer-fast/ | \
          grep -v "package.json\|dist\|node_modules"`
      '';
    };
  };
  "@eth-optimism/common-ts" = {
    inherit add-yarn correct-tsconfig-path;
    cleanup-dir = {
      postFixup = ''
        rm -r `ls -A $out/lib/node_modules/@eth-optimism/common-ts/ | \
          grep -v "package.json\|dist\|node_modules"`
      '';
    };
    minimize = {
      postInstall = ''
        ln -s $out/lib/node_modules/@eth-optimism/common-ts $out/common-ts
      '';
    };
    add-inputs = {
      buildInputs = old: old ++ [
        #pkgs.nodePackages.typescript
      ];
    };
  };
  "@eth-optimism/message-relayer" = {
    inherit correct-tsconfig-path;
    cleanup-dir = {
      postFixup = ''
        rm -r `ls -A $out/lib/node_modules/@eth-optimism/message-relayer/ | \
          grep -v "package.json\|dist\|node_modules\|exec\|hardhat.config.ts"`
      '';
    };
    install-symlinks = {
      postInstall = ''
        mkdir -p $out/bin
        ln -s $out/lib/node_modules/@eth-optimism/message-relayer/exec/run-message-relayer.js \
          $out/bin/run-message-relayer.js
        ln -s $out/lib/node_modules/@eth-optimism/message-relayer $out/message-relayer
      '';
    };
  };
  "@eth-optimism/contracts" = {
    inherit correct-tsconfig-path add-solc;
    cleanup-dir = {
      postFixup = ''
        rm -r `ls -A $out/lib/node_modules/@eth-optimism/contracts/ | \
          grep -v "deployments\|dist\|artifacts\|package.json\|node_modules\|contracts\|hardhat.config.ts\|tsconfig\|cache\|bin"`
      '';
    };
    # ts-node needed for runtime
    add-ts-node = {
      postInstall = ''
        mkdir -p $out/bin
        ln -s $out/lib/node_modules/@eth-optimism/contracts $out/contracts
        ln -s $out/contracts/node_modules/ts-node/dist/bin.js $out/bin/ts-node
        rm $out/contracts/node_modules/node-hid
        rm -rf $out/contracts/node_modules/@ledgerhq
        rm $out/contracts/node_modules/usb
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
      nativeBuildInputs = old: old ++ [
        pkgs.nodePackages.node-pre-gyp
        pkgs.python3Full
      ];
    };
    cleanup-dir = {
      postFixup = ''
        rm -r `ls -A $out/lib/node_modules/@eth-optimism/core-utils/ | grep -v "package.json\|dist\|node_modules"`
      '';
    };
    minimize = {
      postInstall = ''
        ln -s $out/lib/node_modules/@eth-optimism/core-utils $out/core-utils
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
    minimize = {
      postInstall = ''
        ln -s $out/lib/node_modules/@eth-optimism/sdk $out/sdk
      '';
    };
  };
  "@eth-optimism/data-transport-layer" = {
    inherit correct-tsconfig-path add-solc;
    cleanup-dir = {
      postFixup = ''
        rm -r `ls -A $out/lib/node_modules/@eth-optimism/data-transport-layer/ | grep -v "package.json\|node_modules\|dist"`
      '';
    };
    install-symlinks = {
      postInstall = ''
        ln -s $out/lib/node_modules/@eth-optimism/data-transport-layer/dist $out/dist
        mkdir $out/lib/node_modules/@eth-optimism/data-transport-layer/state-dumps
        ln -s $out/lib/node_modules/@eth-optimism/data-transport-layer $out/dtl
      '';
    };
  };
  # "hardhat" = {
  #   cleanup-dir = {
  #     postFixup = ''
  #       mkdir -p $out/bin
  #       makeWrapper $out/lib/node_modules/hardhat/internal/cli/cli.js $out/bin/hardhat \
  #         --run "cd $out/lib/node_modules/hardhat/"
  #     '';
  #   };
  # };
  "@eth-optimism/hardhat-node" = {
    cleanup-dir = {
      postFixup = ''
        rm -r `ls -A $out/lib/node_modules/@eth-optimism/hardhat-node/ | grep -v "package.json\|node_modules\|hardhat.config.js\|.dockerenv"`
        mkdir -p $out/bin
        makeWrapper $out/lib/node_modules/@eth-optimism/hardhat-node/node_modules/hardhat/internal/cli/cli.js $out/bin/hardhat \
          --run "cd $out/lib/node_modules/@eth-optimism/hardhat-node/"
      '';
    };
    install-dockerenv = {
      postInstall = ''
        touch $out/lib/node_modules/@eth-optimism/hardhat-node/.dockerenv
      '';
    };
  };
  "@eth-optimism/integration-tests" = {
    inherit add-solc;
    correct-tsconfig-path = {
      postPatch = ''
        substituteInPlace ./tsconfig.json --replace \
          '"extends": "../tsconfig.json"' \
          '"extends": "./tsconfig-copy.json"'
        cp ${tsconfig-build} ./tsconfig-copy.json
      '';
    };
  };
  "@eth-optimism/replica-healthcheck" = {
    inherit correct-tsconfig-path;
  };
  "@boba/register" = {
    inherit add-yarn correct-tsconfig-path;
    cleanup-dir = {
      postFixup = ''
        rm -r `ls -A $out/lib/node_modules/@boba/register/ | grep -v "package.json\|node_modules\|addresses\|bin"`
      '';
    };
    install-symlinks = {
      postInstall = ''
        ln -s $out/lib/node_modules/@boba/register $out/register
      '';
    };
  "@boba/monitor" = {
    install-symlinks = {
      postInstall = ''
        ln -s $out/lib/node_modules/@boba/monitor $out/monitor
      '';
    };

  };
  "@openzeppelin/contracts" = {
    add-regenesis-patch = let
      patches = l.path {
        name = "patches";
        path = ../../../patches;
      };
      in {
      prePatch = ''
        set -x
        cp -r ${patches} patches
        ls
        substituteInPlace ./patches/@openzeppelin+contracts+4.3.2.patch --replace \
          '/node_modules/@openzeppelin/contracts/' \
          '/'

      '';
      patches = [
        "./patches/@openzeppelin+contracts+4.3.2.patch"
      ];
    };
  };

  # Various pruning of dependencies to make scope smaller
  errno = {
    remove-nodejs = {
      postFixup = ''
        rm -r $out/lib/node_modules/errno/cli.js
        rm -r $out/lib/node_modules/errno/build.js
      '';
    };
  };
  pino-sentry = {
    remove-nodejs = {
      postFixup = ''
        rm -r $out/lib/node_modules/pino-sentry/dist/cli.*
      '';
    };
  };
  mime = {
    remove-nodejs = {
      _condition = satisfiesSemver "^2.6.0";
      postFixup = ''
        rm -r $out/lib/node_modules/mime/cli.js
      '';
    };
    remove-nodejs2 = {
      _condition = satisfiesSemver "^1.6.0";
      postFixup = ''
        rm -r $out/lib/node_modules/mime/cli.js
        rm -r $out/lib/node_modules/mime/src/build.js
      '';
    };
  };
  rlp = {
    remove-nodejs = {
      postFixup = ''
        rm -r $out/lib/node_modules/rlp/bin/rlp
      '';
    };
  };
  treeify = {
    remove-nodejs = {
      postFixup = ''
        rm -r $out/lib/node_modules/treeify/examples/fs_tree.js
      '';
    };
  };
  "sha.js" = {
    remove-nodejs = {
      postFixup = ''
        rm -r $out/lib/node_modules/sha.js/bin.js
      '';
    };
  };
  node-addon-api = {
    remove-nodejs = {
      postFixup = ''
        rm -r $out/lib/node_modules/node-addon-api/tools/conversion.js
      '';
    };
  };
  merkletreejs = {
    remove-nodegyp = {
      _condition = satisfiesSemver "^0.2.31";
      postFixup = ''
    if [ -h "$out/lib/node_modules/merkletreejs/node_modules/node-gyp-build" ];
    then
        rm  $out/lib/node_modules/merkletreejs/node_modules/node-gyp-build
    fi
      '';
    };
  };
  keccak = {
    remove-nodegyp = {
      _condition = satisfiesSemver "^3.0.2";
      postFixup = ''
        rm  $out/lib/node_modules/keccak/node_modules/node-gyp-build
      '';
    };
  };

  ethereumjs-util = {
    remove-nodegyp = {
      postFixup = ''
          if [ -h "$out/lib/node_modules/ethereumjs-util/node_modules/node-gyp-build" ];
          then
            rm  $out/lib/node_modules/ethereumjs-util/node_modules/node-gyp-build
          fi

      '';
    };
  };
  ethereum-cryptography = {
    remove-nodegyp = {
      postFixup = ''
          if [ -h "$out/lib/node_modules/ethereum-cryptography/node_modules/node-gyp-build" ];
          then
            rm  $out/lib/node_modules/ethereum-cryptography/node_modules/node-gyp-build
          fi

      '';
    };
  };
  secp256k1 = {
    remove-nodegyp = {
      postFixup = ''
          if [ -h "$out/lib/node_modules/secp256k1/node_modules/node-gyp-build" ];
          then
            rm  $out/lib/node_modules/secp256k1/node_modules/node-gyp-build
          fi

      '';
    };
  };
  level = {
    remove-nodegyp = {
      postFixup = ''
          if [ -h "$out/lib/node_modules/level/node_modules/node-gyp-build" ];
          then
            rm  $out/lib/node_modules/level/node_modules/node-gyp-build
          fi
      '';
    };
  };
  # node-gyp-build required for runtime of leveldown?
  # leveldown = {
  #   remove-nodegyp = {
  #     postFixup = ''
  #         if [ -h "$out/lib/node_modules/leveldown/node_modules/node-gyp-build" ];
  #         then
  #           rm  $out/lib/node_modules/leveldown/node_modules/node-gyp-build
  #         fi
  #     '';
  #   };
  # };

  optimism = {
    inherit add-solc;
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
