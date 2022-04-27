{ bobapkgs, pkgs }:
{
  default = import ./devshell.nix { inherit bobapkgs pkgs; };
  "@eth-optimism/data-transport-layer" = pkgs.devshell.mkShell {
    name = "Data Transport Layer";
    devshell.startup.node-env.text = "export PATH=$PATH:${bobapkgs."@eth-optimism/data-transport-layer"}/.bin";
  };
  "@eth-optimism/contracts" = pkgs.devshell.mkShell {
    name = "Optimism Contracts";
    devshell.startup.node-env.text = "export PATH=$PATH:${bobapkgs."@eth-optimism/contracts"}/lib/node_modules/.bin";
    packages = with pkgs; with bobapkgs; [
      bobapkgs."@eth-optimism/hardhat-node"
    ];

    commands = [
      {
        name = "build";
        help = "build with hardhat, eg: hardhat compile";
        category = "build";
        command = "hardhat compile $@";
      }
      {
        name = "test";
        help = "test contracts with hardhat";
        category = "test";
        command = "hardhat test $@";
      }
      {
        name = "validate";
        help = "validate contracts with hardhat";
        category = "validate";
        command = "hardhat validateOutput $@";
      }
    ];
  };
}
