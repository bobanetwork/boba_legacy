# Watcher API

> Mainnet Endpoint: https://api-watcher.mainnet.boba.network/   
> Rinkeby Endpoint: https://api-watcher.rinkeby.boba.network/  

## Methods

### Layer 1

#### get.l1.transactions (POST)

**Request Body**

```js
{
  address: "ACCOUNT",
  from: "NUMBER",
  to: "NUMBER"
}
```

**Response Body**

```js
[
  {
    hash: "TRANSACTION_HASH",
    blockNumber: "BLOCK_NUMBER",
    from: "FROM_ACCOUNT",
    to: "TO_ACCOUNT",
    timestamp: "BLOCK_TIMESTAMP",
    contractName: "CONTRACT_NAME", // L1StandardBridge or L1LiquidityPool
    contractAddress: "CONTRACT_ADDRESS", // Contract address
    activity: "ACTIVITY", // event names (ETHDepositInitiated, ERC20DepositInitiated, ClientDepositL1, etc.)
    depositL2: "DEPOSIT_L2", // True or False
    crossDomainMessage: {
      crossDomainMessage: "CROSS_DOMAIN_MESSAGE", // whether the transaction sent cross domain message
      crossDomainMessageFinalize: "CROSS_DOMAIN_MESSAGE_FINALIZED", // whether the cross domain message is finalized on L1
      crossDomainMessageSendTime: "CROSS_DOMAIN_MESSAGE_FINALIZED_TIME", // when the cross domain message is finalized
      crossDomainMessageEstimateFinalizedTime: "ESTIMATE_CROSS_DOMAIN_MESSAGE_FINALIZED_TIME",
      fast: "FAST_DEPOSIT", // Whether the message is using the liquidity pool
      l2Hash: "L2_HASH", // L2 hash of the cross domain message
      l2BlockNumber: "L2_BLOCK_NUMBER",
      l2BlockHash: "L2_BLOCK_HASH",
      l2From: "L2_FROM",
      l2To: "L2_TO"
    },
    action: {
      sender: "DEPOSIT_SENDER", // The address of L1 token sender
      to: "DEPOSIT_RECEIVER", // The address of L2 token receiver
      token: "DEPOSIT_TOKEN", // L1 token address
      amount: "DEPOSIT_AMOUNT", // L1 deposit amount, which doesn't consider fee
      receive: "DEPOSIT_RECEIVE", // L2 received amount
      feeRate: "DEPOSIT_FEE",
      fast: "FAST_DEPOSIT",
      status: "STATUS" // pending || succeeded || reverted
    }
  }
]
```

### Layer 2

#### get.l2.transactions (POST)

**Request Body**

```js
{
  address: "ACCOUNT",
  from: "NUMBER",
  to: "NUMBER"
}
```

**Response Body**

```js
[
  {
    hash: "TRANSACTION_HASH",
    blockNumber: "BLOCK_NUMBER",
    from: "FROM_ACCOUNT",
    to: "TO_ACCOUNT",
    timestamp: "BLOCK_TIMESTAMP",
    exitL2: "EXIT_L2", // True or False
    crossDomainMessage: {
      crossDomainMessage: "CROSS_DOMAIN_MESSAGE", // whether the transaction sent cross domain message
      crossDomainMessageFinalize: "CROSS_DOMAIN_MESSAGE_FINALIZED", // whether the cross domain message is finalized on L1
      crossDomainMessageSendTime: "CROSS_DOMAIN_MESSAGE_FINALIZED_TIME", // when the cross domain message is finalized
      crossDomainMessageEstimateFinalizedTime: "ESTIMATE_CROSS_DOMAIN_MESSAGE_FINALIZED_TIME",
      fast: "FAST_RELAY", // Whether the message is using the fast message relayer
      l1Hash: "L1_HASH", // L1 hash of the cross domain message
      l1BlockNumber: "L1_BLOCK_NUMBER",
      l1BlockHash: "L1_BLOCK_HASH",
      l1From: "L1_FROM",
      l1To: "L1_TO"
    },
    stateRoot: {
      stateRootHash: "L1_STATE_ROOT_HASH",
      stateRootBlockNumber: "L1_STATE_ROOT_BLOCK_NUMBER",
      stateRootBlockHash: "L1_STATE_ROOT_BLOCK_HASH",
      stateRootBlockTimestamp: "L1_STATE_ROOT_BLOCK_TIMESTAMP"
    },
    action: {
      sender: "EXIT_SENDER", // The address of L2 token sender
      to: "EXIT_RECEIVER", // The address of L1 token receiver
      token: "EXIT_TOKEN", // L2 token address
      amount: "EXIT_AMOUNT", // L2 exit amount, which doesn't consider fee
      receive: "EXIT_RECEIVE", // L1 received amount
      feeRate: "EXIT_FEE",
      relay: "FAST_RELAY",
      status: "STATUS" // pending || succeeded || reverted
    }
  }
]
```

#### get.l2.deployments (POST)

