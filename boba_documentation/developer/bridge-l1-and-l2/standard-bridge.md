---
description: Learn more about the Standard Token Bridge
---

# Using the Standard Token Bridge

The standard bridge functionality provides a method for an ERC20 token to be deposited and locked on L1 in order to mint the same amount of an equivalent representation token on L2. This process is known as "bridging a token", e.g. depositing 100 BOBA on L1 in exchange for 100 BOBA on L2 and also the reverse - withdrawing 100 BOBA on L2 in exchange for the same amount on L1, in which case the representation token on L2 is burned in order to release the funds locked on L1. In addition to bridging tokens(ERC20) the standard bridge can also be used for the L1 native token.

The Standard Bridge is composed of two main contracts the [`L1StandardBridge`](https://github.com/bobanetwork/boba/blob/develop/packages/contracts/contracts/L1/messaging/L1StandardBridge.sol)and  [`L2StandardBridge`](https://github.com/bobanetwork/boba/blob/develop/packages/contracts/contracts/L2/messaging/L2StandardBridge.sol) for **Ethereum L1**. The modified  [`L1StandardBridgeAltL1`](https://github.com/bobanetwork/boba/blob/develop/packages/contracts/contracts/L1/messaging/L1StandardBridgeAltL1.sol) and  [`L2StandardBridgeAltL1`](https://github.com/bobanetwork/boba/blob/develop/packages/contracts/contracts/L2/messaging/L2StandardBridgeAltL1.sol) are for **Alt L2s (Avalanche, BNB, Moonbeam and Fantom)**.

Here we'll go over the basics of using this bridge to move ERC20 and L1 native assets between Layer 1 and Layer 2.



<figure><img src="../../../.gitbook/assets/Artboard 1.png" alt=""><figcaption></figcaption></figure>

> Note: **We currently block smart contract wallets from calling the `depositETH` and `depositERC20` functions for security reasons**. If you want to deposit not using an EOA accounts and you know what are doing, you can use `depositETHTo` and `depositERC20To` functions instead.

### Ethereum

#### Deposit ERC20s

ERC20 deposits into L2 can be triggered via the `depositERC20` and `depositERC20To` functions on the [`L1StandardBridge`](https://github.com/bobanetwork/boba/blob/develop/packages/contracts/contracts/L1/messaging/L1StandardBridge.sol). You **must** approve the **Standard Token Bridge** to use the amount of tokens that you want to deposit or the deposit will fail.

```js
const PRIVATE_KEY, L1_NODE_WEB3_URL, PROXY_L1_STANDARD_BRIDGE_ADDRESS

const L1Provider = new ethers.providers.StaticJsonRpcProvider(L1_NODE_WEB3_URL)
const L1Wallet = new ethers.Wallet(PRIVATE_KEY).connect(L1Provider)

const Proxy__L1StandardBridge = new ethers.Contract(
  PROXY_L1_STANDARD_BRIDGE_ADDRESS,
  L1StandardBridgeABI,
  L1Wallet
)

// Approve amounts
const approveTx = await L1ERC20Contract.approve(Proxy__L1StandardBridge.address, depositAmount)
await approveTx.wait()

// Deposit ERC20
const depositTx = await Proxy__L1StandardBridge.depositERC20(
  l1TokenAddress,
  l2TokenAddress,
  depositAmount,
  1300000, // l2 gas limit
  ethers.utils.formatBytes32String(new Date().getTime().toString()) // byte data
)
await depositTx.wait()

// Deposit ERC20 to another l2 wallet
const depositToTx = await Proxy__L1StandardBridge.depositERC20To(
  l1TokenAddress,
  l2TokenAddress,
  TargetAddress, // l2 target address
  depositAmount,
  1300000, // l2 gas limit
  ethers.utils.formatBytes32String(new Date().getTime().toString()) // byte data
)
await depositToTx.wait()
```

#### Deposit ETH

ETH deposits into L2 can be triggered via the `depositETH` and `depositETHTo` functions on the [`L1StandardBridge`](https://github.com/bobanetwork/boba/blob/develop/packages/contracts/contracts/L1/messaging/L1StandardBridge.sol). ETH deposits can alternatively be triggered by sending ETH directly to the `L1StandardBridge`. Once your deposit is detected and finalized on Boba Network, your account will be funded with the corresponding amount of ETH on L2.

```js
const PRIVATE_KEY, L1_NODE_WEB3_URL, PROXY_L1_STANDARD_BRIDGE_ADDRESS

const L1Provider = new ethers.providers.StaticJsonRpcProvider(L1_NODE_WEB3_URL)
const L1Wallet = new ethers.Wallet(PRIVATE_KEY).connect(L1Provider)

const Proxy__L1StandardBridge = new ethers.Contract(
  PROXY_L1_STANDARD_BRIDGE_ADDRESS,
  L1StandardBridgeABI,
  L1Wallet
)

// Deposit ETH
const depositTx = await Proxy__L1StandardBridge.depositETH(
  1300000, // l2 gas limit
  ethers.utils.formatBytes32String(new Date().getTime().toString()), // byte data
  {value: ETHAmount}
)
await depositTx.wait()

// Deposit ETH to another l2 wallet
const depositToTx = await Proxy__L1StandardBridge.depositETHTo(
  TargetAddress, // l2 target address
  depositAmount,
  1300000, // l2 gas limit
  ethers.utils.formatBytes32String(new Date().getTime().toString()), // byte data
  {value: ETHAmount}
)
await depositToTx.wait()
```

### Other L1s (Moonbeam, Bnb, Avalanche, Fantom)

#### Deposit ERC20s

ERC20 deposits into L2 can be triggered via the `depositERC20` and `depositERC20To` functions on the [`L1StandardBridgeAltL1`](https://github.com/bobanetwork/boba/blob/develop/packages/contracts/contracts/L1/messaging/L1StandardBridgeAltL1.sol). You **must** approve the **Standard Token Bridge** to use the amount of tokens that you want to deposit or the deposit will fail.

```js
const PRIVATE_KEY, L1_NODE_WEB3_URL, PROXY_L1_STANDARD_BRIDGE_ADDRESS

const L1Provider = new ethers.providers.StaticJsonRpcProvider(L1_NODE_WEB3_URL)
const L1Wallet = new ethers.Wallet(PRIVATE_KEY).connect(L1Provider)

const Proxy__L1StandardBridge = new ethers.Contract(
  PROXY_L1_STANDARD_BRIDGE_ADDRESS,
  L1StandardBridgeABI,
  L1Wallet
)

// Approve amounts
const approveTx = await L1ERC20Contract.approve(Proxy__L1StandardBridge.address, depositAmount)
await approveTx.wait()

// Deposit ERC20
const depositTx = await Proxy__L1StandardBridge.depositERC20(
  l1TokenAddress,
  l2TokenAddress,
  depositAmount,
  1300000, // l2 gas limit
  ethers.utils.formatBytes32String(new Date().getTime().toString()) // byte data
)
await depositTx.wait()

// Deposit ERC20 to another l2 wallet
const depositToTx = await Proxy__L1StandardBridge.depositERC20To(
  l1TokenAddress,
  l2TokenAddress,
  TargetAddress, // l2 target address
  depositAmount,
  1300000, // l2 gas limit
  ethers.utils.formatBytes32String(new Date().getTime().toString()) // byte data
)
await depositToTx.wait()
```

#### Deposit L1 native token

L1 native token deposits into L2 can be triggered via the `depositNativeToken` and `depositNativeTokenTo` functions on the [`L1StandardBridgeAltL1`](https://github.com/bobanetwork/boba/blob/develop/packages/contracts/contracts/L1/messaging/L1StandardBridgeAltL1.sol). L1 native token deposits can alternatively be triggered by sending L1 native token directly to the `L1StandardBridgeAltL1`. Once your deposit is detected and finalized on Boba Network, your account will be funded with the corresponding amount of L1 native token on L2.

```js
const PRIVATE_KEY, L1_NODE_WEB3_URL, PROXY_L1_STANDARD_BRIDGE_ADDRESS

const L1Provider = new ethers.providers.StaticJsonRpcProvider(L1_NODE_WEB3_URL)
const L1Wallet = new ethers.Wallet(PRIVATE_KEY).connect(L1Provider)

const Proxy__L1StandardBridge = new ethers.Contract(
  PROXY_L1_STANDARD_BRIDGE_ADDRESS,
  L1StandardBridgeABI,
  L1Wallet
)

// Deposit ETH
const depositTx = await Proxy__L1StandardBridge.depositNativeToken(
  1300000, // l2 gas limit
  ethers.utils.formatBytes32String(new Date().getTime().toString()), // byte data
  {value: ETHAmount}
)
await depositTx.wait()

// Deposit ETH to another l2 wallet
const depositToTx = await Proxy__L1StandardBridge.depositNativeTokenTo(
  TargetAddress, // l2 target address
  depositAmount,
  1300000, // l2 gas limit
  ethers.utils.formatBytes32String(new Date().getTime().toString()), // byte data
  {value: ETHAmount}
)
await depositToTx.wait()
```



<figure><img src="../../../.gitbook/assets/Artboard 2 (13).png" alt=""><figcaption></figcaption></figure>

### Ethereum 

#### Withdraw tokens (ERC20s and ETH)

ERC20 withdrawals can be triggered via the `payAndWithdraw` function on the [`DiscretionaryExitFee`](https://github.com/bobanetwork/boba/blob/develop/packages/boba/contracts/contracts/DiscretionaryExitFee.sol).

> The DiscretionaryExitFee contract utilizes the BOBA token to collect an additional exit fee. This fee is then employed to facilitate the transfer of cross-chain messages on L1. The configuration for this fee can be found in the Boba_GasPriceOracle contract, which is available at [L2BillingContract](https://github.com/bobanetwork/boba/blob/develop/packages/boba/contracts/contracts/L2BillingContract.sol) for **Ethereum L2** and [L2BillingContractAltL1](https://github.com/bobanetwork/boba/blob/develop/packages/boba/contracts/contracts/L2BillingContractAltL1.sol) for **Alt L2s**.

```js
const PRIVATE_KEY, L2_NODE_WEB3_URL, DiscretionaryExitFee_ADDRESS, PROXY_L2_BILLING_CONTRACT_ADDRESS

const L2Provider = new ethers.providers.StaticJsonRpcProvider(L2_NODE_WEB3_URL)
const L2Wallet = new ethers.Wallet(PRIVATE_KEY).connect(L2Provider)

const DiscretionaryExitFee = new ethers.Contract(
  DiscretionaryExitFee_ADDRESS,
  L2StandardBridgeABI,
  L2Wallet
)

const Proxy__L2BillingContract = new ethers.Contract(
	PROXY_L2_BILLING_CONTRACT_ADDRESS,
  L2BillingContractABI,
  L2Wallet
)

// Approve exit Fee
const exitFee = await Proxy__L2BillingContract.exitFee()
const approveBobaTx = await L2BobaToken.approve(DiscretionaryExitFee.address, exitFee)
await approveBobaTx.wait()

// Withdraw ETH
// ETH address is 0x4200000000000000000000000000000000000006 on L2
const withdrawTx = await DiscretionaryExitFee.payAndWithdraw(
  '0x4200000000000000000000000000000000000006', // l2 token address
  ETHAmount,
  9999999, // l1 gas limit
  ethers.utils.formatBytes32String(new Date().getTime().toString()), // byte data
  { value: ETHAmount }
)
await withdrawTx.wait()

// Approve amounts
const approveTx = await L2ERC20Contract.approve(Proxy__L2StandardBridge.address, exitAmount)
await approveTx.wait()

// Approve exit Fee
const exitFee = await Proxy__L2BillingContract.exitFee()
const approveBobaTx = await L2BobaToken.approve(DiscretionaryExitFee.address, exitFee)
await approveBobaTx.wait()

// Withdraw ERC20
const withdrawTx = await DiscretionaryExitFee.payAndWithdraw(
  l2TokenAddress // l2 token address
  exitAmount,
  9999999, // l1 gas limit
  ethers.utils.formatBytes32String(new Date().getTime().toString()), // byte data
)
await withdrawTx.wait()
```

### Other L1s (Moonbeam, Bnb, Avalanche, Fantom)

#### Withdraw tokens (ERC20s and L1 native token)

ERC20 withdrawals can be triggered via the `payAndWithdraw` function on the [`DiscretionaryExitFee`](https://github.com/bobanetwork/boba/blob/develop/packages/boba/contracts/contracts/DiscretionaryExitFee.sol).

> The DiscretionaryExitFee contract utilizes the BOBA token to collect an additional exit fee. This fee is then employed to facilitate the transfer of cross-chain messages on L1. The configuration for this fee can be found in the Boba_GasPriceOracle contract, which is available at [L2BillingContract](https://github.com/bobanetwork/boba/blob/develop/packages/boba/contracts/contracts/L2BillingContract.sol) for **Ethereum L2** and [L2BillingContractAltL1](https://github.com/bobanetwork/boba/blob/develop/packages/boba/contracts/contracts/L2BillingContractAltL1.sol) for **Alt L2s**.

```javascript
const PRIVATE_KEY, L2_NODE_WEB3_URL, DiscretionaryExitFee_ADDRESS, PROXY_L2_BILLING_CONTRACT_ADDRESS

const L2Provider = new ethers.providers.StaticJsonRpcProvider(L2_NODE_WEB3_URL)
const L2Wallet = new ethers.Wallet(PRIVATE_KEY).connect(L2Provider)

const DiscretionaryExitFee = new ethers.Contract(
  DiscretionaryExitFee_ADDRESS,
  L2StandardBridgeABI,
  L2Wallet
)

const Proxy__L2BillingContract = new ethers.Contract(
	PROXY_L2_BILLING_CONTRACT_ADDRESS,
  L2BillingContractABI,
  L2Wallet
)

// exit fee
const exitFee = await Proxy__L2BillingContract.exitFee()

// Withdraw BOBA
// BOBA address is 0x4200000000000000000000000000000000000006 on L2
const withdrawTx = await DiscretionaryExitFee.payAndWithdraw(
  '0x4200000000000000000000000000000000000006', // l2 token address
  BOBAAmount,
  9999999, // l1 gas limit
  ethers.utils.formatBytes32String(new Date().getTime().toString()), // byte data
  { value: BOBAAmount.add(exitFee) }
)
await withdrawTx.wait()

// Approve amounts
const approveTx = await L2ERC20Contract.approve(Proxy__L2StandardBridge.address, exitAmount)
await approveTx.wait()

// exit fee
const exitFee = await Proxy__L2BillingContract.exitFee()

// Withdraw ERC20
const withdrawTx = await DiscretionaryExitFee.payAndWithdraw(
  l2TokenAddress // l2 token address
  exitAmount,
  9999999, // l1 gas limit
  ethers.utils.formatBytes32String(new Date().getTime().toString()), // byte data
  { value: exitFee }
)
await withdrawTx.wait()
```



<figure><img src="../../../.gitbook/assets/Artboard 3 (2).png" alt=""><figcaption></figcaption></figure>

The Standard bridge allows a one-to-many mapping between L1 and L2 tokens, meaning that there can be many Boba implementations of an L1 token. However there is always a one-to-one mapping between L1 and L2 tokens in the Boba token list.

<figure><img src="../../../.gitbook/assets/Artboard 1 (18) (1).png" alt=""><figcaption></figcaption></figure>

| Network          | URL                                                          |
| ---------------- | ------------------------------------------------------------ |
| Ethereum Mainnet | [Ethereum Boba Token List](../token-addresses.md#Ethereum <> BOBA L2) |
| Avalanche        | [Avalanche Boba Token List](../token-addresses.md#Avalanche <> BOBA Avalache L2) |
| BNB              | [BNB Boba Token List](../token-addresses.md#BNB <> BOBA BNB L2) |
| Moonbeam         | [Moonbeam Boba Token List](../token-addresses.md#Moonbeam <> BOBA Moonbeam L2) |
| Fantom           | [Fantom Boba Token List](../token-addresses.md#Fantom <> BOBA FTM L2) |

<figure><img src="../../../.gitbook/assets/Artboard 2 (18) (1).png" alt=""><figcaption></figcaption></figure>

| Network           | URL                                                          |
| ----------------- | ------------------------------------------------------------ |
| Ethereum Goerli   | [Ethereum Goerli Boba Token List](../token-addresses.md#Ethereum Goerli <> BOBA Goerli L2) |
| Avalanche Testnet | [Avalanche Testnet Boba Token List](../token-addresses.md#Avalanche Testnet <> BOBA Avalache Testnet L2) |
| BNB Testnet       | [BNB Testnet Boba Token List](../token-addresses.md#BNB Testnet <> BOBA BNB Testnet L2) |
| Moonbase          | [Moonbase Boba Token List](../token-addresses.md#Moonbase <> BOBA Moonbase L2) |
| Fantom Testnet    | [Fantom Testnet Boba Token List](../token-addresses.md#Fantom Testnet <> BOBA FTM Testnet L2) |



<figure><img src="../../../.gitbook/assets/Artboard 4 (14).png" alt=""><figcaption></figcaption></figure>

Standard Bridge Contract addresses

<figure><img src="../../../.gitbook/assets/Artboard 1 (18) (1).png" alt=""><figcaption></figcaption></figure>

### Ethereum Mainnet

| Contract Name             | Contract Address                           |
| ------------------------- | ------------------------------------------ |
| Proxy\_\_L1StandardBridge | 0xdc1664458d2f0B6090bEa60A8793A4E66c2F1c00 |
| DiscretionaryExitFee      | 0x1bD0A503EF149B188bFA31205028dB0401186107 |
| Proxy__L2BillingContract  | 0x29F373e4869e69faaeCD3bF747dd1d965328b69f |
| L2BOBA                    | 0xa18bF3994C0Cc6E3b63ac420308E5383f53120D7 |

### Avalanche

| Contract Name             | Contract Address                           |
| ------------------------- | ------------------------------------------ |
| Proxy\_\_L1StandardBridge | 0xf188F1e92B2c78956D2859b84684BFD17103e22c |
| DiscretionaryExitFee      | 0x4ef8b611e05121d511d930Bf7EBaeE37f87bfC03 |
| Proxy__L2BillingContract  | 0xc4243ecE585B843c7cf92E65617A4211FA580dDb |

### BNB

| Contract Name             | Contract Address                           |
| ------------------------- | ------------------------------------------ |
| Proxy\_\_L1StandardBridge | 0x1E0f7f4b2656b14C161f1caDF3076C02908F9ACC |
| DiscretionaryExitFee      | 0xEB6652A4eb6e0d003Fbb3DD76Ae72694175191cd |
| Proxy__L2BillingContract  | 0xf626b0d7C028E6b89c15ca417f21080E376de65b |

### Moonbeam

| Contract Name             | Contract Address                           |
| ------------------------- | ------------------------------------------ |
| Proxy\_\_L1StandardBridge | 0xAf5297f68D48cd2DE37Ee5cbaC0647fbA4132985 |
| DiscretionaryExitFee      | 0xC828226424E9D9686bddC0fBA91c4e234b3e6F55 |
| Proxy__L2BillingContract  | 0xb210a4BB024196dC8c5f6f407220cA83e65e45FE |

### Fantom

| Contract Name             | Contract Address                           |
| ------------------------- | ------------------------------------------ |
| Proxy\_\_L1StandardBridge | 0xb7629EF94B991865940E8A840Aa7d68fa88c3Fe8 |
| DiscretionaryExitFee      | 0xBD4e12b0634b154932D75503E2Ff404953CbD1Bf |
| Proxy__L2BillingContract  | 0xD5b0E66566FEe76d6c550e7190385703Bcf11354 |

<figure><img src="../../../.gitbook/assets/Artboard 2 (18) (1).png" alt=""><figcaption></figcaption></figure>

### Ethereum Goerli

| Contract Name             | Contract Address                           |
| ------------------------- | ------------------------------------------ |
| Proxy\_\_L1StandardBridge | 0xDBD71249Fe60c9f9bF581b3594734E295EAfA9b2 |
| DiscretionaryExitFee      | 0x999933FF5284038197602a80173F4f4ECb634866 |
| Proxy__L2BillingContract  | 0x04A6e2AB38BB53bD82ae1Aa0521633D640304ab9 |
| L2BOBA                    | 0x4200000000000000000000000000000000000023 |

### Avalanche Testnet

| Contract Name             | Contract Address                           |
| ------------------------- | ------------------------------------------ |
| Proxy\_\_L1StandardBridge | 0x07B606934b5B5D6A9E1f8b78A0B26215FF58Ad56 |
| DiscretionaryExitFee      | 0xED6760E89fB35731ae82d7D149d8c94fdDb376fE |
| Proxy__L2BillingContract  | 0xB7E29AB7FB9b6406BAb33Cf6f868fE25B9Ad0160 |

### BNB Testnet

| Contract Name             | Contract Address                           |
| ------------------------- | ------------------------------------------ |
| Proxy\_\_L1StandardBridge | 0xBf0939120b4F5E3196b9E12cAC291e03dD058e9a |
| DiscretionaryExitFee      | 0x587fA2e1d797Ff79Bf86a24E156A559b6551b2B3 |
| Proxy__L2BillingContract  | 0xe43Ff19D561EA6DB84Dd2Ec3754027fAFDa79499 |

### Moonbase

| Contract Name             | Contract Address                           |
| ------------------------- | ------------------------------------------ |
| Proxy\_\_L1StandardBridge | 0xEcca5FEd8154420403549f5d8F123fcE69fae806 |
| DiscretionaryExitFee      | 0x01ce26900fC11aBc2AcF53154772bb251c8aA005 |
| Proxy__L2BillingContract  | 0x05C9f36D901594D220311B211fA26DbD58B87717 |

### Fantom Testnet

| Contract Name             | Contract Address                           |
| ------------------------- | ------------------------------------------ |
| Proxy\_\_L1StandardBridge | 0x86FC7AeFcd69983A8d82eAB1E0EaFD38bB42fd3f |
| DiscretionaryExitFee      | 0x6E7033f647f932D23de37BD3b25b8F56DeAD4034 |
| Proxy__L2BillingContract  | 0x675Ea342D2a85D7db0Cc79AE64196ad628Ce8187 |
