{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-21.11";
    dream2nix = {
      #url = "github:nix-community/dream2nix";
      # while waiting fy my PRs to be merged above:
      url = "github:tgunnoe/dream2nix/workspace-name-fix";
      #url = "path:/home/tgunnoe/src/boba/dream2nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    flake-utils = {
      url = "github:numtide/flake-utils";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, flake-utils, dream2nix }@inputs:
    let
      lib = nixpkgs.lib;

      supportedSystems = [ "x86_64-linux" "x86_64-darwin" "aarch64-linux" "aarch64-darwin" ];

      dream2nix = inputs.dream2nix.lib2.init {
        systems = supportedSystems;
        #pkgs = pkgs;
        config.projectRoot = ./. ;
        config.overridesDirs = [ ./overrides ];
      };

    in
      lib.recursiveUpdate
        (dream2nix.makeFlakeOutputs {
          pname = "boba";
          source = ./. ;
          inject = {
            express-prom-bundle."6.4.1" = [
              ["prom-client" "13.2.0"]
            ];
          };

        })
        {
          #packages = boba.packages;
          #apps = boba.apps;

          #defaultPackage."x86_64-linux" = self.packages."x86_64-linux".optimism;
        };
}
