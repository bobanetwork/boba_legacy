---
description: Learn how to verify smart contracts on Boba
---

The Boba Explorers support verifying smart contracts via the [hardhat-etherscan](https://hardhat.org/hardhat-runner/plugins/nomiclabs-hardhat-etherscan#hardhat-etherscan) plug

## Verify contracts with hardhat-etherscan

## Installation

```bash
npm install --save-dev @nomiclabs/hardhat-etherscan
```

And add the following statement to your `hardhat.config.js`:

```js
require("@nomiclabs/hardhat-etherscan");
```

Or, if you are using TypeScript, add this to your `hardhat.config.ts`:

```js
import "@nomiclabs/hardhat-etherscan";
```

## Usage

You need to add the following Etherscan config to your `hardhat.config.js` file:

```js
module.exports = {
  networks: {
    'boba-mainnet': {
      url: 'https://mainnet.boba.network',
    },
    bobabeam: {
      url: 'https://bobabeam.boba.network',
    },
    bobaavax: {
      url: 'https://avax.boba.network',
    },
    bobabnb: {
      url: 'https://bnb.boba.network',
    },
    bobaopera: {
      url: 'https://bobaopera.boba.network',
    },
  },
  etherscan: {
    apiKey: {
      'boba-mainnet': process.env.BOBA_MAINNET_KEY,
      bobabeam: 'NO_KEY_REQUIRED',
      bobaavax: 'NO_KEY_REQUIRED',
      bobabnb: 'NO_KEY_REQUIRED',
      bobaopera: 'NO_KEY_REQUIRED',
    },
     customChains: [
      {
        network: 'boba-mainnet',
        chainId: 288,
        urls: {
          apiURL: 'https://api.bobascan.com/api',
          browserURL: 'https://bobascan.com',
        },
      },
      {
        network: 'bobabeam',
        chainId: 1294,
        urls: {
          apiURL: 'https://blockexplorer.bobabeam.boba.network/api',
          browserURL: 'https://blockexplorer.bobabeam.boba.network/',
        },
      },
      {
        network: 'bobaavax',
        chainId: 43288,
        urls: {
          apiURL: 'https://blockexplorer.avax.boba.network/api',
          browserURL: 'https://blockexplorer.avax.boba.network/',
        },
      },
      {
        network: 'bobabnb',
        chainId: 56288,
        urls: {
          apiURL: 'https://blockexplorer.bnb.boba.network/api',
          browserURL: 'https://blockexplorer.bnb.boba.network/',
        },
      },
      {
        network: 'bobaopera',
        chainId: 301,
        urls: {
          apiURL: 'https://blockexplorer.bobaopera.boba.network/api',
          browserURL: 'https://blockexplorer.bobaopera.boba.network/',
        },
      },
    ],
  },
  }
};
```

Lastly, run the `verify` task, passing the address of the contract, the network where it's deployed, and the constructor arguments that were used to deploy it (if any):

```bash
npx hardhat verify --network mainnet DEPLOYED_CONTRACT_ADDRESS "Constructor argument 1" "Constructor argument 2"
```

## Verify contracts with Blockscout

On contract creation, you will receive an address to check a pending transaction. If it does not redirect you to block explorer, verify you are on the chain where the contract was deployed, and type the contract's address into the search bar. Your contract details should come up.

![](../.gitbook/assets/085337.png)

Once you have provided all the necessary information, hit 'Verify & Publish'

![](../.gitbook/assets/085339.png)
