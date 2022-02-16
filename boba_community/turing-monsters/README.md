# Turing Monster Minting

- [Turing Monster Minting](#turing-monster-minting)
  * [Mint your Monster!](#mint-your-monster-)
  * [Getting Rinkeby ETH and Rinkeby BOBA](#getting-rinkeby-eth-and-rinkeby-boba)
  * [Deploying the Turing Monster NFT](#deploying-the-turing-monster-nft)
  * [Solidity Code Walkthrough](#solidity-code-walkthrough)

## Mint your Monster!

Clone the repository, open it, and install packages with `yarn`:

```bash
$ git clone git@github.com:omgnetwork/optimism-v2.git
$ cd optimism-v2
$ yarn
$ yarn build
```

As for every chain, you need an account with some ETH (to deploy contracts) and since you will be using Turing, you also need some BOBA in that same account. In the deploy script (`/test/NFT_monster.ts`), specify your private key:

```

const testPrivateKey = '0x______________'

``` 

You can also do this via a hardware wallet, a mnemonic, via `hardhat.config.js`, or whatever you usually do. Whatever account/key you use, it needs some ETH and BOBA - small amounts should be sufficient.

## Getting Rinkeby ETH and Rinkeby BOBA

If you do not have Rinkeby ETH, you can get some from [Rinkeby Faucet](https://www.rinkebyfaucet.com/) or [Rinkeby Authenticated Faucet](https://www.rinkeby.io/#faucet). For some Rinkeby BOBA, use the [BOBA faucet](https://faucets.boba.network). The BOBA faucet will also give you some ETH if needed. 

## Deploying the Turing Monster NFT

Run

```bash
$ cd boba_community/turing-monsters 
$ yarn build
$ yarn test:rinkeby
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
    Turing URI = data:application/json;base64,eyJuYW1lIjogIlR1cmluZ01vbnN0ZXIiLCAiZGVzY3JpcHRpb24iOiAiQm9vb29Ib29vbyIsICJpbWFnZV9kYXRhIjogIjxzdmcgeD0nMHB4JyB5PScwcHgnIHZpZXdCb3g9JzAgMCAzMDAgMzAwJyBzdHlsZT0nZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAzMDAgMzAwOycgeG1sOnNwYWNlPSdwcmVzZXJ2ZSc+PHN0eWxlIHR5cGU9J3RleHQvY3NzJz4uc3Qwe2ZpbGw6I0MxNUFBMjtzdHJva2U6IzAwMDAwMDtzdHJva2Utd2lkdGg6NjtzdHJva2UtbWl0ZXJsaW1pdDoxMDt9IC5zdDF7ZmlsbDpub25lO3N0cm9rZTojMDAwMDAwO3N0cm9rZS13aWR0aDo2O3N0cm9rZS1taXRlcmxpbWl0OjEwO30gLnN0MntmaWxsOiNGRkZGRkY7c3Ryb2tlOiMwMDAwMDA7c3Ryb2tlLXdpZHRoOjY7c3Ryb2tlLW1pdGVybGltaXQ6MTA7fSAuc3Qze2ZpbGw6IzUwMDAwMDtzdHJva2U6IzAwMDAwMDtzdHJva2Utd2lkdGg6NjtzdHJva2UtbWl0ZXJsaW1pdDoxMDt9IC5zdDR7ZmlsbDpub25lO3N0cm9rZTojMDAwMDAwO3N0cm9rZS13aWR0aDoxMDtzdHJva2UtbWl0ZXJsaW1pdDoxMDt9PC9zdHlsZT48Y2lyY2xlIGNsYXNzPSdzdDAnIGN4PScxNDguNScgY3k9JzE1NC40JyByPSc5MC45Jy8+PHBhdGggY2xhc3M9J3N0MScgZD0nTTEyMy4xLDY3LjFjLTIuOC02LTE0LjQtMjAuNy00LTI0YzcuNy0yLjgsMTMsMTQsMjEuNSwxMy4xYzkuNC0wLjQtMTQuNi0zNS4zLDYuOS0zNi44IGMzLjMtMC4yLDEwLjMsMCwxMi44LDkuNWMxLjMsOS02LjMsMTItMC43LDE1LjFjOSwzLjcsMTcuNC0xMS4yLDIzLjktMy4xYzUuOSwxMC00LjcsMTcuNi0xMC4xLDI0LjEnLz4gPHBhdGggY2xhc3M9J3N0MScgZD0nTTU3LjYsMTUyLjZjLTEuNSwxMy44LTIyLjIsMjcuMy0yNS41LDMwLjRjLTMuMywzLjEtMS44LDE1LjEtMC41LDE2LjRjMy44LDMuNiw4LjEsNi44LDEyLjYsOS41IGMxLjEsMC43LDcsMS4xLDguNSwwLjVjNC0xLjYsMTIuOS0xMCwxNS45LTExLjQnLz4gPHBhdGggY2xhc3M9J3N0MScgZD0nTTIzNi44LDE3Mi4yYzIuMSwxLjgsMi4xLDEuOCw0LjIsMy41YzIuMiwxLjgsNC41LDMuNyw3LjIsNC44czUuOSwxLjMsOC40LTAuMWMxLjctMSwyLjktMi42LDQuMS00LjIgYzIuMS0yLjgsNC4xLTUuNSw2LjItOC4zczQuMy01LjcsNS4xLTkuMWMxLTQuMy0wLjQtOS4yLTMuNi0xMi4zYy0zLjMtMy4yLTgtNC4zLTEyLjQtNS43Yy01LjktMS45LTkuOS02LjEtMTguNC01LjInLz4gPHBhdGggY2xhc3M9J3N0MScgZD0nTTIwNC41LDI0My43YzAuNCw0LjcsMS44LDkuNyw1LjYsMTIuNmMyLjksMi4yLDYuNywyLjgsMTAuMywzLjJjNi40LDAuOCwxMi44LDEuNSwxOS4xLDAuN3MxMi43LTMuNCwxNi45LTguMiBjMC43LTAuOCwxLjQtMS43LDEuNy0yLjdjMC44LTIuMiwwLTQuNy0xLjMtNi43Yy0zLjktNi40LTExLjQtOS41LTE4LjQtMTIuMmMtNC4xLTEuNi04LjMtMy4yLTEyLjQtNC44Yy01LjItMi0xMy41LTYuOC0xOC0xLjUgQzIwNC4yLDIyOC42LDIwNCwyMzguMiwyMDQuNSwyNDMuN3onLz4gPHBhdGggY2xhc3M9J3N0MScgZD0nTTc2LDI0MC43Yy00LjYsMi40LTguNCw2LjItMTEuOCwxMC4yYy0zLjksNC42LTcuNSw5LjgtOC41LDE1LjhzMS4yLDEyLjgsNi40LDE1LjhjMy4yLDEuOCw3LjEsMiwxMC44LDIgYzUsMCwxMC0wLjIsMTUtMC41YzUuMy0wLjQsMTAuOS0xLjEsMTUuMy00YzMuMi0yLjEsNS43LTUuMyw3LjktOC40YzQuMS01LjcsNy45LTExLjgsOC45LTE4LjdjMC4yLTEuNywwLjMtMy42LTAuNC01LjIgYy0wLjYtMS40LTEuNi0yLjUtMi42LTMuNUMxMDcsMjM0LjYsODcuOSwyMzQuNSw3NiwyNDAuN3onLz4gPHBhdGggY2xhc3M9J3N0MicgZD0nTTE3OC44LDIwMC43YzIuMiw2LDUuNiwxNi45LDcuNywyMi45YzMuOC02LjgsNS0xNSwzLjUtMjIuNmMtMC40LTEuOS0zLjYtNy43LTUuMy04LjYnLz4gPHBhdGggY2xhc3M9J3N0MicgZD0nTTEwNS41LDE5Ny4yYzMuNiw1LjgsNi43LDE5LjYsOC4xLDI2LjNjNi44LTIuMSwxMS40LTkuNywxMC4xLTE2LjYnLz4gPHBhdGggY2xhc3M9J3N0MycgZD0nTTc4LjksMTIwLjRjLTMuMiw0LjEtMy40LDI0LjMtMS4xLDI4LjRjMy44LDYuOCwyOC41LDExLjgsMzIuNiwxMC42YzUuNC0xLjcsOS4yLTYuNiwxMS4yLTExLjkgYzIuOC03LjQsMi43LTE1LjUsMi41LTIzLjRjLTAuMi04LjcsMS44LTE1LjksMTAtMjAuOGM0LjYtMi43LDEwLTMuOSwxNS40LTQuMmM3LjYtMC41LDIxLjcsMTIuNSwyMi4xLDE0LjkgYzIuMiwxNS0yLjcsMzAuOS0xMi45LDQyYy0xLDEuMS0yNi45LDItMzItNS4xYy0zLjYtNSwwLTM5LjMtMTAuOC00Ni4zQzEwOC40LDk5LjYsODAuMywxMTguNiw3OC45LDEyMC40eicvPiA8cGF0aCBjbGFzcz0nc3QzJyBkPSdNMTc4LjksMTQ5LjZjMC43LDEuMiwyMS4zLDQuOSwyOC40LDMuM2M1LjctMS4zLDExLjgtMy44LDE0LjQtOS4xYzEuNS0zLDEuNi02LjQsMS42LTkuOCBjMC4yLTguNCwwLTE3LjgtNS42LTI0LjFjLTUtNS42LTEzLTcuMi0yMC40LTcuN2MtNS42LTAuNC0xMS43LTAuMy0xNi4zLDIuOUMxNjcuNCwxMTQuNSwxNzIuMSwxMzcuNiwxNzguOSwxNDkuNnonLz4gPHBhdGggY2xhc3M9J3N0NCcgZD0nTTEwMC44LDE5M2M3LjksNS42LDE2LjgsOS45LDI2LjEsMTIuOWMxMC45LDMuNSwyMi4zLDUuMSwzMy43LDQuM2M0LjgtMC40LDkuOC0xLjIsMTMuOC00IGMzLjEtMi4xLDUuMy01LjMsNy41LTguM2MyLjktNC4xLDUuOS04LjMsOC44LTEyLjQnLz4gPC9zdmc+In0=
    ✓ should get an svg

```

## Solidity Code Walkthrough

The ERC721 contract is largegy standard., except for needing to provide the address of the `TuringHelper` contract and the `uint256 turingRAND = myHelper.TuringRandom();` of course.

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