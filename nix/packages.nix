{ self, pkgs, bobapkgs, ... }:
rec {
  "@eth-optimism/l2geth" = pkgs.buildGoModule {
    pname = "l2geth";
    version = "0.5.11";
    src = ../l2geth;
    doCheck = false;

    # Use fakeSha256 when the dependencies change
    #vendorSha256 = pkgs.lib.fakeSha256;
    vendorSha256 = "sha256-4/x/ixgTKq9rTqluKZT8JCyjwY+AeKT27SfIfB2rsfA=";
    outputs = [ "out" "geth" "clef" "abigen" ];

    # Move binaries to separate outputs and symlink them back to $out
    postInstall = pkgs.lib.concatStringsSep "\n" (
      builtins.map (bin: "mkdir -p \$${bin}/bin && mv $out/bin/${bin} \$${bin}/bin/ && ln -s \$${bin}/bin/${bin} $out/bin/") [ "geth" "clef" "abigen" ]
    );
    proxyVendor = true;
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

    #   buildInputs = old: old ++ [

    #   ];
    #   installPhase = ''
    #     ln -s ${l2geth.geth}/bin $out/bin
    #     rm -rf $out/lib
    #   '';
    # };
    #  };
  "@eth-optimism/batch-submitter" =
    let
      version = "0.1.3";
      # This should ideally come from self.rev
      git-commit = "599c4d3e84906238f1166ff7a063c7166c75749c";
      git-date = toString self.lastModified;
      postPatch = ''
        substituteInPlace './go.mod' \
          --replace '../../l2geth' './l2geth' \
          --replace '../bss-core' './bss-core'
        cp -r ${./..}/go/bss-core/ ${./..}/l2geth/ ./
      '';
    in pkgs.buildGoModule {
      inherit postPatch;
      pname = "batch-submitter";
      version = version;
      src = ./../go/batch-submitter;
      doCheck = true;
      ldflags = [
        "-X=main.GitCommit=${git-commit}"
        "-X=main.GitDate=${git-date}"
        "-X=main.GitVersion=${version}"
      ];
      # Use fakeSha256 when the dependencies change
      #vendorSha256 = pkgs.lib.fakeSha256;
      vendorSha256 = "sha256-fOOG78JZfke9EEbxT7R9zn3BhRiRyB0JjqSPa2fvPyg=";
      outputs = [ "out" ];
      # Generates the bindings using abigen with the contracts derivation
      # Doesn't work as of yet, because they point to imports from ethereum-optimism/l2geth
      #  and not ethereum/go-ethereum as the current directory's bindings have
      # preConfigure =
      #   let
      #     ctc = "${bobapkgs."@eth-optimism/contracts"}/contracts/artifacts/contracts/L1/rollup/CanonicalTransactionChain.sol/CanonicalTransactionChain.json";
      #     scc = "${bobapkgs."@eth-optimism/contracts"}/contracts/artifacts/contracts/L1/rollup/StateCommitmentChain.sol/StateCommitmentChain.json";
      #   in
      #   ''
      #     mkdir -p bindings/{ctc,scc}/
      #     temp=$(mktemp)
      #     temp2=$(mktemp)
      #     cat ${ctc} \
      #       | ${pkgs.jq}/bin/jq -r .bytecode > $temp

	    #     cat ${ctc} \
      #       | ${pkgs.jq}/bin/jq .abi \
      #       | ${bobapkgs."@eth-optimism/l2geth".abigen}/bin/abigen --pkg ctc \
      #       --abi - \
      #       --out bindings/ctc/canonical_transaction_chain.go \
      #       --type CanonicalTransactionChain \
      #       --bin $temp
      #     cat ${scc} \
      #       | ${pkgs.jq}/bin/jq -r .bytecode > $temp2

	    #     cat ${scc} \
      #       | ${pkgs.jq}/bin/jq .abi \
      #       | ${bobapkgs."@eth-optimism/l2geth".abigen}/bin/abigen --pkg scc \
      #       --abi - \
      #       --out bindings/scc/state_commitment_chain.go \
      #       --type StateCommitmentChain \
      #       --bin $temp2

      #     rm $temp $temp2

      #     substituteInPlace './bindings/ctc/canonical_transaction_chain.go' \
      #       --replace 'ethereum-optimism/optimism/l2geth' 'ethereum/go-ethereum'

      #     substituteInPlace './bindings/scc/state_commitment_chain.go' \
      #       --replace 'ethereum-optimism/optimism/l2geth' 'ethereum/go-ethereum'

      #   '';
      #proxyVendor = true;
      subPackages = [
        "cmd/batch-submitter"
      ];

      overrideModAttrs = (_: {
        # This should be a patch instead
        patches = [];
        inherit postPatch;
      });

    };

  # These minimal scopes are constructed manually,
  # but ideally they should be built from the outside using nix and noDev

  coreutils-min = pkgs.stdenv.mkDerivation {
    pname = "coreutils-min";
    version = "0.0.1";
    builder = pkgs.writeTextFile {
      name = "builder.sh";
      text = ''
        . $stdenv/setup
        mkdir -p $out/node_modules/@ethersproject
        cp -r ${bobapkgs."@eth-optimism/core-utils"}/core-utils/dist $out/dist
        cp ${bobapkgs."@eth-optimism/core-utils"}/core-utils/package.json $out/
        cp -r ${bobapkgs."@eth-optimism/core-utils"}/core-utils/node_modules/@ethersproject/{abstract-provider,bytes,providers,transactions} \
          $out/node_modules/@ethersproject/
        cp -r ${bobapkgs."@eth-optimism/core-utils"}/core-utils/node_modules/{bufio,chai,ethers} \
          $out/node_modules/
      '';
    };
  };
  commonts-min = pkgs.stdenv.mkDerivation {
    pname = "commonts-min";
    version = "0.0.1";
    builder = pkgs.writeTextFile {
      name = "builder.sh";
      text = ''
        . $stdenv/setup

        mkdir -p $out/node_modules/{@eth-optimism,@sentry}

        ln -s ${coreutils-min} $out/node_modules/@eth-optimism/core-utils

        cp -r ${bobapkgs."@eth-optimism/common-ts"}/common-ts/node_modules/@sentry/node \
          $out/node_modules/@sentry/

        cp -r ${bobapkgs."@eth-optimism/common-ts"}/common-ts/dist $out/dist
        cp ${bobapkgs."@eth-optimism/common-ts"}/common-ts/package.json $out/

        cp -r ${bobapkgs."@eth-optimism/common-ts"}/common-ts/node_modules/{bcfg,commander,dotenv,envalid,ethers,lodash,pino-sentry,prom-client} \
          $out/node_modules/

        mkdir -p $out/node_modules/{pino,pino-multi-stream,express}

        cp -r ${bobapkgs."@eth-optimism/common-ts"}/common-ts/node_modules/pino/{node_modules,lib,package.json,pino.js,browser.js,example.js} \
          $out/node_modules/pino/

        cp -r ${bobapkgs."@eth-optimism/common-ts"}/common-ts/node_modules/pino-multi-stream/{package.json,index.js,benchmark.js,multistream.js} \
          $out/node_modules/pino-multi-stream/
        mkdir -p $out/node_modules/pino-multi-stream/node_modules
        cp -r ${bobapkgs."@eth-optimism/common-ts"}/common-ts/node_modules/pino-multi-stream/node_modules/{atomic-sleep,fast-redact,fast-safe-stringify,flatstr,process-warning,quick-format-unescaped,sonic-boom} \
          $out/node_modules/pino-multi-stream/node_modules/
        ln -s $out/node_modules/pino $out/node_modules/pino-multi-stream/node_modules/
        cp -r ${bobapkgs."@eth-optimism/common-ts"}/common-ts/node_modules/express/{node_modules,lib,package.json,index.js} \
          $out/node_modules/express/

      '';
    };
  };
  contracts-min = pkgs.stdenv.mkDerivation {
    pname = "contracts-min";
    version = "0.0.1";
    builder = pkgs.writeTextFile {
      name = "builder.sh";
      text = ''
        . $stdenv/setup

        mkdir -p $out/
        cp -r ${bobapkgs."@eth-optimism/contracts"}/contracts/{artifacts,deployments,dist,contracts,package.json,hardhat.config.ts} $out/

        mkdir -p $out/node_modules/@eth-optimism/
        ln -s ${coreutils-min} $out/node_modules/@eth-optimism/core-utils

        mkdir -p $out/node_modules/@ethersproject/
        cp -r ${bobapkgs."@eth-optimism/contracts"}/contracts/node_modules/@ethersproject/{abstract-provider,abstract-signer} $out/node_modules/@ethersproject/
        cp -r ${bobapkgs."@eth-optimism/contracts"}/contracts/node_modules/ethers \
          $out/node_modules/

      '';
    };
  };
  dtl-min = pkgs.stdenv.mkDerivation {
    pname = "dtl-min";
    version = "0.0.1";
    builder = pkgs.writeTextFile {
      name = "builder.sh";
      text = ''
        . $stdenv/setup

        mkdir -p $out/node_modules/{@eth-optimism,@ethersproject,@sentry,@types}
        ln -s ${coreutils-min} $out/node_modules/@eth-optimism/core-utils
        ln -s ${commonts-min} $out/node_modules/@eth-optimism/common-ts
        ln -s ${contracts-min} $out/node_modules/@eth-optimism/contracts

        cp -r ${bobapkgs."@eth-optimism/data-transport-layer"}/dtl/node_modules/@ethersproject/{providers,transactions} \
          $out/node_modules/@ethersproject/

        cp -r ${bobapkgs."@eth-optimism/data-transport-layer"}/dtl/node_modules/@sentry/{node,tracing} \
          $out/node_modules/@sentry/

        cp -r ${bobapkgs."@eth-optimism/data-transport-layer"}/dtl/node_modules/@types/express \
          $out/node_modules/@types/

        cp -r ${bobapkgs."@eth-optimism/data-transport-layer"}/dtl/node_modules/{axios,bcfg,bfj,browser-or-node,cors,dotenv,body-parser,ethers,express,express-prom-bundle,level,levelup,node-fetch} \
          $out/node_modules/

        mkdir -p $out/dist
        cp -r ${bobapkgs."@eth-optimism/data-transport-layer"}/dtl/dist/src $out/dist/src
        cp  ${bobapkgs."@eth-optimism/data-transport-layer"}/dtl/package.json $out/

      '';
    };
  };
  sdk-min = pkgs.stdenv.mkDerivation {
    pname = "sdk-min";
    version = "0.0.1";
    builder = pkgs.writeTextFile {
      name = "builder.sh";
      text = ''
        . $stdenv/setup

        mkdir -p $out/node_modules/{@eth-optimism,@ethersproject}

        ln -s ${coreutils-min} $out/node_modules/@eth-optimism/core-utils
        ln -s ${contracts-min} $out/node_modules/@eth-optimism/contracts

        cp -r ${bobapkgs."@eth-optimism/sdk"}/sdk/node_modules/@ethersproject/{abstract-provider,abstract-signer,transactions} \
          $out/node_modules/@ethersproject/


        cp -r ${bobapkgs."@eth-optimism/sdk"}/sdk/node_modules/{lodash,merkletreejs,rlp,ethers} \
          $out/node_modules/

        cp -r ${bobapkgs."@eth-optimism/sdk"}/sdk/dist $out/dist
        cp  ${bobapkgs."@eth-optimism/sdk"}/sdk/package.json $out/

      '';
    };
  };
  message-relayer-min = pkgs.stdenv.mkDerivation {
    pname = "message-relayer-min";
    version = "0.0.1";
    builder = pkgs.writeTextFile {
      name = "builder.sh";
      text = ''
        . $stdenv/setup

        mkdir -p $out/node_modules/{@eth-optimism,@sentry}
        ln -s ${commonts-min} $out/node_modules/@eth-optimism/common-ts
        ln -s ${coreutils-min} $out/node_modules/@eth-optimism/core-utils
        ln -s ${sdk-min} $out/node_modules/@eth-optimism/sdk

        cp -r ${bobapkgs."@eth-optimism/message-relayer"}/message-relayer/node_modules/@eth-optimism/ynatm $out/node_modules/@eth-optimism/

        cp -r ${bobapkgs."@eth-optimism/message-relayer"}/message-relayer/node_modules/@sentry/node \
          $out/node_modules/@sentry/

        cp -r ${bobapkgs."@eth-optimism/message-relayer"}/message-relayer/node_modules/{bcfg,dotenv,ethers,node-fetch} \
          $out/node_modules/

        cp -r ${bobapkgs."@eth-optimism/message-relayer"}/message-relayer/dist $out/dist
        cp -r ${bobapkgs."@eth-optimism/message-relayer"}/message-relayer/exec $out/exec
        cp  ${bobapkgs."@eth-optimism/message-relayer"}/message-relayer/package.json $out/

      '';
    };
  };
  turing-min = pkgs.stdenv.mkDerivation {
    pname = "turing-min";
    version = "0.0.1";
    builder = pkgs.writeTextFile {
      name = "builder.sh";
      text = ''
        . $stdenv/setup

        mkdir -p $out/node_modules/@uniswap

        cp -r ${bobapkgs."@boba/turing-hybrid-compute"}/turing/node_modules/@uniswap/sdk $out/node_modules/@uniswap/
        cp -r ${bobapkgs."@boba/turing-hybrid-compute"}/turing/node_modules/{ip,web3,web3-eth-abi} \
          $out/node_modules/
        cp ${bobapkgs."@boba/turing-hybrid-compute"}/turing/package.json \
          $out/
        cp -r ${bobapkgs."@boba/turing-hybrid-compute"}/turing/artifacts $out/
        cp -r ${bobapkgs."@boba/turing-hybrid-compute"}/turing/contracts $out/

      '';
    };
  };
  boba-contracts-min = pkgs.stdenv.mkDerivation {
    pname = "boba-contracts-min";
    version = "0.0.1";
    builder = pkgs.writeTextFile {
      name = "builder.sh";
      text = ''
        . $stdenv/setup

        mkdir -p $out/node_modules/{@eth-optimism,@chainlink,@boba,@ethersproject,@nomiclabs,@openzeppelin}

        cp -r ${bobapkgs."@boba/contracts"}/contracts/{artifacts,bin,contracts,deploy,package.json,preSupportedNFTs.json,preSupportedTokens.json,hardhat.config.ts} $out/


        ln -s ${sdk-min} $out/node_modules/@eth-optimism/sdk
        ln -s ${contracts-min} $out/node_modules/@eth-optimism/contracts
        ln -s ${turing-min} $out/node_modules/@boba/turing-hybrid-compute

        cp -r ${bobapkgs."@boba/contracts"}/contracts/node_modules/@ethersproject/{abstract-provider,abstract-signer} $out/node_modules/@ethersproject/
        cp -r ${bobapkgs."@boba/contracts"}/contracts/node_modules/@nomiclabs/{hardhat-etherscan,hardhat-waffle} \
          $out/node_modules/@nomiclabs

        cp -r ${bobapkgs."@boba/contracts"}/contracts/node_modules/@openzeppelin/{contracts,contracts-upgradeable} \
          $out/node_modules/@openzeppelin

        cp -r ${bobapkgs."@boba/contracts"}/contracts/node_modules/{chalk,dotenv,glob,patch-package} \
          $out/node_modules/
      '';
    };
  };
  oracle-min = pkgs.stdenv.mkDerivation {
    pname = "oracle-min";
    version = "0.0.1";
    builder = pkgs.writeTextFile {
      name = "builder.sh";
      text = ''
        . $stdenv/setup

        mkdir -p $out/node_modules/@eth-optimism
        ln -s ${commonts-min} $out/node_modules/@eth-optimism/common-ts

        cp -r ${bobapkgs."@boba/gas-price-oracle"}/gas-price-oracle/node_modules/{bcfg,chalk,dotenv,ethers,ganache-core,glob,google-spreadsheet,lodash,merkletreejs,patch-package,rlp,node-fetch} \
          $out/node_modules/
        cp -r ${bobapkgs."@boba/gas-price-oracle"}/gas-price-oracle/{package.json,scripts,dist,exec} \
          $out/
      '';
    };
  };
  register-min = pkgs.stdenv.mkDerivation {
    pname = "register-min";
    version = "0.0.1";
    builder = pkgs.writeTextFile {
      name = "builder.sh";
      text = ''
        . $stdenv/setup

        mkdir -p $out/node_modules/{@eth-optimism,@ethersproject,@nomiclabs,@openzeppelin}
        ln -s ${coreutils-min} $out/node_modules/@eth-optimism/core-utils
        ln -s ${contracts-min} $out/node_modules/@eth-optimism/contracts

        cp -r ${bobapkgs."@boba/register"}/register/node_modules/@ethersproject/{abstract-provider,abstract-signer} $out/node_modules/@ethersproject/

        cp -r ${bobapkgs."@boba/register"}/register/node_modules/@nomiclabs/hardhat-waffle \
          $out/node_modules/@nomiclabs/

        cp -r ${bobapkgs."@boba/register"}/register/node_modules/@openzeppelin/contracts \
          $out/node_modules/@openzeppelin/


        cp -r ${bobapkgs."@boba/register"}/register/node_modules/{chalk,dotenv,glob,patch-package} \
          $out/node_modules/
        cp -r ${bobapkgs."@boba/register"}/register/{package.json,addresses,bin} \
          $out/
      '';
    };
  };
  monitor-min = pkgs.stdenv.mkDerivation {
    pname = "monitor-min";
    version = "0.0.1";
    builder = pkgs.writeTextFile {
      name = "builder.sh";
      text = ''
        . $stdenv/setup

        mkdir -p $out/node_modules/{@boba,@eth-optimism,@ethersproject}
        ln -s ${coreutils-min} $out/node_modules/@eth-optimism/core-utils
        ln -s ${commonts-min} $out/node_modules/@eth-optimism/common-ts
        ln -s ${sdk-min} $out/node_modules/@eth-optimism/sdk
        ln -s ${contracts-min} $out/node_modules/@eth-optimism/contracts
        ln -s ${boba-contracts-min} $out/node_modules/@boba/contracts
        ln -s ${register-min} $out/node_modules/@boba/register

        cp -r ${bobapkgs."@boba/monitor"}/monitor/node_modules/@ethersproject/providers \
          $out/node_modules/@ethersproject/

        cp -r ${bobapkgs."@boba/monitor"}/monitor/node_modules/{axios,async-mutex,dotenv,ethers,lodash,mysql,node-fetch,web3,winston} \
          $out/node_modules/

        cp -r ${bobapkgs."@boba/monitor"}/monitor/{package.json,services,exec,wait-for-l1-and-l2.sh} \
          $out/
      '';
    };
  };
}
