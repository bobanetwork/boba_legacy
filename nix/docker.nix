{ pkgs, bobapkgs, ... }:
let
  tag = "nix";
  wait-script = pkgs.stdenv.mkDerivation {
    name = "scripts";
    phases = [ "installPhase" ];
    installPhase = ''
      mkdir -p $out/scripts
      chmod +x $out/scripts
      cp ${./..}/ops/scripts/wait-for-l1-and-l2.sh $out/scripts/
      substituteInPlace $out/scripts/wait-for-l1-and-l2.sh \
        --replace '/bin/bash' '${pkgs.bash}/bin/bash' \
        --replace 'curl' '${pkgs.curl}/bin/curl' \
        --replace 'sleep' '${pkgs.coreutils}/bin/sleep'
    '';
  };
  scripts = pkgs.stdenv.mkDerivation {
    name = "scripts";
    phases = [ "installPhase" ];
    installPhase = ''
      mkdir -p $out/scripts
      chmod +x $out/scripts
      cp ${./..}/ops/scripts/deployer.sh $out/scripts/
      cp ${./..}/ops/scripts/wait-for-l1-and-l2.sh $out/scripts/
      substituteInPlace $out/scripts/deployer.sh \
        --replace '/bin/bash' '${pkgs.bash}/bin/bash' \
        --replace 'curl' '${pkgs.curl}/bin/curl'
      substituteInPlace $out/scripts/wait-for-l1-and-l2.sh \
        --replace '/bin/bash' '${pkgs.bash}/bin/bash' \
        --replace 'curl' '${pkgs.curl}/bin/curl' \
        --replace 'sleep' '${pkgs.coreutils}/bin/sleep'
      chmod +x $out/scripts/wait-for-l1-and-l2.sh
    '';
  };
