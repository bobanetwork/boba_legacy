/* External Imports */
import { performance } from 'perf_hooks'

import { Promise as bPromise } from 'bluebird'
import { Signer, ethers, Contract, providers, BigNumber } from 'ethers'
import { TransactionReceipt } from '@ethersproject/abstract-provider'
import { getContractInterface, getContractFactory } from 'old-contracts'
import { getContractInterface as getNewContractInterface } from '@eth-optimism/contracts'
import {
  L2Block,
  RollupInfo,
  BatchElement,
  Batch,
  QueueOrigin,
  remove0x,
} from '@eth-optimism/core-utils'
import { Logger, Metrics } from '@eth-optimism/common-ts'

/* Internal Imports */
import {
  CanonicalTransactionChainContract,
  encodeAppendSequencerBatch,
  BatchContext,
  AppendSequencerBatchParams,
} from '../transaction-chain-contract'
import { TransactionSubmitter } from '../utils'
import { BlockRange, BatchSubmitter } from '.'

export interface AutoFixBatchOptions {
  fixDoublePlayedDeposits: boolean
  fixMonotonicity: boolean
  fixSkippedDeposits: boolean
}

export class TransactionBatchSubmitter extends BatchSubmitter {
  protected chainContract: CanonicalTransactionChainContract
  protected l2ChainId: number
  protected syncing: boolean
  private autoFixBatchOptions: AutoFixBatchOptions
  private validateBatch: boolean
  private transactionSubmitter: TransactionSubmitter
  private gasThresholdInGwei: number

  constructor(
    signer: Signer,
    l2Provider: providers.StaticJsonRpcProvider,
    minTxSize: number,
    maxTxSize: number,
    maxBatchSize: number,
    maxBatchSubmissionTime: number,
    numConfirmations: number,
    resubmissionTimeout: number,
    addressManagerAddress: string,
    minBalanceEther: number,
    gasThresholdInGwei: number,
    transactionSubmitter: TransactionSubmitter,
    blockOffset: number,
    validateBatch: boolean,
    logger: Logger,
    metrics: Metrics,
    autoFixBatchOptions: AutoFixBatchOptions = {
      fixDoublePlayedDeposits: false,
      fixMonotonicity: false,
      fixSkippedDeposits: false,
    } // TODO: Remove this
  ) {
    super(
      signer,
      l2Provider,
      minTxSize,
      maxTxSize,
      maxBatchSize,
      maxBatchSubmissionTime,
      numConfirmations,
      resubmissionTimeout,
      0, // Supply dummy value because it is not used.
      addressManagerAddress,
      minBalanceEther,
      blockOffset,
      logger,
      metrics
    )
    this.validateBatch = validateBatch
    this.autoFixBatchOptions = autoFixBatchOptions
    this.gasThresholdInGwei = gasThresholdInGwei
    this.transactionSubmitter = transactionSubmitter

    this.logger.info('Batch validation options', {
      autoFixBatchOptions,
      validateBatch,
    })
  }

  /*****************************
   * Batch Submitter Overrides *
   ****************************/

  public async _updateChainInfo(): Promise<void> {
    const info: RollupInfo = await this._getRollupInfo()
    if (info.mode === 'verifier') {
      this.logger.error(
        'Verifier mode enabled! Batch submitter only compatible with sequencer mode'
      )
      process.exit(1)
    }
    this.syncing = info.syncing
    const addrs = await this._getChainAddresses()
    const ctcAddress = addrs.ctcAddress

    if (
      typeof this.chainContract !== 'undefined' &&
      ctcAddress === this.chainContract.address
    ) {
      this.logger.debug('Chain contract already initialized', {
        ctcAddress,
      })
      return
    }

    const unwrapped_OVM_CanonicalTransactionChain = (
      await getContractFactory('OVM_CanonicalTransactionChain', this.signer)
    ).attach(ctcAddress)

    this.chainContract = new CanonicalTransactionChainContract(
      unwrapped_OVM_CanonicalTransactionChain.address,
      getContractInterface('OVM_CanonicalTransactionChain'),
      this.signer
    )
    this.logger.info('Initialized new CTC', {
      address: this.chainContract.address,
    })
    return
  }

