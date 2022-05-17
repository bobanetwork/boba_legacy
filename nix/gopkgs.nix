{ self, pkgs, bobapkgs, ... }:
{
  "@eth-optimism/l2geth" = pkgs.buildGoModule {
    pname = "l2geth";
    version = "0.5.11";
    src = ../l2geth;
    doCheck = false;

    # Use fakeSha256 when the dependencies change
    #vendorSha256 = pkgs.lib.fakeSha256;
    vendorSha256 = "sha256-4/x/ixgTKq9rTqluKZT8JCyjwY+AeKT27SfIfB2rsfA=";
    outputs = [ "out" "geth" "clef" "abigen" ];

    # Move binaries to separate outputs and symlink them back to $out
    postInstall = pkgs.lib.concatStringsSep "\n" (
      builtins.map (bin: "mkdir -p \$${bin}/bin && mv $out/bin/${bin} \$${bin}/bin/ && ln -s \$${bin}/bin/${bin} $out/bin/") [ "geth" "clef" "abigen" ]
    );
    proxyVendor = true;
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

    #   buildInputs = old: old ++ [

    #   ];
    #   installPhase = ''
    #     ln -s ${l2geth.geth}/bin $out/bin
    #     rm -rf $out/lib
    #   '';
    # };
    #  };
  "@eth-optimism/batch-submitter" =
    let
      version = "0.1.3";
      # This should ideally come from self.rev
      git-commit = "599c4d3e84906238f1166ff7a063c7166c75749c";
      git-date = toString self.lastModified;
      postPatch = ''
        substituteInPlace './go.mod' \
          --replace '../../l2geth' './l2geth' \
          --replace '../bss-core' './bss-core'
        cp -r ${./..}/go/bss-core/ ${./..}/l2geth/ ./
      '';
    in pkgs.buildGoModule {
      inherit postPatch;
      pname = "batch-submitter";
      version = version;
      src = ./../go/batch-submitter;
      doCheck = true;
      ldflags = [
        "-X=main.GitCommit=${git-commit}"
        "-X=main.GitDate=${git-date}"
        "-X=main.GitVersion=${version}"
      ];
      # Use fakeSha256 when the dependencies change
      #vendorSha256 = pkgs.lib.fakeSha256;
      vendorSha256 = "sha256-fOOG78JZfke9EEbxT7R9zn3BhRiRyB0JjqSPa2fvPyg=";
      outputs = [ "out" ];
      # Generates the bindings using abigen with the contracts derivation
      # Doesn't work as of yet, because they point to imports from ethereum-optimism/l2geth
      #  and not ethereum/go-ethereum as the current directory's bindings have
      # preConfigure =
      #   let
      #     ctc = "${bobapkgs."@eth-optimism/contracts"}/contracts/artifacts/contracts/L1/rollup/CanonicalTransactionChain.sol/CanonicalTransactionChain.json";
      #     scc = "${bobapkgs."@eth-optimism/contracts"}/contracts/artifacts/contracts/L1/rollup/StateCommitmentChain.sol/StateCommitmentChain.json";
      #   in
      #   ''
      #     mkdir -p bindings/{ctc,scc}/
      #     temp=$(mktemp)
      #     temp2=$(mktemp)
      #     cat ${ctc} \
      #       | ${pkgs.jq}/bin/jq -r .bytecode > $temp

	    #     cat ${ctc} \
      #       | ${pkgs.jq}/bin/jq .abi \
      #       | ${bobapkgs."@eth-optimism/l2geth".abigen}/bin/abigen --pkg ctc \
      #       --abi - \
      #       --out bindings/ctc/canonical_transaction_chain.go \
      #       --type CanonicalTransactionChain \
      #       --bin $temp
      #     cat ${scc} \
      #       | ${pkgs.jq}/bin/jq -r .bytecode > $temp2

	    #     cat ${scc} \
      #       | ${pkgs.jq}/bin/jq .abi \
      #       | ${bobapkgs."@eth-optimism/l2geth".abigen}/bin/abigen --pkg scc \
      #       --abi - \
      #       --out bindings/scc/state_commitment_chain.go \
      #       --type StateCommitmentChain \
      #       --bin $temp2

      #     rm $temp $temp2

      #     substituteInPlace './bindings/ctc/canonical_transaction_chain.go' \
      #       --replace 'ethereum-optimism/optimism/l2geth' 'ethereum/go-ethereum'

      #     substituteInPlace './bindings/scc/state_commitment_chain.go' \
      #       --replace 'ethereum-optimism/optimism/l2geth' 'ethereum/go-ethereum'

      #   '';
      #proxyVendor = true;
      subPackages = [
        "cmd/batch-submitter"
      ];

      overrideModAttrs = (_: {
        # This should be a patch instead
        patches = [];
        inherit postPatch;
      });

    };
}
