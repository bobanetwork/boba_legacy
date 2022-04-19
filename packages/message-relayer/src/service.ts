/* Imports: External */
import { Wallet, utils, constants, BigNumber } from 'ethers'
import { Address, sleep } from '@eth-optimism/core-utils'
import fetch from 'node-fetch'
import { Logger, BaseService, Metrics } from '@eth-optimism/common-ts'
import * as ynatm from '@eth-optimism/ynatm'
import {
  CrossChainMessenger,
  MessageStatus,
  ProviderLike,
} from '@eth-optimism/sdk'

interface MessageRelayerOptions {
  /**
   * Provider for interacting with L2.
   */
  l2RpcProvider: ProviderLike

  /**
   * Wallet used to interact with L1.
   */
  l1Wallet: Wallet

  /**
   * Gas to relay transactions with. If not provided, will use the estimated gas for the relay
   * transaction.
   */
  relayGasLimit?: number

  //batch system
  minBatchSize: number
  maxWaitTimeS: number

  /**
   * Index of the first L2 transaction to start processing from.
   */
  fromL2TransactionIndex?: number

  /**
   * Waiting interval between loops when the service is at the tip.
   */
  pollingInterval?: number

  /**
   * L1 block to start querying State commitments from. Recommended to set to the StateCommitmentChain deploy height
   * not essential, only needed for optimization, event searches are already filtered by batchIndex
   */
  l1StartOffset?: number

  /**
   * Size of the block range to query when looking for new SentMessage events.
   */
  getLogsInterval?: number

  /**
   * Logger to transport logs. Defaults to STDOUT.
   */
  logger?: Logger

  /**
   * Metrics object to use. Defaults to no metrics.
   */
  metrics?: Metrics

  // filter
  filterEndpoint?: string

  filterPollingInterval?: number

  // gas fee
  maxGasPriceInGwei?: number

  gasRetryIncrement?: number

  numConfirmations?: number

  multiRelayLimit?: number

  resubmissionTimeout?: number

  maxWaitTxTimeS: number

  isFastRelayer: boolean
}

export class MessageRelayerService extends BaseService<MessageRelayerOptions> {
  constructor(options: MessageRelayerOptions) {
    super('Message_Relayer', options, {
      relayGasLimit: {
        default: 4_000_000,
      },
      minBatchSize: {
        default: 2,
      },
      maxWaitTimeS: {
        default: 60,
      },
      fromL2TransactionIndex: {
        default: 0,
      },
      pollingInterval: {
        default: 5000,
      },
      l1StartOffset: {
        default: 0,
      },
      getLogsInterval: {
        default: 2000,
      },
      filterPollingInterval: {
        default: 60000,
      },
      maxWaitTxTimeS: {
        default: 180,
      },
    })
  }

  private state: {
    messenger: CrossChainMessenger
    highestCheckedL2Tx: number
    //filter
    filter: Array<any>
    lastFilterPollingTimestamp: number
    //batch system
    timeOfLastRelayS: number
    messageBuffer: Array<any>
    timeOfLastPendingRelay: any
    didWork: boolean
  } = {} as any

  protected async _init(): Promise<void> {
    this.logger.info('Initializing message relayer', {
      relayGasLimit: this.options.relayGasLimit,
      fromL2TransactionIndex: this.options.fromL2TransactionIndex,
      pollingInterval: this.options.pollingInterval,
      filterPollingInterval: this.options.filterPollingInterval,
      getLogsInterval: this.options.getLogsInterval,
      minBatchSize: this.options.minBatchSize,
      maxWaitTimeS: this.options.maxWaitTimeS,
      isFastRelayer: this.options.isFastRelayer,
    })

    const l1Network = await this.options.l1Wallet.provider.getNetwork()
    const l1ChainId = l1Network.chainId
    this.state.messenger = new CrossChainMessenger({
      l1SignerOrProvider: this.options.l1Wallet,
      l2SignerOrProvider: this.options.l2RpcProvider,
      l1ChainId,
      fastRelayer: this.options.isFastRelayer,
    })

    this.state.highestCheckedL2Tx = this.options.fromL2TransactionIndex || 1

    // filter
    this.state.filter = []
    this.state.lastFilterPollingTimestamp = 0

    //batch system
    this.state.timeOfLastRelayS = Date.now()
    this.state.messageBuffer = []
    this.state.timeOfLastPendingRelay = false
  }

