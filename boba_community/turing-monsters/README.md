# Turing Monster Minting

- [Turing Monster Minting](#turing-monster-minting)
  * [Basics](#basics)
  * [Mint your Monster!](#mint-your-monster)
  * [Getting Rinkeby ETH and Rinkeby BOBA](#getting-rinkeby-eth-and-rinkeby-boba)
  * [Deploying the Turing Monster NFT](#deploying-the-turing-monster-nft)
  * [Solidity Code Walkthrough](#solidity-code-walkthrough)

## Basics

This readme assumes you have certain widely used packages installed on your computer. For example, for Ubuntu Desktop 20.04 the steps would be the following. Open a terminal, and then:

```bash
$ sudo apt update
$ sudo apt full-upgrade
$ sudo apt install git
$ sudo apt install curl
$ sudo apt install nodejs
$ npm install --global yarn
```

## Mint your Monster!

Clone the repository, open it, and install packages with `yarn`:

```bash
$ git clone https://github.com/bobanetwork/boba.git
$ cd optimism-v2
$ yarn
$ yarn build
```

As for every chain, you need an account with some ETH (to deploy contracts) and since you will be using Turing, you also need some BOBA in that same account. In the deploy script (`/test/NFT_monster.ts`), specify your private key:

```javascript

// uncomment the correct addresses

// Rinkeby
// const BOBAL2Address = '0xF5B97a4860c1D81A1e915C40EcCB5E4a5E6b8309'
// const BobaTuringCreditRinkebyAddress = '0x208c3CE906cd85362bd29467819d3AcbE5FC1614'

// for example if you are on Mainnet-Test, uncomment these

// Mainnet-Test
const BOBAL2Address = '0x58597818d1B85EF96383884951E846e9D6D03956'
const BobaTuringCreditRinkebyAddress = '0xE654ba86Ea0B59a6836f86Ec806bfC9449D0aD0A'

// provide your PK here
const testPrivateKey = '0x____'

```

You can also do this via a hardware wallet, a mnemonic, via `hardhat.config.js`, or whatever you usually do. Whatever account/key you use, it needs some ETH and BOBA - small amounts should be sufficient.

## Getting Rinkeby ETH and Rinkeby BOBA

If you do not have Rinkeby ETH, you can get some from [Rinkeby Faucet](https://www.rinkebyfaucet.com/) or [Rinkeby Authenticated Faucet](https://www.rinkeby.io/#faucet). For some Rinkeby BOBA, use the [BOBA faucet](https://faucets.boba.network). The BOBA faucet will also give you some ETH if needed.

## Deploying the Turing Monster NFT

Run

```bash
$ cd boba_community/turing-monsters
$ yarn build
$ yarn test:rinkeby # for testing on rinkeby, for example

# other choces are local and mainnet
```

Ok, all done. Enjoy. The terminal will give you all the information you need to mint and send a Turing monster to your friends:

```
  Turing NFT Random 256
    Turing Helper contract deployed at 0x3a622DB2db50f463dF562Dc5F341545A64C580fc
    ERC721 contract deployed at 0x6A47346e722937B60Df7a1149168c0E76DD6520f
    adding your ERC721 as PermittedCaller to TuringHelper 0x0000000000000000000000006a47346e722937b60df7a1149168c0e76dd6520f
    Credit Prebalance 0
    BOBA Balance in your account 140000000000000000000
    ✓ Should register and fund your Turing helper contract in turingCredit (196ms)
    ERC721 contract whitelisted in TuringHelper (1 = yes)? 1
    ✓ Your ERC721 contract should be whitelisted (59ms)
    ✓ should mint an NFT with random attributes (104ms)
    Turing URI = data:application/json;base64,eyJuYW1lIjogIlR1cmluZ01vbnN0ZXIiLCAiZGVzY3JpcHRpb24iOiAiQm9vb29Ib29vbyIsICJpbWFnIn0=
    ✓ should get an svg

```

## Solidity Code Walkthrough

The ERC721 contract is largely standard, except for needing to provide the address of the `TuringHelper` contract and the `uint256 turingRAND = myHelper.TuringRandom();` of course.

```javascript

    function mint(address to, uint256 tokenId) public {
      uint256 turingRAND = myHelper.TuringRandom(); // Get the random number
      _mint(to, tokenId);
      _setTokenURI(tokenId, Strings.toString(turingRAND));
    }

    function getSVG(uint tokenId) private view returns (string memory) {

        require(_exists(tokenId), "ERC721getSVG: URI get of nonexistent token");

        string memory genome = _tokenURIs[tokenId];
        bytes memory i_bytes = abi.encodePacked(genome); // get the bytes

        uint8 attribute_a = uint8(i_bytes[0]); // peel off the first byte (0-255)
        uint8 attribute_b = uint8(i_bytes[1]);
        // uint8 attribute_c = uint8(i_bytes[2]);
        // ...
  ...
        string[4] memory part;

        string memory colorEye = "C15AA2";
        if(attribute_a > 128){
          colorEye = "54B948";
        }
  ...

        part[0] = "<svg x='0px' y='0px' viewBox='0 0 300 300' style='enable-background:new 0 0 300 300;' xml:space='preserve'><style type='text/css'>.st0{fill:#";
  ...
        return string(abi.encodePacked(part[0], colorEye, part[1], colorBody, part[2], part[3]));
    }
```