  public async _onSync(): Promise<TransactionReceipt> {
    const pendingQueueElements =
      await this.chainContract.getNumPendingQueueElements()
    this.logger.debug('Got number of pending queue elements', {
      pendingQueueElements,
    })

    if (pendingQueueElements !== 0) {
      this.logger.info(
        'Syncing mode enabled! Skipping batch submission and clearing queue elements',
        { pendingQueueElements }
      )
    }

    this.logger.info('Syncing mode enabled but queue is empty. Skipping...')
    return
  }

  public async _getBatchStartAndEnd(): Promise<BlockRange> {
    this.logger.info(
      'Getting batch start and end for transaction batch submitter...'
    )
    const startBlock =
      (await this.chainContract.getTotalElements()).toNumber() +
      this.blockOffset
    this.logger.info('Retrieved start block number from CTC', {
      startBlock,
    })

    const endBlock =
      Math.min(
        startBlock + this.maxBatchSize,
        await this.l2Provider.getBlockNumber()
      ) + 1 // +1 because the `endBlock` is *exclusive*
    this.logger.info('Retrieved end block number from L2 sequencer', {
      endBlock,
    })

    if (startBlock >= endBlock) {
      if (startBlock > endBlock) {
        this.logger
          .error(`More chain elements in L1 (${startBlock}) than in the L2 node (${endBlock}).
                   This shouldn't happen because we don't submit batches if the sequencer is syncing.`)
      }
      this.logger.info('No txs to submit. Skipping batch submission...')
      return
    }
    return {
      start: startBlock,
      end: endBlock,
    }
  }

  public async _submitBatch(
    startBlock: number,
    endBlock: number
  ): Promise<TransactionReceipt> {
    // Do not submit batch if gas price above threshold
    const gasPriceInGwei = parseInt(
      ethers.utils.formatUnits(await this.signer.getGasPrice(), 'gwei'),
      10
    )
    if (gasPriceInGwei > this.gasThresholdInGwei) {
      this.logger.warn(
        'Gas price is higher than gas price threshold; aborting batch submission',
        {
          gasPriceInGwei,
          gasThresholdInGwei: this.gasThresholdInGwei,
        }
      )
      return
    }

    const batchTxBuildStart = performance.now()

    const params = await this._generateSequencerBatchParams(
      startBlock,
      endBlock
    )
    if (!params) {
      throw new Error(
        `Cannot create sequencer batch with params start ${startBlock} and end ${endBlock}`
      )
    }

    const [batchParams, wasBatchTruncated] = params
    const batchSizeInBytes = encodeAppendSequencerBatch(batchParams).length / 2
    this.logger.debug('Sequencer batch generated', {
      batchSizeInBytes,
    })

    // Only submit batch if one of the following is true:
    // 1. it was truncated
    // 2. it is large enough
    // 3. enough time has passed since last submission
    if (!wasBatchTruncated && !this._shouldSubmitBatch(batchSizeInBytes)) {
      return
    }

    const batchTxBuildEnd = performance.now()
    this.metrics.batchTxBuildTime.set(batchTxBuildEnd - batchTxBuildStart)

    this.metrics.numTxPerBatch.observe(batchParams.totalElementsToAppend)
    const l1tipHeight = await this.signer.provider.getBlockNumber()
    this.logger.debug('Submitting batch.', {
      calldata: batchParams,
      l1tipHeight,
    })

    return this.submitAppendSequencerBatch(batchParams)
  }

  /*********************
   * Private Functions *
   ********************/

  private async submitAppendSequencerBatch(
    batchParams: AppendSequencerBatchParams
  ): Promise<TransactionReceipt> {
    const tx =
      await this.chainContract.customPopulateTransaction.appendSequencerBatch(
        batchParams
      )
    const submitTransaction = (): Promise<TransactionReceipt> => {
      return this.transactionSubmitter.submitTransaction(
        tx,
        this._makeHooks('appendSequencerBatch')
      )
    }
    return this._submitAndLogTx(submitTransaction, 'Submitted batch!')
  }