**Request Body**

```js
{
  address: "ACCOUNT"
}
```

**Response Body**

```js
[
  {
    hash: "TRANSACTION_HASH",
    blockNumber: "BLOCK_NUMBER",
    from: "FROM_ACCOUNT",
    timeStamp: "BLOCK_TIMESTAMP",
    contractAddress: "CONTRACT_ADDRESS"
  }
]
```

#### get.l2.crossdomainmessage (POST)

**Request Body**

```js
{
  hash: "HASH"
}
```

**Response Body**

```js
{
  hash: "TRANSACTION_HASH",
  blockNumber: "BLOCK_NUMBER",
  from: "FROM_ACCOUNT",
  to: "TO_ACCOUNT"
  timeStamp: "BLOCK_TIMESTAMP",
  crossDomainMessage: "CROSS_DOMAIN_MESSAGE", // whether the transaction sent cross domain message
  crossDomainMessageFinalize: "CROSS_DOMAIN_MESSAGE_FINALIZED", // whether the cross domain message is finalized on L1
  crossDomainMessageSendTime: "CROSS_DOMAIN_MESSAGE_FINALIZED_TIME", // when the cross domain message is finalized
  crossDomainMessageEstimateFinalizedTime: "ESTIMATE_CROSS_DOMAIN_MESSAGE_FINALIZED_TIME",
  fast: "FAST_RELAY" // Whether the message is using the fast message relayer
  l1Hash: "L1_HASH", // L1 hash of the cross domain message
  l1BlockNumber: "L1_BLOCK_NUMBER",
  l1BlockHash: "L1_BLOCK_HASH",
  l1From: "L1_FROM",
  l1To: "L1_TO"
}
```

#### get.l2.pendingexits (GET)

**Response Body**

```
{
  hash: "TRANSACTION_HASH",
  blockHash: "BLOCK_HASH",
  blockNumber: "BLOCK_NUMBER",
  exitSender: "EXIT_SENDER",
  exitTo: "EXIT_TO", // L1 LP address
  exitTOKEN: "EXIT_TOKEN_L2_ADDRESS",
  exitAmount: "EXIT_AMOUNT",
  exitReceive: "EXIT_RECEIVE",
  fastRelay: "FAST_RELAY" // 1 or 0,
  status: "pending"
}
```

### Global

#### send.crossdomainmessage (POST)

**Request Body**

```js
{
  hash: "HASH",
  block: "BLOCK_NUMBER[INT]",
  startTime: "START_TIME[INT]",
  l1Tol2: "BOOL",
  key: "PRIVATE_KEY",
  endTime: "END_TIME[INT]", // not required
  cdmHash: "CROSS_DOMAIN_HASH", // not required
  cdmBlock: "CROSS_DOMAIN_BLOCK[INT]", // not required
}
```

**Response Body**

```js
// Success
{ status: "succeeded" }
// failure
{ status: "failed" }
```

### Airdrop

#### get.l1.airdrop (POST) / get.l2.airdrop (POST) 

**Request Body**

```js
{
  "address": "ADDRESS",
  "key":"ACCESS_KEY"
}
```

**Response Body**

```js
{
  "address": "ADDRESS",
  "amount": "AMOUNT_WEI_STRING",
  "claimed": "TRUE / FALSE",
  "claimedTimestamp": "TIMESTAMP",
  "claimedAmount": "AMOUNT_WEI_STRING",
  "claimImmediate": "TRUE / FALSE", //if staked on L2 during snapshot, claimImmediate === True
  "claimUnlockTime": "TIMESTAMP", //if claimImmediate === false, claimUnlockTime = claimTimestamp + 30 days
  "merkleProof": {
    "index": "INDEX",
    "amount": "AMOUNT", //hex,
    "proof": "PROOF"
  },
  "network": "NETWORK" // bobanetwork or mainnet
}
```

#### send.l1.airdrop (POST) / send.l2.airdrop (POST) 

**Request Body**

```js
{
  "address":"ADDRESS",
  "key":"ACCESS_KEY"
}
```

**Effect on DB entries**

When `send.l_.airdrop` is called, the `claimed` flag should change to `true` and the `claimedTimestamp` should change to the `now` unix seconds timestamp, for example, `1636964190`.
If `claimed` already === `true` then calling `send.l_.airdrop` should have no effect.   

**Response Body**

```js
// Success
{ status: "succeeded" }
// failure
{ status: "failed" }
```

#### initiate.l1.airdrop (POST)

**Request Body**

```js
{
  "address":"ADDRESS",
  "key":"ACCESS_KEY"
}
```

**Effect on DB entries**

When `initiate.l1.airdrop` is called, the `claimUnlockTime` should change from `null` to a unix seconds timestamp = now + 30 days, for example, `1636964190`. 
If `claimUnlockTime` already !== `null` then calling `initiate.l1.airdrop` should have no effect.  

**Response Body**

```js
// Success
{ status: "succeeded" }
// failure
{ status: "failed" }
```

