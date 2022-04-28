{ pkgs, bobapkgs, ... }:
{
  dtl-image = pkgs.dockerTools.buildLayeredImage {
    maxLayers = 125;
    name = "dtl";
    config = {
      Cmd = [  ];
      EntryPoint = [ "${pkgs.nodejs}/bin/node" "${bobapkgs."@eth-optimism/data-transport-layer"}/dist/src/services/run.js" ];
    };
  };
  deployer-image = pkgs.dockerTools.buildLayeredImage {
    maxLayers = 125;
    name = "deployer";
    contents = let
      script = pkgs.stdenv.mkDerivation {
        name = "startup";
        phases = [ "installPhase" ];
        installPhase = ''
          mkdir -p $out/bin
          cp ${./..}/ops/scripts/deployer.sh $out/bin/
          chmod +x $out/bin
        '';
      };
    in
      [
        bobapkgs."@boba/turing-hybrid-compute"
        bobapkgs."@eth-optimism/contracts"
        script
      ];
    config = {
      Entrypoint = [ "yarn run deploy" ];
      Cmd = [ "${./..}/ops/scripts/deployer.sh" ];
    };
  };
  # Adapted from ops/docker/Dockerfile.geth
  l2geth-image =
    let
      l2geth = pkgs.stdenv.mkDerivation {
        name = "l2geth";
        phases = [ "installPhase" ];
        installPhase = ''
          mkdir -p $out/bin
          ln -s ${bobapkgs."@eth-optimism/l2geth"}/bin/geth $out/bin/geth
          cp ${./../.}/ops/scripts/geth.sh $out/bin/start
          substituteInPlace $out/bin/start --replace \
            'curl' \
            '${pkgs.curl}/bin/curl'
        '';
      };
    in pkgs.dockerTools.buildLayeredImage {
      name = "l2geth";
      contents = with pkgs; [
        # From nixpkgs
        cacert
        jq
        coreutils

        # The above script from ops
        l2geth
      ];
      config = {
        ExposedPorts = {
          "8545" = {};
          "8546" = {};
          "8547" = {};
        };
        Cmd = [ ];
        Env = [
          "PATH=${pkgs.coreutils}/bin/"
        ];
        EntryPoint = [
          "${l2geth}/bin/geth"
        ];
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
      Cmd = [ "${bobapkgs."@eth-optimism/hardhat-node"}/bin/hardhat" "node" "--network" "hardhat" ];
    };
  };
}
