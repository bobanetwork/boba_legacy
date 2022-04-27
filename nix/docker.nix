{ pkgs, bobapkgs, ... }:
{
  dtl-image = pkgs.dockerTools.buildLayeredImage {
    maxLayers = 125;
    name = "dtl";
    contents = [
      bobapkgs."@eth-optimism/data-transport-layer"
    ];
    config = {
      Cmd = [  ];
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
  l2geth-image = pkgs.dockerTools.buildLayeredImage {
    name = "l2geth";
    contents = with pkgs; [
      # From nixpkgs
      cacert
      curl
      jq

      # From boba
      bobapkgs."@eth-optimism/l2geth"
    ];
    config = {
      ExposedPorts = {
        "8545" = {};
        "8546" = {};
        "8547" = {};
      };
      Cmd = [ "${./..}/ops/scripts/geth.sh" ];
      #Cmd = [ "${bobapkgs."@eth-optimism/l2geth"}/bin/geth" ];
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
      Cmd = [ "${bobapkgs."@eth-optimism/hardhat-node"}/bin/hardhat node --network hardhat" ];
    };
  };
}
