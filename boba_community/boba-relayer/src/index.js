const { providers, Wallet, utils } = require('ethers')
require('dotenv').config()

const {
  CUSTOM_ERROR,
  FAST_RELAYER_LIST,
  L2_CROSS_DOMAIN_MESSENGER_TOPIC,
} = require('./constant')

const { formatTime } = require('./utils')

const {
  CrossChainMessenger,
  MessageStatus,
  CONTRACT_ADDRESSES,
} = require('@bobanetwork/sdk')

const main = async () => {
  const env = process.env
  const L1_NODE_WEB3_URL = env.L1_NODE_WEB3_URL
  const L2_NODE_WEB3_URL = env.L2_NODE_WEB3_URL
  const PRIV_KEY = env.PRIV_KEY
  const L2_TRANSACTION_HASH = env.L2_TRANSACTION_HASH

  // provider
  const l1Provider = new providers.JsonRpcProvider(L1_NODE_WEB3_URL)
  const l2Provider = new providers.JsonRpcProvider(L2_NODE_WEB3_URL)
  const l1Wallet = new Wallet(PRIV_KEY).connect(l1Provider)

  // select network
  const chainId = (await l1Provider.getNetwork()).chainId
  if (typeof CONTRACT_ADDRESSES[chainId] === 'undefined') {
    console.error(`!! chainId: ${chainId} is not supported`)
    return null
  }
  const contractAddress = CONTRACT_ADDRESSES[chainId]

  // verify the cross chain message
  const l2TxReceipt = await l2Provider.getTransactionReceipt(
    L2_TRANSACTION_HASH
  )
  if (l2TxReceipt === null) {
    console.error(
      `!! invalid L2_TRANSACTION_HASH: ${L2_TRANSACTION_HASH}. The transaction is not found.`
    )
    return CUSTOM_ERROR.INVALID_L2_TRANSACTION_HASH
  }

  const logData = l2TxReceipt.logs.filter(
    (i) =>
      i.address === contractAddress.l2.L2CrossDomainMessenger &&
      i.topics[0] === L2_CROSS_DOMAIN_MESSENGER_TOPIC
  )
  if (logData.length === 0) {
    console.error(
      `!! invalid L2_TRANSACTION_HASH: ${L2_TRANSACTION_HASH}. The transaction is not a cross chain message.`
    )
    return CUSTOM_ERROR.INVALID_L2_CROSS_DOMAIN_TX
  }

  let target
  // get the L2 message hash
  for (const log of logData) {
    const messageHash = log.topics[1]
    target = utils.defaultAbiCoder.decode(['address'], log.topics[1])[0]
    console.log(
      `Found l2 cross chain message hash: ${messageHash} to l1 address: ${target}`
    )
  }

  const isFastMessage = FAST_RELAYER_LIST[chainId].includes(target)

  const messenger = new CrossChainMessenger({
    l1SignerOrProvider: l1Wallet,
    l2SignerOrProvider: l2Provider,
    l1ChainId: chainId,
    fastRelayer: isFastMessage,
  })

  const l1BlockNumber = await l1Provider.getBlockNumber()
  const fromBlock = Math.max(0, l1BlockNumber - 10000000)
  const messages = await messenger.getMessagesByTransaction(L2_TRANSACTION_HASH)

  for (const message of messages) {
    const messageStatus = await messenger.getMessageStatus(message, {
      fromBlock,
    })
    if (messageStatus === MessageStatus.RELAYED) {
      console.log(
        `Your message is relayed on L1 sucessfully! L1 transaction hash: ${message.transactionHash}.`
      )
      return null
    }
    if (messageStatus === MessageStatus.IN_CHALLENGE_PERIOD) {
      const batchEvent =
        await messenger.getStateBatchAppendedEventByTransactionIndex(
          l2TxReceipt.blockNumber,
          { fromBlock }
        )
      const l1LatestBlock = await l1Provider.getBlock('latest')
      const l1BatchBlockNumber = batchEvent.blockNumber
      const l1BatchTimestamp = (await l1Provider.getBlock(l1BatchBlockNumber))
        ?.timestamp
      const challengeWindow = await messenger.getChallengePeriodSeconds()
      console.log(
        `Your message is in the challenge window. Please wait ${formatTime(
          l1BatchTimestamp + challengeWindow - l1LatestBlock.timestamp
        )} (h:mm:ss).`
      )
      return null
    }
    if (messageStatus === MessageStatus.STATE_ROOT_NOT_PUBLISHED) {
      const totalBatch =
        await messenger.contracts.l1.StateCommitmentChain.getTotalBatches()
      const batchEvent = await messenger.getStateBatchAppendedEventByBatchIndex(
        totalBatch.toNumber() - 1,
        { fromBlock }
      )
      const totalElements =
        batchEvent.args._prevTotalElements.toNumber() +
        batchEvent.args._batchSize.toNumber()
      console.log(
        `Your transaction has not been included on L1. Batch element index: ${totalElements}. L2 transaction index: ${l2TxReceipt.blockNumber}.`
      )
      return null
    }
    if (
      messageStatus === MessageStatus.RELAYED ||
      messageStatus === MessageStatus.RELAYED_FAILED
    ) {
      const messageReceipt = await messenger.getMessageReceipt(message, {
        fromBlock,
      })
      console.log(
        `Your message is relayed on L1 sucessfully! L1 transaction hash: ${messageReceipt.transactionHash}.`
      )
      return null
    }
    if (messageStatus === MessageStatus.READY_FOR_RELAY) {
      console.log(`Your message is ready for relay!`)
      const estimateGas = await l1Provider.estimateGas(
        messenger.populateTransaction.finalizeMessage(message)
      )
      const gasPrice = await l1Provider.getGasPrice()
      const gasFee = utils.formatEther(estimateGas.mul(gasPrice))
      console.log(`Estimated gas fee: ${gasFee.toString()}`)

      // Relay the message
      const overrideOptions = { gasLimit: estimateGas.mul(11).div(10) }
      const tx = await messenger.finalizeMessage(message, {
        overrides: overrideOptions,
      })
      await tx.wait()
    }
  }
}

main()
