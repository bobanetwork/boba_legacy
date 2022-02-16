{
  description = "Boba stack with Optimism";

  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixos-21.11";
  #inputs.nixpkgs.url = "path:/home/tgunnoe/src/nixpkgs";
  #inputs.dream2nix.url = "github:nix-community/dream2nix";
  inputs.dream2nix.url = "path:/home/tgunnoe/src/boba/dream2nix";
  inputs.dream2nix.inputs.nixpkgs.follows = "nixpkgs";
  inputs.hardhat-src.url = "github:nomiclabs/hardhat";
  inputs.hardhat-src.flake = false;

  outputs = { self, nixpkgs, dream2nix, hardhat-src }@inp:
    let

      version = builtins.substring 0 8 self.lastModifiedDate;

      supportedSystems = [ "x86_64-linux" "x86_64-darwin" "aarch64-linux" "aarch64-darwin" ];

      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;

      nixpkgsFor = forAllSystems (system: import nixpkgs { inherit system; });

      dream2nix = inp.dream2nix.lib.init {
        systems = supportedSystems;
        # config = {
        #   packagesDir = "./packages";
        #   repoName = "optimism";
        #   # overridesDirs = [ "${inputs.dream2nix}/overrides" ];
        # };
      };
    in
    {
      packages = forAllSystems (system:
        let
          pkgs = nixpkgsFor.${system};
        in
          {
            hardhat = (dream2nix.riseAndShine {
              source = hardhat-src;
              packageOverrides = {
                root = {
                  add-inputs = {
                    nativeBuildInputs = old: old ++ [
                      pkgs.nodePackages.yarn
                    ];
                  };
                  build = {
                    preBuild = { outputs, ... }: ''
                      # link dependencies of subpackage
                      ln -s \
                      ${outputs.subPackages.root-subpackage.packages.root-subpackage}/lib/node_modules/root-subpackage/node_modules \
                      ./src/node_modules

                    '';
                    buildScript = ''
                      echo "Evaluating buildScript"
                      yarn --offline build
                    '';

                    #dontStrip = false;
                    #installMethod = "copy";
                  };
                };
              };
            }).defaultPackage.${system};

            base = (dream2nix.riseAndShine {
              source = ./.;
              packageOverrides = {
                optimism = {
                  add-inputs = {
                    nativeBuildInputs = old: old ++ [
                      pkgs.yarn
                      self.packages.${system}.hardhat
                      # pkgs.nodePackages_latest.yarn
                      pkgs.nodePackages.lerna
                    ];
                    buildInputs = old: old ++ [
                    ];
                  };
                };
              };
            }).defaultPackage.${system};

            l2geth = pkgs.buildGoModule {
              pname = "l2geth";
              inherit version;

              src = ./l2geth;

              doCheck = false;

              # Use fakeSha256 when the dependencies change
              #vendorSha256 = pkgs.lib.fakeSha256;
              vendorSha256 = "sha256-WWHq7hkCAaLb/lL4nthvO1CxoAstk3ehs/U8a7JjZ9I=";
              outputs = [ "out" "geth" "clef" ];

              # Move binaries to separate outputs and symlink them back to $out
              postInstall = pkgs.lib.concatStringsSep "\n" (
                builtins.map (bin: "mkdir -p \$${bin}/bin && mv $out/bin/${bin} \$${bin}/bin/ && ln -s \$${bin}/bin/${bin} $out/bin/") [ "geth" "clef" ]
              );
              proxyVend = true;
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
            l2geth-image = pkgs.dockerTools.buildImage {
              name = "l2geth";
              contents = [
                #l2geth
                pkgs.bash
              ];
              config = {
                Cmd = [ "bash" ];
              };
            };
        }
      );


      defaultPackage = forAllSystems (system: self.packages.${system}.base);
    };
}
