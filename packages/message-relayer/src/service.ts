/* Imports: External */
import { Contract, ethers, Wallet, BigNumber, providers, Signer } from 'ethers'
import * as rlp from 'rlp'
import { MerkleTree } from 'merkletreejs'
import fetch from 'node-fetch'
import * as ynatm from '@eth-optimism/ynatm'

/* Imports: Internal */
import { fromHexString, sleep } from '@eth-optimism/core-utils'
import { Logger, BaseService, Metrics } from '@eth-optimism/common-ts'

import {
  loadContract,
  loadContractFromManager,
  predeploys,
} from '@eth-optimism/contracts'
import {
  StateRootBatchHeader,
  SentMessage,
  SentMessageProof,
  BatchMessage,
} from './types'

interface MessageRelayerOptions {
  // Providers for interacting with L1 and L2.
  l1RpcProvider: providers.StaticJsonRpcProvider
  l2RpcProvider: providers.StaticJsonRpcProvider

  // Address of the AddressManager contract, used to resolve the various addresses we'll need
  // within this service.
  addressManagerAddress: string

  // Wallet instance, used to sign and send the L1 relay transactions.
  l1Wallet: Wallet

  // Max gas to relay messages with.
  relayGasLimit: number

  //batch system
  minBatchSize: number
  maxWaitTimeS: number

  // Height of the L2 transaction to start searching for L2->L1 messages.
  fromL2TransactionIndex?: number

  // Interval in seconds to wait between loops.
  pollingInterval?: number

  // Number of blocks that L2 is "ahead" of transaction indices. Can happen if blocks are created
  // on L2 after the genesis but before the first state commitment is published.
  l2BlockOffset?: number

  // L1 block to start querying events from. Recommended to set to the StateCommitmentChain deploy height
  l1StartOffset?: number

  // Number of blocks within each getLogs query - max is 2000
  getLogsInterval?: number

  // A custom logger to transport logs via; default STDOUT
  logger?: Logger

  // A custom metrics tracker to manage metrics; default undefined
  metrics?: Metrics

  // filter
  filterEndpoint?: string

  filterPollingInterval?: number

  // gas fee
  maxGasPriceInGwei?: number

  gasRetryIncrement?: number

  numConfirmations?: number

  resubmissionTimeout?: number

  maxWaitTxTimeS: number
}

const optionSettings = {
  relayGasLimit: { default: 4_000_000 },
  //batch system
  minBatchSize: { default: 2 },
  maxWaitTimeS: { default: 60 },
  fromL2TransactionIndex: { default: 0 },
  pollingInterval: { default: 5000 },
  l2BlockOffset: { default: 1 },
  l1StartOffset: { default: 0 },
  getLogsInterval: { default: 2000 },
  filterPollingInterval: { default: 60000 },
  maxWaitTxTimeS: { default: 180 },
}

export class MessageRelayerService extends BaseService<MessageRelayerOptions> {
  constructor(options: MessageRelayerOptions) {
    super('Message_Relayer', options, optionSettings)
  }

  private state: {
    lastFinalizedTxHeight: number
    nextUnfinalizedTxHeight: number
    lastQueriedL1Block: number
    eventCache: ethers.Event[]
    Lib_AddressManager: Contract
    StateCommitmentChain: Contract
    L1CrossDomainMessenger: Contract
    L1MultiMessageRelayer: Contract
    L2CrossDomainMessenger: Contract
    OVM_L2ToL1MessagePasser: Contract
    filter: Array<any>
    lastFilterPollingTimestamp: number
    //batch system
    timeSinceLastRelayS: number
    timeOfLastRelayS: number
    messageBuffer: Array<BatchMessage>
    timeOfLastPendingRelay: any
  }

