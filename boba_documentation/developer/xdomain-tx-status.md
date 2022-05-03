---
description: How to monitor cross-domain transaction status
---

# Crossdomain Transaction Status

There are 4 different mechanisms for following the status of a transaction. In addition to using the Boba Blockexplorer (for L2) and Etherscan (for L1), you can use:

2. Third-party analytics
3. A typescript `messenger`
4. The Boba `watcher-api`

## Using Third Party Analytics

Some teams prefer to use providers such as [The Graph](https://thegraph.com/en/), which is available on Boba. Please see [The Graph on Boba](../../packages/boba/subgraph/README.md) for more information.

## Running a messenger

Internally in all the services and also in the `gateway`, the status of transactions is monitored through a `messenger`. Here is an example for how that is done.

```javascript

  import {
    CrossChainMessenger,
    MessageStatus,
    MessageDirection,
  } from '@eth-optimism/sdk'

  const messenger = new CrossChainMessenger({
    l1SignerOrProvider: l1Wallet,
    l2SignerOrProvider: l2Wallet,
    l1ChainId: network.chainId,
    fastRelayer: false,
  })

  withdrawalTest(
    '{tag:other} should withdraw tokens from L2 to the depositor',
    async () => {
      const tx = await emessenger.withdrawERC20(
        L1__ERC20.address,
        L2__ERC20.address,
        500
      )

      await messenger.waitForMessageStatus(
        tx,
        MessageStatus.READY_FOR_RELAY
      )

      await messenger.waitForMessageReceipt(tx)

      expect(await L1__ERC20.balanceOf(env.l1Wallet.address)).to.deep.equal(
        BigNumber.from(999500)
      )
      expect(await L2__ERC20.balanceOf(env.l2Wallet.address)).to.deep.equal(
        BigNumber.from(0)
      )
    }
  )

```

## Using the Boba Transaction API

The system is [documented here](../../ops_boba/api/watcher-api/README.md). For example, to get L2 transactions between two blocks, use `get.l2.transactions`: 

### get.l2.transactions

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
      l1Hash: "L1_HASH",  // L1 hash of the cross domain message
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