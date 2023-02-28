---
description: Learn more about the Fast Token Bridge
---

# Using the Fast Token Bridge

The fast bridge provides a method for users on both sides to add liquidity for the L1 Fast Bridge Pool and the L2 Fast Bridge Pool. This liquidity is essential to enable the swap-based fast bridge method between L1 and L2. When an ERC20 token is deposited and added to L1 Fast Bridge Pool, the L2 Fast Bridge releases the token on L2 and charges a certain percentage of the deposit amount as the transaction feee. This process is known as "fast bridge a token". e.g. depositing 100 BOBA on L1 in exchange for 99.7 BOBA on L2 and also the reverse - withdrawing 100 BOBA on L2 in exchange for the 99.7 BOBA on L1. In addition to bridging tokens(ERC20) the fast bridge can also be used for the L1 native token.

The Fast Bridge is composed of two main contracts called the [`L1LiquidityPool`](https://github.com/bobanetwork/boba/blob/develop/packages/boba/contracts/contracts/LP/L1LiquidityPool.sol)and  [`L2LiquidityPool` ](https://github.com/bobanetwork/boba/blob/develop/packages/boba/contracts/contracts/LP/L2LiquidityPool.sol) for **Ethereum L2**. The modified  [`L1LiquidityPoolAltL1`](https://github.com/bobanetwork/boba/blob/develop/packages/boba/contracts/contracts/LP/L1LiquidityPoolAltL1.sol) and  [`L2LiquidityPoolAltL1` ](https://github.com/bobanetwork/boba/blob/develop/packages/boba/contracts/contracts/LP/L2LiquidityPoolAltL1.sol) are for **Alt L2s (Avalanche, BNB, Moonbeam and Fantom)**.

Here we'll go over the basics of using this bridge to move ERC20 and L1 native assets between Layer 1 and Layer 2.



<figure><img src="../../../.gitbook/assets/Artboard 1 (20).png" alt=""><figcaption></figcaption></figure>

> Please check the liquidity balance of the L2 Liquidity Pool first before depositing tokens on the L1 Liquidity Pool. If the L2 Liquidty Pool doesn't have enough balance to complete your swap, your funds would be returned back to you from L2 and the L1 Liquidity Pool would charge a certain percentage of the deposit amount.

### Ethereum

#### Deposit ERC20s or ETH

ERC20 and ETH deposits into L2 can triggered via the `clientDepositL1` functions on the [`L1LiquidityPool`](https://github.com/bobanetwork/boba/blob/develop/packages/boba/contracts/contracts/LP/L1LiquidityPool.sol). You **must** approve the **L1 Liquidity Pool** to use the amount of tokens that you want to deposit or the deposit will fail.

```js
const PRIVATE_KEY, L1_NODE_WEB3_URL, PROXY_L1_LIQUIDITY_POOL_ADDRESS

const L1Provider = new ethers.providers.StaticJsonRpcProvider(L1_NODE_WEB3_URL)
const L1Wallet = new ethers.Wallet(PRIVATE_KEY).connect(L1Provider)

const Proxy__L1LiquidityPool = new ethers.Contract(
  PROXY_L1_LIQUIDITY_POOL_ADDRESS,
  L1LiquidityPoolABI,
  L1Wallet
)

// Approve amounts
const approveTx = await L1ERC20Contract.approve(Proxy__L1LiquidityPool.address, depositAmount)
await approveTx.wait()

// Deposit ERC20
const depositERC20Tx = await Proxy__L1LiquidityPool.clientDepositL1(
  depositAmount,
  l1TokenAddress,
)
await depositERC20Tx.wait()

// Deposit ETH
// We defined that ETH address is 0x0000000000000000000000000000000000000000 on L1
const depositETHTx = await Proxy__L1LiquidityPool.clientDepositL1(
  depositAmount,
  '0x0000000000000000000000000000000000000000', // ETH Address
  {value: depositAmount}
)
await depositETHTx.wait()
```

### Other L1s (Moonbeam, Bnb, Avalanche, Fantom)

#### Deposit ERC20s or L1 native token

ERC20 and L1 native token deposits into L2 can triggered via the `clientDepositL1` functions on the [`L1LiquidityPoolAltL1`](https://github.com/bobanetwork/boba/blob/develop/packages/boba/contracts/contracts/LP/L1LiquidityPoolAltL1.sol). You **must** approve the **L1 Liquidity Pool** to use the amount of tokens that you want to deposit or the deposit will fail.

```javascript
const PRIVATE_KEY, L1_NODE_WEB3_URL, PROXY_L1_LIQUIDITY_POOL_ADDRESS

const L1Provider = new ethers.providers.StaticJsonRpcProvider(L1_NODE_WEB3_URL)
const L1Wallet = new ethers.Wallet(PRIVATE_KEY).connect(L1Provider)

const Proxy__L1LiquidityPool = new ethers.Contract(
  PROXY_L1_LIQUIDITY_POOL_ADDRESS,
  L1LiquidityPoolABI,
  L1Wallet
)

// Approve amounts
const approveTx = await L1ERC20Contract.approve(Proxy__L1LiquidityPool.address, depositAmount)
await approveTx.wait()

// Deposit ERC20
const depositERC20Tx = await Proxy__L1LiquidityPool.clientDepositL1(
  depositAmount,
  l1TokenAddress,
)
await depositERC20Tx.wait()

// Deposit L1 native token
// We defined that L1 native token address is 0x0000000000000000000000000000000000000000 on L1
const depositL1NativeTokenTx = await Proxy__L1LiquidityPool.clientDepositL1(
  depositAmount,
  '0x0000000000000000000000000000000000000000', // L1 native token Address
  {value: depositAmount}
)
await depositL1NativeTokenTx.wait()
```



<figure><img src="../../../.gitbook/assets/Artboard 2 (20) (1).png" alt=""><figcaption></figcaption></figure>

> Please check the liquidity balance of the L1 Liquidity Pool first before depositing tokens on the L2 Liquidity Pool. If the L1 Liquidty Pool doesn't have enough balance to complete your swap, your funds would be returned back to you from L1 and the L2 Liquidity Pool would charge a certain percentage of the exit amount.

> The L2LiquidityPool contract utilizes the BOBA token to collect an additional exit fee. This fee is then employed to facilitate the transfer of cross-chain messages on L1. The configuration for this fee can be found in the Boba_GasPriceOracle contract, which is available at [L2BillingContract](https://github.com/bobanetwork/boba/blob/develop/packages/boba/contracts/contracts/L2BillingContract.sol) for **Ethereum L2** and [L2BillingContractAltL1](https://github.com/bobanetwork/boba/blob/develop/packages/boba/contracts/contracts/L2BillingContractAltL1.sol) for **Alt L2s**.

### Ethereum

#### Withdraw ERC20s or ETH

ERC20 and ETH withdrawals can be triggered via the `clientDepositL2` functions on the [`L2LiquidityPool`](https://github.com/bobanetwork/boba/blob/develop/packages/boba/contracts/contracts/LP/L2LiquidityPool.sol).

```js
const PRIVATE_KEY, L2_NODE_WEB3_URL, PROXY_L2_LIQUIDITY_POOL_ADDRESS, PROXY_L2_BILLING_CONTRACT_ADDRESS

const L2Provider = new ethers.providers.StaticJsonRpcProvider(L2_NODE_WEB3_URL)
const L2Wallet = new ethers.Wallet(PRIVATE_KEY).connect(L2Provider)

const Proxy__L2LiquidityPool = new ethers.Contract(
  PROXY_L2_LIQUIDITY_POOL_ADDRESS,
  L2LiquidityPoolABI,
  L2Wallet
)

const Proxy__L2BillingContract = new ethers.Contract(
	PROXY_L2_BILLING_CONTRACT_ADDRESS,
  L2BillingContractABI,
  L2Wallet
)

// Approve amounts
const approveTx = await L2ERC20Contract.approve(Proxy__L2LiquidityPool.address, withdrawAmount)
await approveTx.wait()

// Approve exit Fee
const exitFee = await Proxy__L2BillingContract.exitFee()
const approveBobaTx = await L2BobaToken.approve(Proxy__L2LiquidityPool.address, exitFee)
await approveBobaTx.wait()

// Withdraw ERC20
const withdrawERC20Tx = await Proxy__L2LiquidityPool.clientDepositL2(
  withdrawAmount,
  l2TokenAddress,
)
await withdrawERC20Tx.wait()

// Withdraw ETH
// ETH address is 0x4200000000000000000000000000000000000006 on L2
const withdrawETHTx = await Proxy__L2LiquidityPool.clientDepositL2(
  withdrawAmount,
  '0x4200000000000000000000000000000000000006', // ETH Address
  {value: depositAmount}
)
await withdrawETHTx.wait()
```

### Other L1s (Moonbeam, Bnb, Avalanche, Fantom)

#### Withdraw ERC20s or L1 native token

ERC20 and BOBA withdrawals can be triggered via the `clientDepositL2` functions on the [`L2LiquidityPoolAltL1` ](https://github.com/bobanetwork/boba/blob/develop/packages/boba/contracts/contracts/LP/L2LiquidityPoolAltL1.sol). 

> The BOBA token is the native token on L2, so the value is required for withdrawing the BOBA token. The L1 native token on L2 is the same as other ERC20s. The approval for **L2LiquidityPool** is required before withdrawing the L1 native token.

> The L2LiquidityPool contract utilizes the BOBA token to collect an additional exit fee. This fee is then employed to facilitate the transfer of cross-chain messages on L1. The configuration for this fee can be found in the Boba_GasPriceOracle contract, which is available at [L2BillingContract](https://github.com/bobanetwork/boba/blob/develop/packages/boba/contracts/contracts/L2BillingContract.sol) for **Ethereum L2** and [L2BillingContractAltL1](https://github.com/bobanetwork/boba/blob/develop/packages/boba/contracts/contracts/L2BillingContractAltL1.sol) for **Alt L2s**.

```javascript
const PRIVATE_KEY, L2_NODE_WEB3_URL, PROXY_L2_LIQUIDITY_POOL_ADDRESS, PROXY_L2_BILLING_CONTRACT_ADDRESS

const L2Provider = new ethers.providers.StaticJsonRpcProvider(L2_NODE_WEB3_URL)
const L2Wallet = new ethers.Wallet(PRIVATE_KEY).connect(L2Provider)

const Proxy__L2LiquidityPool = new ethers.Contract(
  PROXY_L2_LIQUIDITY_POOL_ADDRESS,
  L2LiquidityPoolABI,
  L2Wallet
)

const Proxy__L2BillingContract = new ethers.Contract(
	PROXY_L2_BILLING_CONTRACT_ADDRESS,
  L2BillingContractABI,
  L2Wallet
)

// Approve amounts
const approveTx = await L2ERC20Contract.approve(Proxy__L2LiquidityPool.address, withdrawAmount)
await approveTx.wait()

// Find exit fee
const exitFee = await Proxy__L2BillingContract.exitFee()

// Withdraw ERC20
const withdrawERC20Tx = await Proxy__L2LiquidityPool.clientDepositL2(
  withdrawAmount,
  l2TokenAddress,
  { value: exitFee }
)
await withdrawERC20Tx.wait()

// Withdraw BOBA
// BOBA address is 0x4200000000000000000000000000000000000006 on L2
const withdrawBOBATx = await Proxy__L2LiquidityPool.clientDepositL2(
  withdrawAmount,
  '0x4200000000000000000000000000000000000006', // BOBA Address
  { value: withdrawAmount.add(exitFee) }
)
await withdrawBOBATx.wait()
```



<figure><img src="../../../.gitbook/assets/Artboard 3 (14) (1).png" alt=""><figcaption></figcaption></figure>

The Fast bridge allows a one-to-one mapping between L1 and L2 tokens.

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



<figure><img src="../../../.gitbook/assets/Artboard 4 (13) (1).png" alt=""><figcaption></figcaption></figure>

Liquidity pool Contract addresses

<figure><img src="../../../.gitbook/assets/Artboard 1 (18) (1).png" alt=""><figcaption></figcaption></figure>

### Ethereum Mainnet

| Contract Name            | Contract Address                           |
| ------------------------ | ------------------------------------------ |
| Proxy\_\_L1LiquidityPool | 0x1A26ef6575B7BBB864d984D9255C069F6c361a14 |
| Proxy\_\_L2LiquidityPool | 0x3A92cA39476fF84Dc579C868D4D7dE125513B034 |
| Proxy__L2BillingContract | 0x29F373e4869e69faaeCD3bF747dd1d965328b69f |
| L2BOBA                   | 0xa18bF3994C0Cc6E3b63ac420308E5383f53120D7 |

### Avalanche

| Contract Name            | Contract Address                           |
| ------------------------ | ------------------------------------------ |
| Proxy\_\_L1LiquidityPool | 0x1E6D9F4dDD7C52EF8964e81E5a9a137Ee2489b21 |
| Proxy\_\_L2LiquidityPool | 0x0B1b1ce732564974233159213D3931C5400D4B3E |
| Proxy__L2BillingContract | 0xc4243ecE585B843c7cf92E65617A4211FA580dDb |

### BNB

| Contract Name            | Contract Address                           |
| ------------------------ | ------------------------------------------ |
| Proxy\_\_L1LiquidityPool | 0x88b5d70be4fc644c55b164AD09A3DFD44E31eC59 |
| Proxy\_\_L2LiquidityPool | 0x5E36d0ADBDEa248c207312d493a08a6d182D0805 |
| Proxy__L2BillingContract | 0xf626b0d7C028E6b89c15ca417f21080E376de65b |

### Moonbeam

| Contract Name            | Contract Address                           |
| ------------------------ | ------------------------------------------ |
| Proxy\_\_L1LiquidityPool | 0x3fBc139f80a474c9B19A734e9ABb285b6550dF58 |
| Proxy\_\_L2LiquidityPool | 0xD7d057F1b1caBB637BFc81F9bf1Fb74f54941E65 |
| Proxy__L2BillingContract | 0xb210a4BB024196dC8c5f6f407220cA83e65e45FE |

### Fantom

| Contract Name            | Contract Address                           |
| ------------------------ | ------------------------------------------ |
| Proxy\_\_L1LiquidityPool | 0x0bF5402a57970C7BD9883248534B644Ab545e6d4 |
| Proxy\_\_L2LiquidityPool | 0xD502Ca71dE5e072918884f638408291c066EF1F6 |
| Proxy__L2BillingContract | 0xD5b0E66566FEe76d6c550e7190385703Bcf11354 |

<figure><img src="../../../.gitbook/assets/Artboard 2 (18) (1).png" alt=""><figcaption></figcaption></figure>

### Ethereum Goerli

| Contract Name            | Contract Address                           |
| ------------------------ | ------------------------------------------ |
| Proxy\_\_L1LiquidityPool | 0x1F32017A84dE07A524b9C6993D35B4bF70e8Dc93 |
| Proxy\_\_L2LiquidityPool | 0xF121Fd008A17c8C76DF1f003f19523130060B5BA |
| Proxy__L2BillingContract | 0x04A6e2AB38BB53bD82ae1Aa0521633D640304ab9 |
| L2BOBA                   | 0x4200000000000000000000000000000000000023 |

### Avalanche Testnet

| Contract Name            | Contract Address                           |
| ------------------------ | ------------------------------------------ |
| Proxy\_\_L1LiquidityPool | 0x30caB2fCA6260FB91B172D4AFB215514069868ea |
| Proxy\_\_L2LiquidityPool | 0x9198b3f5C6acCf05dF8847766A68d992355c18c4 |
| Proxy__L2BillingContract | 0xB7E29AB7FB9b6406BAb33Cf6f868fE25B9Ad0160 |

### BNB Testnet

| Contract Name            | Contract Address                           |
| ------------------------ | ------------------------------------------ |
| Proxy\_\_L1LiquidityPool | 0xed142c7BdA2A3d5b08Eae78C96b37FFe60Fecf80 |
| Proxy\_\_L2LiquidityPool | 0xa1786aDDe89d62014CC50bE01d53c16C7A80D460 |
| Proxy__L2BillingContract | 0xe43Ff19D561EA6DB84Dd2Ec3754027fAFDa79499 |

### Moonbase

| Contract Name            | Contract Address                           |
| ------------------------ | ------------------------------------------ |
| Proxy\_\_L1LiquidityPool | 0x569a3e1A4A50D0F53BDF05d50D5FeAB3f716f5A1 |
| Proxy\_\_L2LiquidityPool | 0xb227a9FebBa59B8Fe5dF7Ad81afac6E7CdE5a4A5 |
| Proxy__L2BillingContract | 0x05C9f36D901594D220311B211fA26DbD58B87717 |

### Fantom Testnet

| Contract Name            | Contract Address                           |
| ------------------------ | ------------------------------------------ |
| Proxy\_\_L1LiquidityPool | 0x34024168ba3cfa608005b5E9f13389bb2532422A |
| Proxy\_\_L2LiquidityPool | 0xE7Da2a8EBcbBa0Dc6082B8D0faBAcA0176920760 |
| Proxy__L2BillingContract | 0x675Ea342D2a85D7db0Cc79AE64196ad628Ce8187 |