  protected async _init(): Promise<void> {
    this.logger.info('Initializing message relayer', {
      relayGasLimit: this.options.relayGasLimit,
      fromL2TransactionIndex: this.options.fromL2TransactionIndex,
      pollingInterval: this.options.pollingInterval,
      l2BlockOffset: this.options.l2BlockOffset,
      getLogsInterval: this.options.getLogsInterval,
      filterPollingInterval: this.options.filterPollingInterval,
      minBatchSize: this.options.minBatchSize,
      maxWaitTimeS: this.options.maxWaitTimeS,
    })
    // Need to improve this, sorry.
    this.state = {} as any

    const address = await this.options.l1Wallet.getAddress()
    this.logger.info('Using L1 EOA', { address })

    this.state.Lib_AddressManager = loadContract(
      'Lib_AddressManager',
      this.options.addressManagerAddress,
      this.options.l1RpcProvider
    )

    this.logger.info('Connecting to StateCommitmentChain...')
    this.state.StateCommitmentChain = await loadContractFromManager({
      name: 'StateCommitmentChain',
      Lib_AddressManager: this.state.Lib_AddressManager,
      provider: this.options.l1RpcProvider,
    })
    this.logger.info('Connected to StateCommitmentChain', {
      address: this.state.StateCommitmentChain.address,
    })

    this.logger.info('Connecting to L1CrossDomainMessenger...')
    this.state.L1CrossDomainMessenger = await loadContractFromManager({
      name: 'L1CrossDomainMessenger',
      proxy: 'Proxy__L1CrossDomainMessenger',
      Lib_AddressManager: this.state.Lib_AddressManager,
      provider: this.options.l1RpcProvider,
    })
    this.logger.info('Connected to L1CrossDomainMessenger', {
      address: this.state.L1CrossDomainMessenger.address,
    })

    this.logger.info('Connecting to L2CrossDomainMessenger...')
    this.state.L2CrossDomainMessenger = await loadContractFromManager({
      name: 'L2CrossDomainMessenger',
      Lib_AddressManager: this.state.Lib_AddressManager,
      provider: this.options.l2RpcProvider,
    })
    this.logger.info('Connected to L2CrossDomainMessenger', {
      address: this.state.L2CrossDomainMessenger.address,
    })

    this.logger.info('Connecting to L1MultiMessageRelayer...')
    this.state.L1MultiMessageRelayer = await loadContractFromManager({
      name: 'L1MultiMessageRelayer',
      Lib_AddressManager: this.state.Lib_AddressManager,
      provider: this.options.l1RpcProvider,
    })
    this.logger.info('Connected to L1MultiMessageRelayer', {
      address: this.state.L1MultiMessageRelayer.address,
    })

    this.logger.info('Connecting to OVM_L2ToL1MessagePasser...')
    this.state.OVM_L2ToL1MessagePasser = loadContract(
      'OVM_L2ToL1MessagePasser',
      predeploys.OVM_L2ToL1MessagePasser,
      this.options.l2RpcProvider
    )
    this.logger.info('Connected to OVM_L2ToL1MessagePasser', {
      address: this.state.OVM_L2ToL1MessagePasser.address,
    })

    this.logger.info('Connected to all contracts.')

    this.state.lastQueriedL1Block = this.options.l1StartOffset
    this.state.eventCache = []

    this.state.lastFinalizedTxHeight = this.options.fromL2TransactionIndex || 0
    this.state.nextUnfinalizedTxHeight =
      this.options.fromL2TransactionIndex || 0
    this.state.lastFilterPollingTimestamp = 0

    // filter
    this.state.filter = []

    //batch system
    this.state.timeOfLastRelayS = Date.now()
    this.state.timeSinceLastRelayS = 0
    this.state.messageBuffer = []
    this.state.timeOfLastPendingRelay = false
  }

