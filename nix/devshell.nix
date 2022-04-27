{
  pkgs,
  bobapkgs,
}:

pkgs.devshell.mkShell {
  name = "Boba Network";
  packages = with pkgs; with bobapkgs; [
    nodePackages.lerna
    nodePackages.typescript
    nix-direnv
    bobapkgs."@eth-optimism/hardhat-node"
  ];

  commands = [
    { package = "go"; }
    { package = "yarn"; }
    { package = "nodePackages.typescript"; }
    { package = "arion"; }
    {
      package = "nodePackages.eslint";
      category = "linters";
    }

    # Custom commands to make nix easier
    {
      name = "boba-list";
      help = "List buildable packages from the monorepo";
      category = "build";
      command = "nix flake show";
    }
    {
      name = "boba-buildall";
      help = "build the optimism/boba monorepo";
      category = "build";
      command = "nix build .#";
    }
    {
      name = "hardhat-node";
      help = "run the hardhat node described in ops/docker/hardhat/hardhat.config.js";
      category = "run";
      command = "hardhat node --network hardhat";
    }
    {
      name = "boba-build";
      help = "build optimism/boba/package, eg: build '@eth-optimism/core-utils'";
      category = "build";
      command = "nix build $@";
    }
  ];
}