  protected async _start(): Promise<void> {
    while (this.running) {
      if (!this.state.didWork) {
        await sleep(this.options.pollingInterval)
      }

      this.state.didWork = false

      await this._getFilter()

      try {
        // Check that the correct address is set in the address manager,
        // this is a requirement for batch-relayer
        let relayer: Address
        if (this.options.isFastRelayer) {
          relayer =
            await this.state.messenger.contracts.l1.AddressManager.getAddress(
              'L2BatchFastMessageRelayer'
            )
        } else {
          relayer =
            await this.state.messenger.contracts.l1.AddressManager.getAddress(
              'L2BatchMessageRelayer'
            )
        }
        // If it is address(0), then message relaying is not authenticated
        if (relayer !== constants.AddressZero) {
          const address = await this.options.l1Wallet.getAddress()
          if (relayer !== address) {
            throw new Error(
              `OVM_L2MessageRelayer (${relayer}) is not set to message-passer EOA ${address}`
            )
          }
        }

        // Batch flushing logic
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

        const bufferFull =
          this.state.messageBuffer.length >= this.options.minBatchSize
            ? true
            : false

        // check gas price
        const gasPrice = await this.options.l1Wallet.getGasPrice()
        const gasPriceGwei = Number(utils.formatUnits(gasPrice, 'gwei'))
        const gasPriceAcceptable =
          gasPriceGwei < this.options.maxGasPriceInGwei ? true : false

        if (
          this.state.messageBuffer.length !== 0 &&
          (bufferFull || timeOut) &&
          pendingTXTimeOut
        ) {
          if (gasPriceAcceptable) {
            this.state.didWork = true
            if (bufferFull) {
              console.log('Buffer full: flushing')
            }
            if (timeOut) {
              console.log('Buffer timeout: flushing')
            }

            // Filter out messages which have been processed
            const newMB = []
            for (const cur of this.state.messageBuffer) {
              const status =
                await this.state.messenger.getMessageStatusFromContracts(cur, {
                  fromBlock: this.options.l1StartOffset,
                })
              if (
                // check failed message here too
                status !== MessageStatus.RELAYED &&
                status !== MessageStatus.RELAYED_FAILED
              ) {
                newMB.push(cur)
              }
            }
            this.state.messageBuffer = newMB

            if (this.state.messageBuffer.length === 0) {
              this.state.timeOfLastPendingRelay = false
            } else {
              // Limit the number of messages to be submitted per batch.
              const subBuffer = this.state.messageBuffer.slice(
                0,
                this.options.multiRelayLimit
              )
              this.logger.info('Prepared message subBuffer', {
                subLen: subBuffer.length,
                bufLen: this.state.messageBuffer.length,
                limit: this.options.multiRelayLimit,
              })

              // at this point, all relayed messages are removed, the tx should not fail

              // ynatm logic
              const sendTxAndWaitForReceipt = async (
                _gasPrice: BigNumber
              ): Promise<any> => {
                // Generate the transaction we will repeatedly submit
                const nonce = await this.options.l1Wallet.getTransactionCount()
                const txResponse =
                  await this.state.messenger.finalizeBatchMessage(subBuffer, {
                    overrides: {
                      gasPrice: _gasPrice,
                      nonce,
                    },
                  })
                const txReceipt = await txResponse.wait(
                  this.options.numConfirmations
                )
                return txReceipt
              }

              const minGasPrice = await this._getGasPriceInGwei(
                this.options.l1Wallet
              )
              let receipt
              try {
                receipt = await ynatm.send({
                  sendTransactionFunction: sendTxAndWaitForReceipt,
                  minGasPrice: ynatm.toGwei(minGasPrice),
                  maxGasPrice: ynatm.toGwei(this.options.maxGasPriceInGwei),
                  gasPriceScalingFunction: ynatm.LINEAR(
                    this.options.gasRetryIncrement
                  ),
                  delay: this.options.resubmissionTimeout,
                })

                this.logger.info('Relay message transaction sent', { receipt })
              } catch (err) {
                this.logger.error('Relay attempt failed, skipping.', {
                  message: err.toString(),
                  stack: err.stack,
                  code: err.code,
                })
              }

              // only check for this txs receipt
              if (!receipt) {
                this.logger.error(
                  'No receipt for relayMultiMessage transaction'
                )
              } else if (receipt.status === 1) {
                this.logger.info('Successful relayMultiMessage', {
                  blockNumber: receipt.blockNumber,
                  transactionIndex: receipt.transactionIndex,
                  status: receipt.status,
                  msgCount: subBuffer.length,
                  gasUsed: receipt.gasUsed.toString(),
                  effectiveGasPrice: receipt.effectiveGasPrice.toString(),
                })
              } else {
                this.logger.warning('Unsuccessful relayMultiMessage', {
                  blockNumber: receipt.blockNumber,
                  transactionIndex: receipt.transactionIndex,
                  status: receipt.status,
                  msgCount: subBuffer.length,
                  gasUsed: receipt.gasUsed.toString(),
                  effectiveGasPrice: receipt.effectiveGasPrice.toString(),
                })
              }

              // add a delay between two tx
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
          // Loop strategy is as follows:
          // 1. Get the current L2 tip
          // 2. While we're not at the tip:
          //    2.1. Get the transaction for the next L2 block to parse.
          //    2.2. Find any messages sent in the L2 block.
          //    2.3. Make sure all messages are ready to be relayed.
          //    3.4. Add message to the pending relay buffer.
          const l2BlockNumber =
            await this.state.messenger.l2Provider.getBlockNumber()

          while (this.state.highestCheckedL2Tx <= l2BlockNumber) {
            this.logger.info(
              `checking L2 block ${this.state.highestCheckedL2Tx}`
            )

            const block =
              await this.state.messenger.l2Provider.getBlockWithTransactions(
                this.state.highestCheckedL2Tx
              )

            // Should never happen.
            if (block.transactions.length !== 1) {
              throw new Error(
                `got an unexpected number of transactions in block: ${block.number}`
              )
            }

            const messages =
              await this.state.messenger.getMessagesByTransaction(
                block.transactions[0].hash
              )

            // No messages in this transaction so we can move on to the next one.
            if (messages.length === 0) {
              this.state.highestCheckedL2Tx++
              continue
            }

            // this.state.didWork = true
            // Make sure that all messages sent within the transaction are finalized. If any messages
            // are not finalized, then we're going to break the loop which will trigger the sleep and
            // wait for a few seconds before we check again to see if this transaction is finalized.
            let isFinalized = true
            for (const message of messages) {
              const status =
                await this.state.messenger.getMessageStatusFromContracts(
                  message,
                  {
                    fromBlock: this.options.l1StartOffset,
                  }
                )
              if (
                status === MessageStatus.IN_CHALLENGE_PERIOD ||
                status === MessageStatus.STATE_ROOT_NOT_PUBLISHED
              ) {
                isFinalized = false
              }
            }

            if (!isFinalized) {
              this.logger.info(
                `tx not yet finalized, waiting: ${this.state.highestCheckedL2Tx}`
              )
              break
            } else {
              this.logger.info(
                `tx is finalized, attempting to add to pending buffer: ${this.state.highestCheckedL2Tx}`
              )
            }

            // we skip messages which are targeted to CanonicalTransactionChain
            // since they are not allowed and to avoid top level relay fails
            const canonicalTransactionChain =
              this.state.messenger.contracts.l1.CanonicalTransactionChain
                .address

            // If we got here then all messages in the transaction are finalized. Now we can relay
            // each message to L1.
            for (const message of messages) {
              // filter out messages not meant for this relayer
              if (this.options.isFastRelayer) {
                if (!this.state.filter.includes(message.target)) {
                  this.logger.info('Message not intended for target, skipping.')
                  continue
                }
              } else {
                if (this.state.filter.includes(message.target)) {
                  this.logger.info('Message not intended for target, skipping.')
                  continue
                }
              }

              const status =
                await this.state.messenger.getMessageStatusFromContracts(
                  message,
                  {
                    fromBlock: this.options.l1StartOffset,
                  }
                )
              if (status === MessageStatus.RELAYED) {
                this.logger.info('Message has already been relayed, skipping.')
                continue
              }

              if (status === MessageStatus.RELAYED_FAILED) {
                this.logger.info('Last message was failed, skipping.')
                continue
              }

              if (message.target === canonicalTransactionChain) {
                this.logger.info('Message target is CTC, skipping.')
                continue
              }

              this.state.messageBuffer.push(message)
              this.logger.info('added message to pending buffer')
            }

            // All messages have been added to the buffer so we can move on to the next block.
            this.state.highestCheckedL2Tx++
          }
        } else {
          this.logger.info('Waiting for the current pending tx to be finalized')
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

  private async _getGasPriceInGwei(signer): Promise<number> {
    return parseInt(utils.formatUnits(await signer.getGasPrice(), 'gwei'), 10)
  }
}