  protected async _start(): Promise<void> {
    while (this.running) {
      await sleep(this.options.pollingInterval)
      await this._getFilter()

      try {
        // Check that the correct address is set in the address manager
        const relayer = await this.state.Lib_AddressManager.getAddress(
          'OVM_L2MessageRelayer'
        )
        // If it is address(0), then message relaying is not authenticated
        if (relayer !== ethers.constants.AddressZero) {
          const address = await this.options.l1Wallet.getAddress()
          if (relayer !== address) {
            throw new Error(
              `OVM_L2MessageRelayer (${relayer}) is not set to message-passer EOA ${address}`
            )
          }
        }

        //Batch flushing logic
        const secondsElapsed = Math.floor(
          (Date.now() - this.state.timeOfLastRelayS) / 1000
        )
        console.log('\n***********************************')
        console.log('Seconds elapsed since last batch push:', secondsElapsed)
        const timeOut =
          secondsElapsed > this.options.maxWaitTimeS ? true : false

        let pendingTXTimeOut = true
        if (this.state.timeOfLastPendingRelay !== false) {
          const pendingTXSecondsElapsed = Math.floor(
            (Date.now() - this.state.timeOfLastPendingRelay) / 1000
          )
          console.log('\n***********************************')
          console.log(
            'Next tx since last tx submitted',
            pendingTXSecondsElapsed
          )
          pendingTXTimeOut =
            pendingTXSecondsElapsed > this.options.maxWaitTxTimeS ? true : false
        }

        //console.log('Current buffer size:', this.state.messageBuffer.length)
        const bufferFull =
          this.state.messageBuffer.length >= this.options.minBatchSize
            ? true
            : false

        // check gas price
        const gasPrice = await this.options.l1RpcProvider.getGasPrice()
        const gasPriceGwei = Number(ethers.utils.formatUnits(gasPrice, 'gwei'))
        const gasPriceAcceptable =
          gasPriceGwei < this.options.maxGasPriceInGwei ? true : false

        if (
          this.state.messageBuffer.length !== 0 &&
          (bufferFull || timeOut) &&
          pendingTXTimeOut
        ) {
          if (gasPriceAcceptable) {
            if (bufferFull) {
              console.log('Buffer full: flushing')
            }
            if (timeOut) {
              console.log('Buffer timeout: flushing')
            }

            /* parse this to make sure that the mesaage was actually relayed */
            // clear out buffer only if the messages are relayed to L1 successfully
            if (
              await this._wereMessagesRelayed(
                this.state.messageBuffer.reduce((acc, cur) => {
                  acc.push(cur.message)
                  return acc
                }, [])
              )
            ) {
              //clear out the buffer so we do not double relay, which will just
              // waste gas
              this.state.messageBuffer = []
              this.state.timeOfLastPendingRelay = false
            } else {
              const receipt = await this._relayMultiMessageToL1(
                this.state.messageBuffer.reduce((acc, cur) => {
                  acc.push(cur.payload)
                  return acc
                }, [])
              )

              console.log('Receipt:', receipt)
              // add the time interval between two tx
              this.state.timeOfLastPendingRelay = Date.now()
            }
          } else {
            console.log('Current gas price is unacceptable')
            // add the time interval between two tx
            this.state.timeOfLastPendingRelay = Date.now()
          }

          this.state.timeOfLastRelayS = Date.now()
        } else {
          console.log(
            'Buffer still too small - current buffer length:',
            this.state.messageBuffer.length
          )
          console.log('Buffer flush size set to:', this.options.minBatchSize)
          console.log('***********************************\n')
        }

        // scanning the new messages only if the pending messages are relayed
        // to l1
        if (this.state.timeOfLastPendingRelay === false) {
          this.logger.info('Checking for newly finalized transactions...')
          if (
            !(await this._isTransactionFinalized(
              this.state.nextUnfinalizedTxHeight
            ))
          ) {
            this.logger.info('Did not find any newly finalized transactions', {
              retryAgainInS: Math.floor(this.options.pollingInterval / 1000),
            })

            continue
          }

          this.state.lastFinalizedTxHeight = this.state.nextUnfinalizedTxHeight
          while (
            await this._isTransactionFinalized(
              this.state.nextUnfinalizedTxHeight
            )
          ) {
            const size = (
              await this._getStateBatchHeader(
                this.state.nextUnfinalizedTxHeight
              )
            ).batch.batchSize.toNumber()
            this.logger.info(
              'Found a batch of finalized transaction(s), checking for more...',
              { batchSize: size }
            )
            this.state.nextUnfinalizedTxHeight += size

            // Only deal with ~1000 transactions at a time so we can limit the amount of stuff we
            // need to keep in memory. We operate on full batches at a time so the actual amount
            // depends on the size of the batches we're processing.
            const numTransactionsToProcess =
              this.state.nextUnfinalizedTxHeight -
              this.state.lastFinalizedTxHeight

            if (numTransactionsToProcess > 1000) {
              break
            }
          }

          this.logger.info('Found finalized transactions', {
            totalNumber:
              this.state.nextUnfinalizedTxHeight -
              this.state.lastFinalizedTxHeight,
          })

          const messages = await this._getSentMessages(
            this.state.lastFinalizedTxHeight,
            this.state.nextUnfinalizedTxHeight
          )

          for (const message of messages) {
            this.logger.info('Found a message sent during transaction', {
              index: message.parentTransactionIndex,
            })
            if (await this._wasMessageRelayed(message)) {
              this.logger.info('Message has already been relayed, skipping.')
              continue
            }

            if (await this._wasMessageBlocked(message)) {
              this.logger.info('Message has been blocked, skipping.')
              continue
            }

            if (await this._wasMessageFailed(message)) {
              this.logger.info('Last message was failed, skipping.')
              continue
            }

            if (this.state.filter.includes(message.target)) {
              this.logger.info('Message not intended for target, skipping.')
              continue
            }

            this.logger.info(
              'Message not yet relayed. Attempting to generate a proof...'
            )
            const proof = await this._getMessageProof(message)
            this.logger.info(
              'Successfully generated a proof. Attempting to relay to Layer 1...'
            )

            const messageToSend = {
              payload: {
                target: message.target,
                message: message.message,
                sender: message.sender,
                messageNonce: message.messageNonce,
                proof,
              },
              message,
            }
            this.state.messageBuffer.push(messageToSend)
          }

          if (messages.length === 0) {
            this.logger.info('Did not find any L2->L1 messages', {
              retryAgainInS: Math.floor(this.options.pollingInterval / 1000),
            })
          } else {
            // Clear the event cache to avoid keeping every single event in memory and eventually
            // getting OOM killed. Messages are already sorted in ascending order so the last message
            // will have the highest batch index.
            const lastMessage = messages[messages.length - 1]

            // Find the batch corresponding to the last processed message.
            const lastProcessedBatch = await this._getStateBatchHeader(
              lastMessage.parentTransactionIndex
            )

            // Remove any events from the cache for batches that should've been processed by now.
            const oldSize = this.state.eventCache.length
            this.state.eventCache = this.state.eventCache.filter((event) => {
              return (
                event.args._batchIndex > lastProcessedBatch.batch.batchIndex
              )
            })
            const newSize = this.state.eventCache.length
            this.logger.info('Trimmed eventCache', {
              oldSize,
              newSize,
            })
          }

          this.logger.info(
            'Finished searching through newly finalized transactions',
            {
              retryAgainInS: Math.floor(this.options.pollingInterval / 1000),
            }
          )
        } else {
          this.logger.info('Waiting for the pending tx to be finalized')
        }
      } catch (err) {
        this.logger.error('Caught an unhandled error', {
          message: err.toString(),
          stack: err.stack,
          code: err.code,
        })
      }
    }
  }

