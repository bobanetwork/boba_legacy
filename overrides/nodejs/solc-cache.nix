{ pkgs, ... }:
let
  # Create a solidity binaries cache. Compile these from source eventually
  amd64-list = builtins.fetchurl {
    url = "https://raw.githubusercontent.com/tgunnoe/solc-bin-test/master/hardhat-nodejs/compilers/linux-amd64/list.json";
    sha256 = "1jz29yy4fhavwjpk362gs9aczgjsf4jpgd92pr5afvzdgj1qr0ki";
  };
  solc-089-amd64 = builtins.fetchurl {
    url = "https://github.com/tgunnoe/solc-bin-test/raw/master/hardhat-nodejs/compilers/linux-amd64/solc-linux-amd64-v0.8.9+commit.e5eed63a";
    sha256 = "156b53bpy3aqmd8s7dyx9xsxk83w0mfcpmpqpam6nj9pmlgz2lgq";
  };
  solc-089-wasm = builtins.fetchurl {
    url = "https://github.com/tgunnoe/solc-bin-test/raw/master/hardhat-nodejs/compilers/wasm/soljson-v0.8.9+commit.e5eed63a.js";
    sha256 = "0b22s78s2fdywkcaykd04ih15ks7rhvbxhf6zmsh4ap3ma3zj9av";
  };
  solc-088-amd64 = builtins.fetchurl {
    url = "https://github.com/tgunnoe/solc-bin-test/raw/master/hardhat-nodejs/compilers/linux-amd64/solc-linux-amd64-v0.8.8+commit.dddeac2f";
    sha256 = "1c6bn1wa1m3b0h7qzcks7mrkzpk7iqxdx8rli7in2v0kdchv2xz6";
  };
  solc-066-amd64 = builtins.fetchurl {
    url = "https://github.com/tgunnoe/solc-bin-test/raw/master/hardhat-nodejs/compilers/linux-amd64/solc-linux-amd64-v0.6.6+commit.6c089d02";
    sha256 = "17ak1ahikf7drxjr4752jpzphsijarnw0s6vjxj99s82rkhd932x";
  };
  solc-066-wasm = builtins.fetchurl {
    url = "https://raw.githubusercontent.com/ethereum/solc-bin/gh-pages/bin/soljson-v0.6.6+commit.6c089d02.js";
    sha256 = "1hnbs71jbrz7sp3lcy7qcay0wz4g5fnw763p9hrmqb324s00kxh9";
  };
  solc-0517-amd64 = builtins.fetchurl {
    url = "https://github.com/tgunnoe/solc-bin-test/raw/master/hardhat-nodejs/compilers/linux-amd64/solc-linux-amd64-v0.5.17+commit.d19bba13";
    sha256 = "1wqnkvqs2cs4xcckgny1ha55sbhvak4287lb2xy799gzsfjffp63";
  };
  solc-0517-wasm = builtins.fetchurl {
    url = "https://github.com/tgunnoe/solc-bin-test/raw/master/hardhat-nodejs/compilers/wasm/soljson-v0.5.17+commit.d19bba13.js";
    sha256 = "0d2pz9cy2p6wiw613kwhqd4wcq5xr9m5idvzgw8mwqfwzpqx7lbz";
  };
  solc-0411-amd64 = builtins.fetchurl {
    url = "https://github.com/tgunnoe/solc-bin-test/raw/master/hardhat-nodejs/compilers/linux-amd64/solc-linux-amd64-v0.4.11+commit.68ef5810";
    sha256 = "1skz68p6l6f9gzf4ffq17k63jirwp8jc1v8jhdprw0s5wa71738a";
  };
  solc-0411-wasm = builtins.fetchurl {
    url = "https://raw.githubusercontent.com/ethereum/solc-bin/gh-pages/wasm/soljson-v0.4.11+commit.68ef5810.js";
    sha256 = "01phl48360y99261gmrzpyqmi7z80akdpcgrw9bxch5qz1sc5cyy";
  };

  wasm-list = builtins.fetchurl {
    url = "https://github.com/tgunnoe/solc-bin-test/raw/master/hardhat-nodejs/compilers/wasm/list.json";
    sha256 = "1kcpz9a74jss9kgy3nfhlvwbryv5i9db214g53pcrr0h62g9ikss";
  };
in
pkgs.stdenv.mkDerivation rec {
  pname = "solc-cache";
  version = "0.0.1";
  builder = pkgs.writeTextFile {
    name = "builder.sh";
    text = ''
      . $stdenv/setup
      mkdir -p $out/hardhat-nodejs/compilers/linux-amd64/
      mkdir -p $out/hardhat-nodejs/compilers/wasm/
      ln -sf ${amd64-list} $out/hardhat-nodejs/compilers/linux-amd64/list.json
      ln -sf ${wasm-list} $out/hardhat-nodejs/compilers/wasm/list.json
      ln -sf ${solc-089-amd64} $out/hardhat-nodejs/compilers/linux-amd64/solc-linux-amd64-v0.8.9+commit.e5eed63a
      ln -sf ${solc-088-amd64} $out/hardhat-nodejs/compilers/linux-amd64/solc-linux-amd64-v0.8.8+commit.dddeac2f
      ln -sf ${solc-066-amd64} $out/hardhat-nodejs/compilers/linux-amd64/solc-linux-amd64-v0.6.6+commit.6c089d02
      ln -sf ${solc-0517-amd64} $out/hardhat-nodejs/compilers/linux-amd64/solc-linux-amd64-v0.5.17+commit.d19bba13
      ln -sf ${solc-0411-amd64} $out/hardhat-nodejs/compilers/linux-amd64/solc-linux-amd64-v0.4.11+commit.68ef5810
      ln -sf ${solc-0517-wasm} $out/hardhat-nodejs/compilers/wasm/soljson-v0.5.17+commit.d19bba13.js
      ln -sf ${solc-0411-wasm} $out/hardhat-nodejs/compilers/wasm/soljson-v0.4.11+commit.68ef5810.js
      ln -sf ${solc-089-wasm} $out/hardhat-nodejs/compilers/wasm/soljson-v0.8.9+commit.e5eed63a.js
      ln -sf ${solc-066-wasm} $out/hardhat-nodejs/compilers/wasm/soljson-v0.6.6+commit.6c089d02.js
    '';
  };
}
