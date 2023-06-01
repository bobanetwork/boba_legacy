---
description: Switch fee token in Boba Network
---

## Switch fee token

Boba Network accepts BOBA and ETH as fee tokens. The fee choice is recorded in the `Boba_GasPriceOracle` contract. Users and developers can switch fee tokens by calling the `Boba_GasPriceOracle` contract.

### For users and developers

* You can switch to BOBA as the fee token calling the `Boba_GasPriceOracle` contract. Since MetaMask doesn't support dual fee tokens, you must have at least **3 BOBA** and **0.002 ETH**  in your wallet before switching fee token from ETH to BOBA. **3 BOBA** are enough for you to swap more BOBA and do more than two transactions.

  ```solidity
  import { ethers } from 'ethers'
  const BobaGasPriceOracleInterface = new utils.Interface([
    'function useBobaAsFeeToken()',
    'function useETHAsFeeToken()',
    'function bobaFeeTokenUsers(address) view returns (bool)',
    'function priceRatio() view returns (uint256)'
  ])
  const Proxy__Boba_GasPriceOracle = new Contract(
  	Proxy__Boba_GasPriceOracleAddress,
  	BobaGasPriceOracleInterface
  	l2Wallet
  )
  await Boba_GasPriceOracle.useBobaAsFeeToken()
  ```

  To avoid any accident, we *only* allow EOA accounts to use BOBA as the fee token. 

*  The default fee token option is ETH. You can swith the fee token from BOBA to ETH calling the `Boba_GasPriceOracle` contract. Before switching to ETH, you have to have at least **0.002 ETH** in your wallet. Otherwise, you will get stuck due to lack of ETH. We provide a *meta transaction* option for you to swap BOBA for a small amount of ETH. You can see this is option in the offical [gateway](https://gateway.boba.network).

  ```
  import { ethers } from 'ethers'
  const BobaGasPriceOracleInterface = new utils.Interface([
    'function useBobaAsFeeToken()',
    'function useETHAsFeeToken()',
    'function bobaFeeTokenUsers(address) view returns (bool)',
    'function priceRatio() view returns (uint256)'
  ])
  const Proxy__Boba_GasPriceOracle = new Contract(
  	Proxy__Boba_GasPriceOracleAddress,
  	BobaGasPriceOracleInterface
  	l2Wallet
  )
  await Boba_GasPriceOracle.useETHAsFeeToken()
  ```

### For frontend and backend developers

 We provide a simple script as a demo for you to switch fee tokens. Clone the repository, open it, and install nodejs packages with `yarn`:

  ```bash
  $ git clone git@github.com:bobanetwork/boba.git
  $ cd boba/boba_examples/boba-fee
  $ yarn clean # only needed / will only work if you had it installed previously
  $ yarn
  ```

  Then, add `.env` in `boba/boba_examples/boba-fee`.

  ```yaml
  # Rinkeby
  ADDRESS_MANAGER_ADDRESS=0x93A96D6A5beb1F661cf052722A1424CDDA3e9418
  L1_NODE_WEB3_URL=https://rinkeby.infura.io/v3/KEY
  L2_NODE_WEB3_URL=https://rinkeby.boba.network
  PRIV_KEY=
  
  
  # Mainnet
  ADDRESS_MANAGER_ADDRESS=0x8376ac6C3f73a25Dd994E0b0669ca7ee0C02F089
  L1_NODE_WEB3_URL=https://mainnet.infura.io/v3/KEY
  L2_NODE_WEB3_URL=https://mainnet.boba.network
  PRIV_KEY=
  ```

  Finally, you can switch your fee token by running the following command:

  ```bash
  # Use BOBA as the fee token
  $ yarn use:boba 
  
  # Use ETH as the fee token
  $ yarn use:eth
  ```
