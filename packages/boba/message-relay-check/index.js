const { CrossChainMessenger, MessageStatus } = require('@bobanetwork/sdk')
const { providers } = require('ethers')
require('dotenv').config()

const L1_NODE_URL = process.env.L1_NODE_URL
const L2_NODE_URL = process.env.L2_NODE_URL
const L2_START_OFFSET = Number(process.env.L2_START_OFFSET) || 800000
const L1_START_OFFSET = Number(process.env.L1_START_OFFSET) || 19600000

const main = async () => {
  const l1Provider = new providers.JsonRpcProvider(L1_NODE_URL)
  const l2Provider = new providers.JsonRpcProvider(L2_NODE_URL)

  const l1ChainId = (await l1Provider.getNetwork()).chainId

  const relayer = new CrossChainMessenger({
    l1SignerOrProvider: l1Provider,
    l2SignerOrProvider: l2Provider,
    l1ChainId,
    fastRelayer: false,
  })
  const fastRelayer = new CrossChainMessenger({
    l1SignerOrProvider: l1Provider,
    l2SignerOrProvider: l2Provider,
    l1ChainId,
    fastRelayer: true,
  })

  let l2BlockNumber = await l2Provider.getBlockNumber()
  let highestCheckedL2Block = L2_START_OFFSET
  while (l2BlockNumber > highestCheckedL2Block) {
    try {
      const block = await relayer.l2Provider.getBlockWithTransactions(
        highestCheckedL2Block
      )

      const messages = await relayer.getMessagesByTransaction(
        block.transactions[0].hash
      )
      await filterMessages(
        messages,
        relayer,
        fastRelayer,
        highestCheckedL2Block
      )

      l2BlockNumber = await l2Provider.getBlockNumber()
      highestCheckedL2Block += 1
    } catch (e) {
      console.error(e)
    }
  }
  return
}

const filterMessages = async (
  messages,
  relayer,
  fastRelayer,
  highestCheckedL2Block
) => {
  if (messages.length === 0) {
    console.log(
      `No message found for transaction for block ${highestCheckedL2Block}`
    )
  } else {
    console.log(
      `Message found for transaction for block ${highestCheckedL2Block}`
    )
    for (const message of messages) {
      const status = await relayer.getMessageStatusFromContracts(message, {
        fromBlock: L1_START_OFFSET,
      })
      const fastStatus = await fastRelayer.getMessageStatusFromContracts(
        message,
        {
          fromBlock: L1_START_OFFSET,
        }
      )
      if (
        status !== MessageStatus.RELAYED &&
        fastStatus !== MessageStatus.RELAYED
      ) {
        console.log(
          `Message ${message.transactionHash} status: ${
            status > fastStatus ? status : fastStatus
          } for block ${highestCheckedL2Block}`
        )
        throw new Error('Message not relayed')
      } else {
        console.log(
          `Message ${message.transactionHash} status: ${
            status > fastStatus ? status : fastStatus
          } for block ${highestCheckedL2Block}`
        )
      }
    }
  }
}

main().catch(console.error)