in
{
  dtl-image = pkgs.dockerTools.buildImage {
    name = "dtl";
    tag = tag;
    runAsRoot = ''
      mkdir -p ./state-dumps
    '';
    contents = with pkgs; [
      curl
      bash
      jq
    ];
    config = {
      WorkingDir = "${bobapkgs."@eth-optimism/data-transport-layer"}/lib/node_modules/@eth-optimism/data-transport-layer";
      EntryPoint = [
        "${pkgs.nodejs}/bin/node"
        "${bobapkgs."@eth-optimism/data-transport-layer"}/dist/src/services/run.js"
      ];
    };
  };
  deployer-image =
    let
      optimism-contracts = bobapkgs."@eth-optimism/contracts";
    in pkgs.dockerTools.buildLayeredImage {
      name = "deployer";
      tag = tag;
      config = {
        Env = [ "PATH=${optimism-contracts}/bin/:${scripts}/scripts/:${pkgs.yarn}/bin/" ];
        WorkingDir = "${optimism-contracts}/contracts";
        Entrypoint = [
          "${pkgs.yarn}/bin/yarn"
          "--cwd"
          "${optimism-contracts}/contracts"
          "run"
          "deploy"
        ];
      };
    };
  boba-deployer-image =
    let
      boba-contracts = bobapkgs."@boba/contracts";
    in pkgs.dockerTools.buildImage {
      name = "boba_deployer";
      tag = tag;
      config = {
        Env = [ "PATH=${boba-contracts}/bin/:${scripts}/scripts/" ];
        WorkingDir = "${boba-contracts}/contracts";
        Entrypoint = [
          "${scripts}/scripts/wait-for-l1-and-l2.sh"
          "${scripts}/scripts/deploy.sh"
        ];
      };
    };
  # Adapted from ops/docker/Dockerfile.batch-submitter
  batch-submitter-image = let
    script = pkgs.stdenv.mkDerivation {
      name = "script";
      phases = [ "installPhase" ];
      installPhase = ''
        mkdir -p $out/scripts
        cp ${./..}/ops/scripts/batch-submitter.sh $out/scripts/
        substituteInPlace $out/scripts/batch-submitter.sh \
          --replace 'jq -r' '${pkgs.jq}/bin/jq' \
          --replace 'curl' '${pkgs.curl}/bin/curl'
        chmod +x $out/scripts/batch-submitter.sh
      '';
    };

  in pkgs.dockerTools.buildImage {
    name = "go-batch-submitter";
    tag = tag;
    contents = with pkgs; [
      # From nixpkgs
      cacert
      jq
    ];
    config = {
      Env = [
        "PATH=${bobapkgs."@eth-optimism/batch-submitter"}/bin/:${script}/scripts/"
      ];
      EntryPoint = [
        "${bobapkgs."@eth-optimism/batch-submitter"}/bin/batch-submitter"
      ];
    };
  };

  # Adapted from ops/docker/Dockerfile.geth
  l2geth-image =
    let
      script = pkgs.stdenv.mkDerivation {
        name = "geth.sh";
        phases = [ "installPhase" ];
        installPhase = ''
          mkdir -p $out/scripts
          cp ${./../.}/ops/scripts/geth.sh $out/scripts/
          substituteInPlace $out/scripts/geth.sh --replace \
            'curl' '${pkgs.curl}/bin/curl'
        '';
      };
    in pkgs.dockerTools.buildImage {
      name = "l2geth";
      tag = tag;
      contents = with pkgs; [
        # From nixpkgs
        cacert
        jq
      ];
      config = {
        ExposedPorts = {
          "8545" = {};
          "8546" = {};
          "8547" = {};
        };
        WorkingDir = "${script}/scripts/";
        Env = [
          "PATH=${bobapkgs."@eth-optimism/l2geth".geth}/bin/"
        ];
        EntryPoint = [
          "geth"
        ];
      };
    };
  hardhat-image = pkgs.dockerTools.buildLayeredImage {
    name = "l1_chain";
    tag = tag;
    config = {
      ExposedPorts = {
        "8545" = {};
      };
      Cmd = [ "${bobapkgs."@eth-optimism/hardhat-node"}/bin/hardhat" "node" "--network" "hardhat" ];
    };
  };
  gas-price-oracle-image = pkgs.dockerTools.buildImage {
    name = "boba_gas-price-oracle";
    tag = tag;
    config = {
      WorkingDir = "${bobapkgs."@boba/gas-price-oracle"}/lib/node_modules/@boba/gas-price-oracle";
      EntryPoint = [
        "${scripts}/scripts/wait-for-l1-and-l2.sh"
        "${pkgs.nodejs}/bin/node"
        "${bobapkgs."@boba/gas-price-oracle"}/bin/gas-price-oracle"
      ];
    };
  };
  monitor-image = pkgs.dockerTools.buildImage {
    name = "monitor";
    tag = tag;
    config = {
      WorkingDir = "${bobapkgs."@boba/monitor"}/lib/node_modules/@boba/monitor";
      Env = [ "PATH=${pkgs.nodejs}/bin/:${pkgs.yarn}/bin/" ];
      EntryPoint = [
        "${pkgs.yarn}/bin/yarn"
        "start"
      ];
    };
  };
  relayer-image =
    let
      relayer = bobapkgs."@eth-optimism/message-relayer";
      relayer-scripts = pkgs.stdenv.mkDerivation {
        name = "scripts";
        phases = [ "installPhase" ];
        installPhase = ''
          mkdir -p $out/scripts
          chmod +x $out/scripts
          cp ${./..}/ops/scripts/relayer.sh $out/scripts/
          cp ${./..}/ops/scripts/relayer-fast.sh $out/scripts/
          substituteInPlace $out/scripts/relayer.sh \
            --replace '/bin/bash' '${pkgs.bash}/bin/bash' \
            --replace 'curl' '${pkgs.curl}/bin/curl' \
            --replace 'sleep' '${pkgs.coreutils}/bin/sleep'
          substituteInPlace $out/scripts/relayer-fast.sh \
            --replace '/bin/bash' '${pkgs.bash}/bin/bash' \
            --replace 'curl' '${pkgs.curl}/bin/curl' \
            --replace 'sleep' '${pkgs.coreutils}/bin/sleep'
        '';
      };
    in pkgs.dockerTools.buildLayeredImage {
      name = "message-relayer";
      tag = tag;
      config = {
        Env = [ "PATH=${relayer}/bin/:${wait-script}/scripts/:${relayer-scripts}/scripts/:${pkgs.yarn}/bin/" ];
        WorkingDir = "${relayer}/lib/node_modules/@eth-optimism/message-relayer/";
        Entrypoint = [
          "${pkgs.nodePackages.npm}/bin/npm"
          "run"
          "start"
        ];
      };
    };
  integration-tests-image =
    let
      script = pkgs.stdenv.mkDerivation {
        name = "integration-tests.sh";
        phases = [ "installPhase" ];
        installPhase = ''
          mkdir -p $out/scripts
          cp ${./../.}/ops/scripts/integration-tests.sh $out/scripts/
          substituteInPlace $out/scripts/integration-tests.sh \
            --replace '/bin/bash' '${pkgs.bash}/bin/bash' \
            --replace 'curl' '${pkgs.curl}/bin/curl' \
            --replace 'cat ./hardhat.config.ts' '${pkgs.coreutils}/bin/cat ./hardhat.config.ts' \
            --replace 'npx' '${pkgs.nodePackages.npm}/bin/npx'
        '';
      };

    in pkgs.dockerTools.buildImage {
      name = "integration-tests";
      tag = tag;
      config = {
        WorkingDir = "${bobapkgs."@eth-optimism/integration-tests"}/lib/node_modules/@eth-optimism/integration-tests/";
        Env = [
          "PATH=${pkgs.nodejs}/bin/:${pkgs.yarn}/bin/:${bobapkgs."@eth-optimism/hardhat-node"}/bin/:${script}/scripts/"
        ];
        EntryPoint = [
          "${pkgs.yarn}/bin/yarn"
          "test:integration"
        ];
      };
    };
  fraud-detector-image =
    let
      fraud-detector = pkgs.stdenv.mkDerivation {
        name = "fraud-detector";
        phases = [ "installPhase" ];
        installPhase = ''
          mkdir -p $out/contracts/
          cp -r ${./../boba_community/fraud-detector}/packages/jsonrpclib $out/
          cp ${bobapkgs."@eth-optimism/contracts"}/contracts/artifacts/contracts/L1/rollup/StateCommitmentChain.sol/StateCommitmentChain.json $out/contracts/
          cp ${bobapkgs."@eth-optimism/contracts"}/contracts/artifacts/contracts/libraries/resolver/Lib_AddressManager.sol/Lib_AddressManager.json $out/contracts/
        '';
      };
    in pkgs.dockerTools.buildImage {
    name = "fraud-detector";
    tag = tag;
    runAsRoot = ''
      #!${pkgs.runtimeShell}
      mkdir -p /db
    '';
    config = {
      WorkingDir = "${fraud-detector}/";
      Cmd = [ "${pkgs.python3}/bin/python" "-u" "${./../boba_community/fraud-detector}/fraud-detector.py" ];
    };
  };
}