  private async _getStateBatchHeader(height: number): Promise<
    | {
        batch: StateRootBatchHeader
        stateRoots: string[]
      }
    | undefined
  > {
    const getStateBatchAppendedEventForIndex = async (
      txIndex: number
    ): Promise<ethers.Event> => {
      const selectedEvent = this.state.eventCache.find((cachedEvent) => {
        const prevTotalElements = cachedEvent.args._prevTotalElements.toNumber()
        const batchSize = cachedEvent.args._batchSize.toNumber()

        // Height should be within the bounds of the batch.
        return (
          txIndex >= prevTotalElements &&
          txIndex < prevTotalElements + batchSize
        )
      })
      // No event found
      if (selectedEvent === undefined) {
        return undefined
      }
      // query the new SCC event. event.args._extraData in eventCache might be wrong
      const SCCEvent: ethers.Event[] =
        await this.state.StateCommitmentChain.queryFilter(
          this.state.StateCommitmentChain.filters.StateBatchAppended(),
          selectedEvent.blockNumber,
          selectedEvent.blockNumber
        )
      return SCCEvent[0]
    }

    let startingBlock = this.state.lastQueriedL1Block + 1
    const maxBlock = await this.options.l1RpcProvider.getBlockNumber()
    while (startingBlock <= maxBlock) {
      const endBlock = Math.min(
        startingBlock + this.options.getLogsInterval,
        maxBlock
      )

      this.logger.info('Querying events', {
        startingBlock,
        endBlock,
        maxBlock,
      })
      const events: ethers.Event[] =
        await this.state.StateCommitmentChain.queryFilter(
          this.state.StateCommitmentChain.filters.StateBatchAppended(),
          startingBlock,
          endBlock
        )
      const ebn = []
      events.forEach(e => {
        ebn.push(e.blockNumber)
      })
      this.logger.info('Queried Events', { startingBlock, endBlock, ebn })

      this.state.eventCache = this.state.eventCache.concat(events)
      this.logger.info('Added events to eventCache', {
        added: events.length,
        newSize: this.state.eventCache.length,
      })

      this.state.lastQueriedL1Block = endBlock
      startingBlock = endBlock + 1

      // We need to stop syncing early once we find the event we're looking for to avoid putting
      // *all* events into memory at the same time. Otherwise we'll get OOM killed.
      if ((await getStateBatchAppendedEventForIndex(height)) !== undefined) {
        break
      }
    }

    const event = await getStateBatchAppendedEventForIndex(height)
    if (event === undefined) {
      return undefined
    }

    const transaction = await this.options.l1RpcProvider.getTransaction(
      event.transactionHash
    )

    const [stateRoots] =
      this.state.StateCommitmentChain.interface.decodeFunctionData(
        'appendStateBatch',
        transaction.data
      )

    return {
      batch: {
        batchIndex: event.args._batchIndex,
        batchRoot: event.args._batchRoot,
        batchSize: event.args._batchSize,
        prevTotalElements: event.args._prevTotalElements,
        extraData: event.args._extraData,
      },
      stateRoots,
    }
  }