  private async _generateSequencerBatchParams(
    startBlock: number,
    endBlock: number
  ): Promise<[AppendSequencerBatchParams, boolean]> {
    // Get all L2 BatchElements for the given range
    const blockRange = endBlock - startBlock
    let batch: Batch = await bPromise.map(
      [...Array(blockRange).keys()],
      (i) => {
        this.logger.debug('Fetching L2BatchElement', {
          blockNo: startBlock + i,
        })
        return this._getL2BatchElement(startBlock + i)
      },
      { concurrency: 100 }
    )

    // Fix our batches if we are configured to. This will not
    // modify the batch unless an autoFixBatchOption is set
    batch = await this._fixBatch(batch)
    if (this.validateBatch) {
      this.logger.info('Validating batch')
      if (!(await this._validateBatch(batch))) {
        this.metrics.malformedBatches.inc()
        return
      }
    }

    let sequencerBatchParams = await this._getSequencerBatchParams(
      startBlock,
      batch
    )
    let wasBatchTruncated = false
    let encoded = encodeAppendSequencerBatch(sequencerBatchParams)
    while (encoded.length / 2 > this.maxTxSize) {
      this.logger.debug('Splicing batch...', {
        batchSizeInBytes: encoded.length / 2,
      })
      batch.splice(Math.ceil((batch.length * 2) / 3)) // Delete 1/3rd of all of the batch elements
      sequencerBatchParams = await this._getSequencerBatchParams(
        startBlock,
        batch
      )
      encoded = encodeAppendSequencerBatch(sequencerBatchParams)
      //  This is to prevent against the case where a batch is oversized,
      //  but then gets truncated to the point where it is under the minimum size.
      //  In this case, we want to submit regardless of the batch's size.
      wasBatchTruncated = true
    }

    this.logger.info('Generated sequencer batch params', {
      contexts: sequencerBatchParams.contexts,
      transactions: sequencerBatchParams.transactions,
      wasBatchTruncated,
    })
    return [sequencerBatchParams, wasBatchTruncated]
  }

  /**
   * Returns true if the batch is valid.
   */
  protected async _validateBatch(batch: Batch): Promise<boolean> {
    // Verify all of the queue elements are what we expect
    let nextQueueIndex = await this.chainContract.getNextQueueIndex()
    for (const ele of batch) {
      this.logger.debug('Verifying batch element', { ele })
      if (!ele.isSequencerTx) {
        this.logger.debug('Checking queue equality against L1 queue index', {
          nextQueueIndex,
        })
        if (!(await this._doesQueueElementMatchL1(nextQueueIndex, ele))) {
          return false
        }
        nextQueueIndex++
      }
    }

    // Verify all of the batch elements are monotonic
    let lastTimestamp: number
    let lastBlockNumber: number
    for (const [idx, ele] of batch.entries()) {
      if (ele.timestamp < lastTimestamp) {
        this.logger.error('Timestamp monotonicity violated! Element', {
          idx,
          ele,
        })
        return false
      }
      if (ele.blockNumber < lastBlockNumber) {
        this.logger.error('Block Number monotonicity violated! Element', {
          idx,
          ele,
        })
        return false
      }
      lastTimestamp = ele.timestamp
      lastBlockNumber = ele.blockNumber
    }
    return true
  }

  private async _doesQueueElementMatchL1(
    queueIndex: number,
    queueElement: BatchElement
  ): Promise<boolean> {
    const logEqualityError = (name, index, expected, got) => {
      this.logger.error('Observed mismatched values', {
        index,
        expected,
        got,
      })
    }

    let isEqual = true
    const [, timestamp, blockNumber] = await this.chainContract.getQueueElement(
      queueIndex
    )

    // TODO: Verify queue element hash equality. The queue element hash can be computed with:
    // keccak256( abi.encode( msg.sender, _target, _gasLimit, _data))

    // Check timestamp & blockNumber equality
    if (timestamp !== queueElement.timestamp) {
      isEqual = false
      logEqualityError(
        'Timestamp',
        queueIndex,
        timestamp,
        queueElement.timestamp
      )
    }
    if (blockNumber !== queueElement.blockNumber) {
      isEqual = false
      logEqualityError(
        'Block Number',
        queueIndex,
        blockNumber,
        queueElement.blockNumber
      )
    }
    return isEqual
  }

