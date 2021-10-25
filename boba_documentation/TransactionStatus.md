# Transaction Status and Verification

There are 4 different mechanisms for following the status of transactions. 

1. The Boba Blockexplorer (for L2) and Etherscan (for L1)
2. Running a typescript `watcher`
3. Using the Boba `watcher-api`
4. Third-party analytics based on external replicas

## 1. Blockexplorer

`https://blockexplorer.rinkeby.boba.network/address/____VALUE____/transactions`

## 2. Running a watcher

Internally in all the services, and also in the `gateway`, the status of all transactions in monitored through a typescript watcher. For example, see https://github.com/omgnetwork/optimism-v2/blob/develop/integration-tests/test/shared/watcher-utils.ts. Here is some generic pseudocode:

```javascript

import { Watcher } from '@eth-optimism/core-utils'

this.watcher = new Watcher({
	l1: {
	  provider: this.L1Provider,
	  messengerAddress: this.L1MessengerAddress,
	},
	l2: {
	  provider: this.L2Provider,
	  messengerAddress: this.L2MessengerAddress,
	},
})

//Move ETH from L1 to L2 using the standard deposit system
depositETHL2 = async (value_Wei_String) => {

	try {

	  const depositTxStatus = await this.L1StandardBridgeContract.depositETH(
	    this.L2GasLimit,
	    utils.formatBytes32String(new Date().getTime().toString()),
	    {
	      value: value_Wei_String
	    }
	  )

	  //at this point the tx has been submitted, and we are waiting...
	  await depositTxStatus.wait()

	  const [l1ToL2msgHash] = await this.watcher.getMessageHashesFromL1Tx(
	    depositTxStatus.hash
	  )
	  console.log(' got L1->L2 message hash', l1ToL2msgHash)

	  const l2Receipt = await this.watcher.getL2TransactionReceipt(
	    l1ToL2msgHash
	  )
	  console.log(' completed Deposit! L2 tx hash:', l2Receipt.transactionHash)

	  return l2Receipt
	} catch(error) {
	  console.log("NS: depositETHL2 error:",error)
	  return error
	}
}

```

## 3. Using the Boba Transaction API

The system is documented here: https://github.com/omgnetwork/optimism-v2/tree/develop/ops_boba/api/watcher-api. 

> Mainnet Endpoint: https://api-watcher.mainnet.boba.network/   
> Rinkeby Endpoint: https://api-watcher.rinkeby.boba.network/  

For example, to get L2 transactions between two blocks, use `get.l2.transactions`: 

#### get.l2.transactions

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

## 4. Using third party analytics providers

Some teams prefer to use providers such as https://thegraph.com/en/, which is available on Boba as well.
