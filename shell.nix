{
  pkgs,
  bobapkgs,
}:

pkgs.devshell.mkShell {
  name = "Boba Network";
  packages = with pkgs; with bobapkgs; [
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