  /**
   * Takes in a batch which is potentially malformed & returns corrected version.
   * Current fixes that are supported:
   * - Double played deposits.
   */
  private async _fixBatch(batch: Batch): Promise<Batch> {
    const fixDoublePlayedDeposits = async (b: Batch): Promise<Batch> => {
      let nextQueueIndex = await this.chainContract.getNextQueueIndex()
      const fixedBatch: Batch = []
      for (const ele of b) {
        if (!ele.isSequencerTx) {
          if (!(await this._doesQueueElementMatchL1(nextQueueIndex, ele))) {
            this.logger.warn('Fixing double played queue element.', {
              nextQueueIndex,
            })
            fixedBatch.push(
              await this._fixDoublePlayedDepositQueueElement(
                nextQueueIndex,
                ele
              )
            )
            continue
          }
          nextQueueIndex++
        }
        fixedBatch.push(ele)
      }
      return fixedBatch
    }

    const fixSkippedDeposits = async (b: Batch): Promise<Batch> => {
      this.logger.debug('Fixing skipped deposits...')
      let nextQueueIndex = await this.chainContract.getNextQueueIndex()
      const fixedBatch: Batch = []
      for (const ele of b) {
        // Look for skipped deposits
        while (true) {
          const pendingQueueElements =
            await this.chainContract.getNumPendingQueueElements()
          const nextRemoteQueueElements =
            await this.chainContract.getNextQueueIndex()
          const totalQueueElements =
            pendingQueueElements + nextRemoteQueueElements
          // No more queue elements so we clearly haven't skipped anything
          if (nextQueueIndex >= totalQueueElements) {
            break
          }
          const [, timestamp, blockNumber] =
            await this.chainContract.getQueueElement(nextQueueIndex)

          if (timestamp < ele.timestamp || blockNumber < ele.blockNumber) {
            this.logger.warn('Fixing skipped deposit', {
              badTimestamp: ele.timestamp,
              skippedQueueTimestamp: timestamp,
              badBlockNumber: ele.blockNumber,
              skippedQueueBlockNumber: blockNumber,
            })
            // Push a dummy queue element
            fixedBatch.push({
              stateRoot: ele.stateRoot,
              isSequencerTx: false,
              rawTransaction: undefined,
              timestamp,
              blockNumber,
            })
            nextQueueIndex++
          } else {
            // The next queue element's timestamp is after this batch element so
            // we must not have skipped anything.
            break
          }
        }
        fixedBatch.push(ele)
        if (!ele.isSequencerTx) {
          nextQueueIndex++
        }
      }
      return fixedBatch
    }

    // TODO: Remove this super complex logic and rely on Geth to actually supply correct block data.
    const fixMonotonicity = async (b: Batch): Promise<Batch> => {
      this.logger.debug('Fixing monotonicity...')
      // The earliest allowed timestamp/blockNumber is the last timestamp submitted on chain.
      const { lastTimestamp, lastBlockNumber } =
        await this._getLastTimestampAndBlockNumber()
      let earliestTimestamp = lastTimestamp
      let earliestBlockNumber = lastBlockNumber
      this.logger.debug('Determined earliest timestamp and blockNumber', {
        earliestTimestamp,
        earliestBlockNumber,
      })

      // Now go through our batch and fix the timestamps and block numbers
      // to automatically enforce monotonicity.
      const fixedBatch: Batch = []
      for (const ele of b) {
        // Fix the element if its timestammp/blockNumber is too small
        if (
          ele.timestamp < earliestTimestamp ||
          ele.blockNumber < earliestBlockNumber
        ) {
          this.logger.info('Fixing timestamp/blockNumber too small', {
            oldTimestamp: ele.timestamp,
            newTimestamp: earliestTimestamp,
            oldBlockNumber: ele.blockNumber,
            newBlockNumber: earliestBlockNumber,
          })
          ele.timestamp = earliestTimestamp
          ele.blockNumber = earliestBlockNumber
        }
        earliestTimestamp = ele.timestamp
        earliestBlockNumber = ele.blockNumber
        fixedBatch.push(ele)
      }
      return fixedBatch
    }

    // NOTE: It is unsafe to combine multiple autoFix options.
    // If you must combine them, manually verify the output before proceeding.
    if (this.autoFixBatchOptions.fixDoublePlayedDeposits) {
      this.logger.info('Fixing double played deposits')
      batch = await fixDoublePlayedDeposits(batch)
    }
    if (this.autoFixBatchOptions.fixMonotonicity) {
      this.logger.info('Fixing monotonicity')
      batch = await fixMonotonicity(batch)
    }
    if (this.autoFixBatchOptions.fixSkippedDeposits) {
      this.logger.info('Fixing skipped deposits')
      batch = await fixSkippedDeposits(batch)
    }
    return batch
  }