  private async _isTransactionFinalized(height: number): Promise<boolean> {
    this.logger.info('Checking if tx is finalized', { height })
    const header = await this._getStateBatchHeader(height)

    if (header === undefined) {
      this.logger.info('No state batch header found.')
      return false
    } else {
      this.logger.info('Got state batch header', { header })
    }

    return !(await this.state.StateCommitmentChain.insideFraudProofWindow(
      header.batch
    ))
  }

  /**
   * Returns all sent message events between some start height (inclusive) and an end height
   * (exclusive).
   *
   * @param startHeight Start height to start finding messages from.
   * @param endHeight End height to finish finding messages at.
   * @returns All sent messages between start and end height, sorted by transaction index in
   * ascending order.
   */
  private async _getSentMessages(
    startHeight: number,
    endHeight: number
  ): Promise<SentMessage[]> {
    const filter = this.state.L2CrossDomainMessenger.filters.SentMessage()
    const events = await this.state.L2CrossDomainMessenger.queryFilter(
      filter,
      startHeight + this.options.l2BlockOffset,
      endHeight + this.options.l2BlockOffset - 1
    )

    const messages = events.map((event) => {
      const encodedMessage =
        this.state.L2CrossDomainMessenger.interface.encodeFunctionData(
          'relayMessage',
          [
            event.args.target,
            event.args.sender,
            event.args.message,
            event.args.messageNonce,
          ]
        )

      return {
        target: event.args.target,
        sender: event.args.sender,
        message: event.args.message,
        messageNonce: event.args.messageNonce,
        encodedMessage,
        encodedMessageHash: ethers.utils.keccak256(encodedMessage),
        parentTransactionIndex: event.blockNumber - this.options.l2BlockOffset,
        parentTransactionHash: event.transactionHash,
      }
    })

    // Sort in ascending order based on tx index and return.
    return messages.sort((a, b) => {
      return a.parentTransactionIndex - b.parentTransactionIndex
    })
  }

  private async _wasMessageRelayed(message: SentMessage): Promise<boolean> {
    return this.state.L1CrossDomainMessenger.successfulMessages(
      message.encodedMessageHash
    )
  }

  private async _wasMessageBlocked(message: SentMessage): Promise<boolean> {
    return this.state.L1CrossDomainMessenger.blockedMessages(
      message.encodedMessageHash
    )
  }

  private async _wasMessageFailed(message: SentMessage): Promise<boolean> {
    return this.state.L1CrossDomainMessenger.failedMessages(
      message.encodedMessageHash
    )
  }

  private async _wereMessagesRelayed(
    messages: Array<SentMessage>
  ): Promise<boolean> {
    const promisePayload = messages.reduce((acc, cur) => {
      acc.push(this._wasMessageRelayed(cur), this._wasMessageFailed(cur))
      return acc
    }, [])
    const messageRelayedStatus = await Promise.all(promisePayload)
    return messageRelayedStatus.some((ele) => ele)
  }

