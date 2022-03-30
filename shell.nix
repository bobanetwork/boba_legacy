{
  self,
  system,
  pkgs,
  hardhat,
}:

pkgs.devshell.mkShell {
  name = "Boba Network";
  packages = with pkgs; [
    self.packages.${system}."@eth-optimism/data-transport-layer"
    #hardhat.packages.${system}.hardhat
    nodePackages.lerna
    nodePackages.typescript
    nodePackages.yarn
    nix-direnv
  ];

  commands = [
    {
      name = "fmt";
      help = "Check Nix formatting";
      category = "linters";
      command = "nixpkgs-fmt $${@} .";
    }
    {
      name = "evalnix";
      help = "Check Nix parsing";
      category = "linters";
      command = "fd --extension nix --exec nix-instantiate --parse --quiet {} >/dev/null";
    }
  ];
}