  private async _getLastTimestampAndBlockNumber(): Promise<{
    lastTimestamp: number
    lastBlockNumber: number
  }> {
    const manager = new Contract(
      this.addressManagerAddress,
      getNewContractInterface('Lib_AddressManager'),
      this.signer.provider
    )

    const addr = await manager.getAddress('ChainStorageContainer-CTC-batches')

    const container = new Contract(
      addr,
      getNewContractInterface('IChainStorageContainer'),
      this.signer.provider
    )

    let meta = await container.getGlobalMetadata()
    // remove 0x
    meta = meta.slice(2)
    // convert to bytes27
    meta = meta.slice(10)

    const lastTimestamp = parseInt(meta.slice(-30, -20), 16)
    const lastBlockNumber = parseInt(meta.slice(-40, -30), 16)
    this.logger.debug('Retrieved timestamp and block number from CTC', {
      lastTimestamp,
      lastBlockNumber,
    })

    return { lastTimestamp, lastBlockNumber }
  }

  private async _fixDoublePlayedDepositQueueElement(
    queueIndex: number,
    queueElement: BatchElement
  ): Promise<BatchElement> {
    const [, timestamp, blockNumber] = await this.chainContract.getQueueElement(
      queueIndex
    )

    if (
      timestamp > queueElement.timestamp &&
      blockNumber > queueElement.blockNumber
    ) {
      this.logger.warn(
        'Double deposit detected. Fixing by skipping the deposit & replacing with a dummy tx.',
        {
          timestamp,
          blockNumber,
          queueElementTimestamp: queueElement.timestamp,
          queueElementBlockNumber: queueElement.blockNumber,
        }
      )
      const dummyTx: string = '0x1234'
      return {
        stateRoot: queueElement.stateRoot,
        isSequencerTx: true,
        rawTransaction: dummyTx,
        timestamp: queueElement.timestamp,
        blockNumber: queueElement.blockNumber,
      }
    }
    if (
      timestamp < queueElement.timestamp &&
      blockNumber < queueElement.blockNumber
    ) {
      this.logger.error('A deposit seems to have been skipped!')
      throw new Error('Skipped deposit?!')
    }
    throw new Error('Unable to fix queue element!')
  }

  private async _getSequencerBatchParams(
    shouldStartAtIndex: number,
    blocks: Batch
  ): Promise<AppendSequencerBatchParams> {
    const totalElementsToAppend = blocks.length

    // Generate contexts
    const contexts: BatchContext[] = []
    let lastBlockIsSequencerTx = false
    let lastTimestamp = 0
    let lastBlockNumber = 0
    const groupedBlocks: Array<{
      sequenced: BatchElement[]
      queued: BatchElement[]
    }> = []
    for (const block of blocks) {
      // Create a new context in certain situations
      if (
        // If there are no contexts yet, create a new context.
        groupedBlocks.length === 0 ||
        // If the last block was an L1 to L2 transaction, but the next block is a Sequencer
        // transaction, create a new context.
        (lastBlockIsSequencerTx === false && block.isSequencerTx === true) ||
        // If the timestamp of the last block differs from the timestamp of the current block,
        // create a new context. Applies to both L1 to L2 transactions and Sequencer transactions.
        block.timestamp !== lastTimestamp ||
        // If the block number of the last block differs from the block number of the current block,
        // create a new context. ONLY applies to Sequencer transactions.
        (block.blockNumber !== lastBlockNumber && block.isSequencerTx === true)
      ) {
        groupedBlocks.push({
          sequenced: [],
          queued: [],
        })
      }

      const cur = groupedBlocks.length - 1
      block.isSequencerTx
        ? groupedBlocks[cur].sequenced.push(block)
        : groupedBlocks[cur].queued.push(block)
      lastBlockIsSequencerTx = block.isSequencerTx
      lastTimestamp = block.timestamp
      lastBlockNumber = block.blockNumber
    }
    for (const groupedBlock of groupedBlocks) {
      if (
        groupedBlock.sequenced.length === 0 &&
        groupedBlock.queued.length === 0
      ) {
        throw new Error(
          'Attempted to generate batch context with 0 queued and 0 sequenced txs!'
        )
      }
      contexts.push({
        numSequencedTransactions: groupedBlock.sequenced.length,
        numSubsequentQueueTransactions: groupedBlock.queued.length,
        timestamp:
          groupedBlock.sequenced.length > 0
            ? groupedBlock.sequenced[0].timestamp
            : groupedBlock.queued[0].timestamp,
        blockNumber:
          groupedBlock.sequenced.length > 0
            ? groupedBlock.sequenced[0].blockNumber
            : groupedBlock.queued[0].blockNumber,
      })
    }

    // Generate sequencer transactions
    const transactions: string[] = []
    for (const block of blocks) {
      if (!block.isSequencerTx) {
        continue
      }
      transactions.push(block.rawTransaction)
    }

    return {
      shouldStartAtElement: shouldStartAtIndex - this.blockOffset,
      totalElementsToAppend,
      contexts,
      transactions,
    }
  }

