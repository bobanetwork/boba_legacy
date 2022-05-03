---
description: Learn more about the Fast Token Bridge

---

# Using the Fast Token Bridge

The fast bridge provides a method for users on both sides to add liquidity for the L1 Fast Bridge Pool and the L2 Fast Bridge Pool. This liquidity is essential to enable the swap-based fast bridge method between L1 and L2. When an ERC20 token is deposited and added to L1 Fast Bridge Pool, the L2 Fast Bridge releases the token on L2 and charges a certain percentage of the deposit amount as the transaction feee. This process is known as "fast bridge a token". e.g. depositing 100 BOBA on L1 in exchange for 99.7 BOBA on L2 and also the reverse - withdrawing 100 BOBA on L2 in exchange for the 99.7 BOBA on L1. In addition to bridging tokens(ERC20) the fast bridge can also be used for ETH.

The Fast Bridge is composed of two main contracts the [`L1LiquidityPool` (opens new window)](https://github.com/bobanetwork/boba/blob/develop/packages/boba/contracts/contracts/LP/L1LiquidityPool.sol)(for Layer 1) and the [`L2LiquidityPool` (opens new window)](https://github.com/bobanetwork/boba/blob/develop/packages/boba/contracts/contracts/LP/L2LiquidityPool.sol)(for Layer 2).

Here we'll go over the basics of using this bridge to move ERC20 and ETH assets between Layer 1 and Layer 2.

## Deposits

> Please check the liquidity balance of the L2 Liquidity Pool first before depositing tokens on the L1 Liquidity Pool. If the L2 Liquidty Pool doesn't have enough balance to complete your swap, your funds would be returned back to you from L2 and the L1 Liquidity Pool would charge a certain percentage of the deposit amount.

### Deposit ERC20s or ETH

ERC20 and ETH deposits into L2 can triggered via the `clientDepositL1`  functions on the [`L1LiquidityPool` (opens new window)](https://github.com/bobanetwork/boba/blob/develop/packages/boba/contracts/contracts/LP/L1LiquidityPool.sol). You **must** approve the Standard Token Bridge to use the amount of tokens that you want to deposit or the deposit will fail.

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

## Withdraws

> Please check the liquidity balance of the L1 Liquidity Pool first before depositing tokens on the L2 Liquidity Pool. If the L1 Liquidty Pool doesn't have enough balance to complete your swap, your funds would be returned back to you from L1 and the L2 Liquidity Pool would charge a certain percentage of the exit amount.

### Withdraw ERC20s or ETH

ERC20 and ETH withdrawals can be triggered via the `clientDepositL2` functions on the [`L2LiquidityPool` (opens new window)](https://github.com/bobanetwork/boba/blob/develop/packages/boba/contracts/contracts/LP/L2LiquidityPool.sol)

```js
const PRIVATE_KEY, L2_NODE_WEB3_URL, PROXY_L2_LIQUIDITY_POOL_ADDRESS

const L2Provider = new ethers.providers.StaticJsonRpcProvider(L2_NODE_WEB3_URL)
const L2Wallet = new ethers.Wallet(PRIVATE_KEY).connect(L2Provider)

const Proxy__L2LiquidityPool = new ethers.Contract(
  PROXY_L2_LIQUIDITY_POOL_ADDRESS,
  L2LiquidityPoolABI,
  L2Wallet
)

// Approve amounts
const approveTx = await L2ERC20Contract.approve(Proxy__L2LiquidityPool.address, depositAmount)
await approveTx.wait()

// Deposit ERC20
const depositERC20Tx = await Proxy__L2LiquidityPool.clientDepositL2(
  depositAmount,
  l2TokenAddress,
)
await depositERC20Tx.wait()

// Deposit ETH
// ETH address is 0x4200000000000000000000000000000000000006 on L2
const depositETHTx = await Proxy__L2LiquidityPool.clientDepositL2(
  depositAmount,
  '0x4200000000000000000000000000000000000006', // ETH Address
  {value: depositAmount}
)
await depositETHTx.wait()
```

## The Boba token list

The Fast bridge allows a one-to-one mapping between L1 and L2 tokens.

| Network | URL                                                          |
| ------- | ------------------------------------------------------------ |
| Mainnet | [Mainnet Boba Token List](https://github.com/bobanetwork/boba/blob/develop/packages/boba/register/addresses/addressesMainnet_0x8376ac6C3f73a25Dd994E0b0669ca7ee0C02F089.json) |
| Rinkeby | [Rinkeby Boba Token List](https://github.com/bobanetwork/boba/blob/develop/packages/boba/register/addresses/addressesRinkeby_0x93A96D6A5beb1F661cf052722A1424CDDA3e9418.json) |

## Links

### Mainnet

| Contract Name          | Contract Address                           |
| ---------------------- | ------------------------------------------ |
| Proxy__L1LiquidityPool | 0x1A26ef6575B7BBB864d984D9255C069F6c361a14 |
| Proxy__L2LiquidityPool | 0x3A92cA39476fF84Dc579C868D4D7dE125513B034 |

### Rinkeby

| Contract Name          | Contract Address                           |
| ---------------------- | ------------------------------------------ |
| Proxy__L1LiquidityPool | 0x12F8d1cD442cf1CF94417cE6309c6D2461Bd91a3 |
| Proxy__L2LiquidityPool | 0x56851CB42F315D0B90496c86E849167B8Cf7108a |

