## Gateway Development

- [Gateway Development](#gateway-development)
  * [1. Start a local L1/L2](#1-start-a-local-l1-l2)
  * [2. Initial state of preconfigured accounts](#2-initial-state-of-preconfigured-accounts)
  * [3. Starting the React App](#3-starting-the-react-app)
  * [4. Metamask Configuration](#4-metamask-configuration)
  * [5. Developing on other Chains, such as Rinkeby](#5-developing-on-other-chains--such-as-rinkeby)

### 1. Start a local L1/L2

Run, from the top level folder:

```bash
$ yarn clean
$ yarn
$ yarn build
$ cd ops
$ BUILD=1 DAEMON=0 ./up_local.sh
```

You can change the BUILD and DAEMON values to control if everything is rebuilt (`BUILD=1`, very slow) and if you want to see all the debug information (`DAEMON=0`). Typically, you will only have to build everything once, and after that, you can save time by setting `BUILD` to `2`.

### 2. Initial state of preconfigured accounts

To facilitate development and testing, there are three accounts that will receive defined tokens:

* Deployer (aka Bob) - This one starts out with 5000 ETH on L1 and 4999.9036 oETH on L2. During deployment, a test token is created called TEST, and the deployer (aka Bob) holds the entire initial supply (10000000000) on the L1.

_Account Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80_

* Alice (PK_2)

This one starts out with 4999.9967 ETH on L1 and 5000 oETH on L2.

_Account Address: 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc
Private Key: 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba_

* Kate (PK_3)

This one starts out with 4999.9967 ETH on L1 and 5000 oETH on L2.

_Account Address: 0x976EA74026E726554dB657fA54763abd0C3a0aa9
Private Key: 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e_

### 3. Starting the React App

Open a second terminal window and navigate to `packages/boba/gateway`. Then, create a `.env` following the example provided.

```bash
# This is for working on the wallet, pointed at the Boba Rinkeby testnet
REACT_APP_INFURA_ID=YOUR_INFURA_KEY
REACT_APP_ETHERSCAN_API=YOUR_ETHERSCAN_KEY
REACT_APP_POLL_INTERVAL=15000
SKIP_PREFLIGHT_CHECK=true
REACT_APP_WALLET_VERSION=1.0.10
REACT_APP_ENV=dev #enable the `local` option in the network selector 
```

Then run

```bash
$ yarn start
```

and the gateway should start up in a local browser (at localhost:3000). When you use the `Deployer` account (address ending in `2266`, see above for PK) then your gateway will start out with many tokens of various kinds. 

### 4. Metamask Configuration

If you do not have `Local L1` and 'Local L2' options in your MetaMask, you can set them up by hand in MetaMask:

```bash
name: "Local L1"
chainId: 31337
rpcUrl: `http://localhost:9545`

name: "Local L2"
chainId: 31338
rpcUrl: `http://localhost:8545`
```

### 5. Developing on other Chains, such as Rinkeby

**The default for all development is a local chain that you spin up on your local machine through Docker.**

However, in very rare circumstances, such as testing timelock logic for the DAO, it may be useful to work with a live chain. 

To develop on non-local other chains, you will need to obtain either Rinkeby ETH (e.g. from https://faucet.rinkeby.io) or for work on Mainnet, ETH. Once you have some ETH, then your first step will be to bridge some to the L2, since otherwise you will not be able to do anything on the L2 and all your function calls will fail. 

One you have obtained some eth, then simply select the chain you want to work on from the top left dropdown, such as Rinkeby. Note that Rinkeby is used for active development, and therefore, may be down, have undocumented features, or otherwise require steps that are not part of this standard writeup. 