  private async _getL2BatchElement(blockNumber: number): Promise<BatchElement> {
    const block = await this._getBlock(blockNumber)
    this.logger.debug('Fetched L2 block', {
      block,
    })

    const batchElement = {
      stateRoot: block.stateRoot,
      timestamp: block.timestamp,
      blockNumber: block.transactions[0].l1BlockNumber,
      isSequencerTx: false,
      rawTransaction: undefined,
    }

    if (this._isSequencerTx(block)) {
      batchElement.isSequencerTx = true
      const turing = block.transactions[0].l1Turing
      let rawTransaction = block.transactions[0].rawTransaction
      //will be undefined for legacy Geth
      if (typeof turing !== 'undefined') {
        const turingVersion = '01'
        this.logger.info('TURING: Turing candidate:', { turing })
        if (turing.length > 4) {
          this.logger.info('TURING: Turing string:', { turing })
          // We sometimes use a 1 byte Turing string for debug purposes
          // This is a hex string so will have length 4 ('0x00') - 'real' Turing strings will be > 4
          // Chop those off at this stage
          // Only propagate the data through the system if it's a 'real' Turing payload
          // Turing length cannot exceed 322 characters (based on limit in the Geth), so we need two bytes max for the length
          const headerTuringLengthField = remove0x(
            BigNumber.from(remove0x(turing).length / 2).toHexString()
          ).padStart(4, '0')
          if (headerTuringLengthField.length > 4) {
            // paranoia check
            this.logger.info('Turing length error:', {
              turing,
              turingLength: remove0x(turing).length / 2,
              turingHexString: BigNumber.from(remove0x(turing).length / 2).toHexString(),
              turingHeaderLengthField: headerTuringLengthField,
              turingHeaderLength: headerTuringLengthField.length,
            })
            throw new Error('Turing length error!')
          }
          rawTransaction =
            '0x' +
            turingVersion +
            headerTuringLengthField +
            remove0x(rawTransaction) +
            remove0x(turing)
        } else {
          this.logger.info('TURING: Normal tx:', { turing })
          // this was a normal transaction without a Turing call
          rawTransaction =
            '0x' + turingVersion + '0000' + remove0x(rawTransaction)
        }
      } else {
        // typeof(turing) === "undefined"
        this.logger.info('TURING: Legacy Transaction:', { turing })
      }
      // this also handles the legacy case (old transactions without a Turing header)
      batchElement.rawTransaction = rawTransaction
    }

    return batchElement
  }

  private async _getBlock(blockNumber: number): Promise<L2Block> {
    const p = this.l2Provider.getBlockWithTransactions(blockNumber)
    return p as Promise<L2Block>
  }

  private _isSequencerTx(block: L2Block): boolean {
    return block.transactions[0].queueOrigin === QueueOrigin.Sequencer
  }
}