  private async _getMessageProof(
    message: SentMessage
  ): Promise<SentMessageProof> {
    const messageSlot = ethers.utils.keccak256(
      ethers.utils.keccak256(
        message.encodedMessage +
          this.state.L2CrossDomainMessenger.address.slice(2)
      ) + '00'.repeat(32)
    )

    // TODO: Complain if the proof doesn't exist.
    const proof = await this.options.l2RpcProvider.send('eth_getProof', [
      this.state.OVM_L2ToL1MessagePasser.address,
      [messageSlot],
      '0x' +
        BigNumber.from(
          message.parentTransactionIndex + this.options.l2BlockOffset
        )
          .toHexString()
          .slice(2)
          .replace(/^0+/, ''),
    ])

    // TODO: Complain if the batch doesn't exist.
    const header = await this._getStateBatchHeader(
      message.parentTransactionIndex
    )

    const elements = []
    for (
      let i = 0;
      i < Math.pow(2, Math.ceil(Math.log2(header.stateRoots.length)));
      i++
    ) {
      if (i < header.stateRoots.length) {
        elements.push(header.stateRoots[i])
      } else {
        elements.push(ethers.utils.keccak256('0x' + '00'.repeat(32)))
      }
    }

    const hash = (el: Buffer | string): Buffer => {
      return Buffer.from(ethers.utils.keccak256(el).slice(2), 'hex')
    }

    const leaves = elements.map((element) => {
      return fromHexString(element)
    })

    const tree = new MerkleTree(leaves, hash)
    const index =
      message.parentTransactionIndex - header.batch.prevTotalElements.toNumber()
    const treeProof = tree.getProof(leaves[index], index).map((element) => {
      return element.data
    })

    return {
      stateRoot: header.stateRoots[index],
      stateRootBatchHeader: header.batch,
      stateRootProof: {
        index,
        siblings: treeProof,
      },
      stateTrieWitness: rlp.encode(proof.accountProof),
      storageTrieWitness: rlp.encode(proof.storageProof[0].proof),
    }
  }

  private async _relayMultiMessageToL1(
    messages: Array<BatchMessage>
  ): Promise<any> {
    const sendTxAndWaitForReceipt = async (gasPrice): Promise<any> => {
      // Generate the transaction we will repeatedly submit
      const nonce = await this.options.l1Wallet.getTransactionCount()
      const txResponse = await this.state.L1MultiMessageRelayer.connect(
        this.options.l1Wallet
      ).batchRelayMessages(messages, { gasPrice, nonce })
      const tx = await this.options.l1Wallet.provider.waitForTransaction(
        txResponse.hash,
        this.options.numConfirmations
      )
      return tx
    }

    const minGasPrice = await this._getGasPriceInGwei(this.options.l1Wallet)

    let receipt
    try {
      receipt = await ynatm.send({
        sendTransactionFunction: sendTxAndWaitForReceipt,
        minGasPrice: ynatm.toGwei(minGasPrice),
        maxGasPrice: ynatm.toGwei(this.options.maxGasPriceInGwei),
        gasPriceScalingFunction: ynatm.LINEAR(this.options.gasRetryIncrement),
        delay: this.options.resubmissionTimeout,
      })

      this.logger.info('Relay message transaction sent', { receipt })
    } catch (err) {
      this.logger.error('Relay attempt failed, skipping.', {
        message: err.toString(),
        stack: err.stack,
        code: err.code,
      })
      return
    }

    this.logger.info('Message Batch successfully relayed to Layer 1!')
    return receipt
  }

  private async _getGasPriceInGwei(signer): Promise<number> {
    return parseInt(
      ethers.utils.formatUnits(await signer.getGasPrice(), 'gwei'),
      10
    )
  }

  private async _getFilter(): Promise<void> {
    try {
      if (this.options.filterEndpoint) {
        if (
          this.state.lastFilterPollingTimestamp === 0 ||
          new Date().getTime() >
            this.state.lastFilterPollingTimestamp +
              this.options.filterPollingInterval
        ) {
          const response = await fetch(this.options.filterEndpoint)
          const filter: any = await response.json()

          // export L1LIQPOOL=$(echo $ADDRESSES | jq -r '.L1LiquidityPool')
          // export L1M=$(echo $ADDRESSES | jq -r '.L1Message')
          // echo '["'$L1LIQPOOL'", "'$L1M'"]' > dist/dumps/whitelist.json
          const filterSelect = [filter.Proxy__L1LiquidityPool, filter.L1Message]

          this.state.lastFilterPollingTimestamp = new Date().getTime()
          this.state.filter = filterSelect
          this.logger.info('Found the filter', { filterSelect })
        }
      }
    } catch {
      this.logger.error('CRITICAL ERROR: Failed to fetch the Filter')
    }
  }
}
