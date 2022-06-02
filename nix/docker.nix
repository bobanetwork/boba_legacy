{ pkgs, bobapkgs, nix2containerPkgs, ... }:
let
  tag = "nix";
  buildImage = nix2containerPkgs.nix2container.buildImage;
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
rec {
  docker-images = let
    image-list = [
      "dtl"
      "deployer"
      "boba-deployer"
      "batch-submitter"
      "l2geth"
      "hardhat"
      "gas-price-oracle"
      "monitor"
      "relayer"
      "integration-tests"
      "fraud-detector"
    ];
    in pkgs.stdenv.mkDerivation {
    name = "docker-images";
    #outputs = [ "out" ] ++ image-list;
    phases = [ "buildPhase" "installPhase" ];
    buildPhase = ''
      mkdir -p $out
    '';
    # installPhase = pkgs.lib.concatStringsSep "\n" (
    #   builtins.map (image: "ln -s \$${image} $out/") image-list
    # );
    installPhase = ''
      ln -s ${dtl} $out/
      ln -s ${deployer} $out/
      ln -s ${boba-deployer} $out/
      ln -s ${batch-submitter} $out/
      ln -s ${l2geth} $out/
      ln -s ${hardhat} $out/
      ln -s ${gas-price-oracle} $out/
      ln -s ${monitor} $out/
      ln -s ${relayer} $out/
      ln -s ${integration-tests} $out/
      ln -s ${fraud-detector} $out/
    '';
  };
  dtl = buildImage {
    name = "dtl";
    tag = tag;
    maxLayers = 125;
    contents = with pkgs; [
      curl
      bash
      jq
    ];
    config = {
      WorkingDir = "${bobapkgs.dtl-min}/";
      EntryPoint = [
        "${pkgs.nodejs}/bin/node"
        "${bobapkgs.dtl-min}/dist/src/services/run.js"
      ];
    };
  };

  deployer =
    let
      optimism-contracts = bobapkgs.contracts-min;
    in buildImage {
      name = "deployer";
      tag = tag;
      config = {
        env = [ "PATH=${optimism-contracts}/bin/:${scripts}/scripts/:${pkgs.yarn}/bin/" ];
        workingdir = "${optimism-contracts}/";
        entrypoint = [
          "${pkgs.yarn}/bin/yarn"
          "--cwd"
          "${optimism-contracts}/"
          "run"
          "deploy"
        ];
      };
    };
  boba-deployer =
    let
      boba-contracts = bobapkgs.boba-contracts-min;
    in buildImage {
      name = "boba_deployer";
      tag = tag;
      config = {
        Env = [ "PATH=${boba-contracts}/bin/:${scripts}/scripts/" ];
        WorkingDir = "${boba-contracts}/";
        Entrypoint = [
          "${scripts}/scripts/wait-for-l1-and-l2.sh"
          "${scripts}/scripts/deploy.sh"
        ];
      };
    };
  # Adapted from ops/docker/Dockerfile.batch-submitter
  batch-submitter = let
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

  in buildImage {
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
  l2geth =
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
    in buildImage {
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
  hardhat = buildImage {
    name = "l1_chain";
    tag = tag;
    config = {
      ExposedPorts = {
        "8545" = {};
      };
      Cmd = [ "${bobapkgs."@eth-optimism/hardhat-node"}/bin/hardhat" "node" "--network" "hardhat" ];
    };
  };
  gas-price-oracle = buildImage {
    name = "boba_gas-price-oracle";
    tag = tag;
    config = {
      WorkingDir = "${bobapkgs.oracle-min}/";
      EntryPoint = [
        "${scripts}/scripts/wait-for-l1-and-l2.sh"
        "${pkgs.nodejs}/bin/node"
        "${bobapkgs.oracle-min}/exec/run-gas-price-oracle.js"
      ];
    };
  };
  monitor = buildImage {
    name = "monitor";
    tag = tag;
    config = {
      WorkingDir = "${bobapkgs.monitor-min}/monitor";
      Env = [ "PATH=${pkgs.nodejs}/bin/:${pkgs.yarn}/bin/" ];
      EntryPoint = [
        "${pkgs.yarn}/bin/yarn"
        "start"
      ];
    };
  };
  relayer =
    let
      relayer = bobapkgs.message-relayer-min;
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
    in buildImage {
      name = "message-relayer";
      tag = tag;
      config = {
        Env = [ "PATH=${relayer}/bin/:${wait-script}/scripts/:${relayer-scripts}/scripts/:${pkgs.yarn}/bin/" ];
        WorkingDir = "${relayer}/";
        Entrypoint = [
          "${pkgs.nodePackages.npm}/bin/npm"
          "run"
          "start"
        ];
      };
    };
  integration-tests =
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

    in buildImage {
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
  fraud-detector =
    let
      fraud-detector = pkgs.stdenv.mkDerivation {
        name = "fraud-detector";
        phases = [ "installPhase" ];
        installPhase = ''
          mkdir -p $out/contracts/
          cp -r ${./../boba_community/fraud-detector}/packages/jsonrpclib $out/
          cp ${bobapkgs.contracts-min}/artifacts/contracts/L1/rollup/StateCommitmentChain.sol/StateCommitmentChain.json $out/contracts/
          cp ${bobapkgs.contracts-min}/artifacts/contracts/libraries/resolver/Lib_AddressManager.sol/Lib_AddressManager.json $out/contracts/
        '';
      };
    in buildImage {
    name = "fraud-detector";
    tag = tag;
    # runAsRoot = ''
    #   #!${pkgs.runtimeShell}
    #   mkdir -p /db
    # '';
    config = {
      WorkingDir = "${fraud-detector}/";
      Cmd = [ "${pkgs.python3}/bin/python" "-u" "${./../boba_community/fraud-detector}/fraud-detector.py" ];
    };
  };
}
