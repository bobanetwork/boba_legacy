/* Imports: External */
import { BaseService, Metrics } from '@eth-optimism/common-ts'
import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { BigNumber } from 'ethers'
import { LevelUp } from 'levelup'
import axios from 'axios'
import bfj from 'bfj'
import { Gauge } from 'prom-client'

/* Imports: Internal */
import { handleSequencerBlock } from './handlers/transaction'
import { TransportDB } from '../../db/transport-db'
import { sleep, toRpcHexString, validators } from '../../utils'
import { L1DataTransportServiceOptions } from '../main/service'

interface L2IngestionMetrics {
  highestSyncedL2Block: Gauge<string>
}

const registerMetrics = ({
  client,
  registry,
}: Metrics): L2IngestionMetrics => ({
  highestSyncedL2Block: new client.Gauge({
    name: 'data_transport_layer_highest_synced_l2_block',
    help: 'Highest Synced L2 Block Number',
    registers: [registry],
  }),
})

export interface L2IngestionServiceOptions
  extends L1DataTransportServiceOptions {
  db: LevelUp
}

const optionSettings = {
  db: {
    validate: validators.isLevelUP,
  },
  l2RpcProvider: {
    validate: (val: any) => {
      return validators.isUrl(val) || validators.isJsonRpcProvider(val)
    },
  },
  l2ChainId: {
    validate: validators.isInteger,
  },
  pollingInterval: {
    default: 5000,
    validate: validators.isInteger,
  },
  transactionsPerPollingInterval: {
    default: 1000,
    validate: validators.isInteger,
  },
  dangerouslyCatchAllErrors: {
    default: false,
    validate: validators.isBoolean,
  },
  legacySequencerCompatibility: {
    default: false,
    validate: validators.isBoolean,
  },
}

export class L2IngestionService extends BaseService<L2IngestionServiceOptions> {
  constructor(options: L2IngestionServiceOptions) {
    super('L2_Ingestion_Service', options, optionSettings)
  }

  private l2IngestionMetrics: L2IngestionMetrics

  private state: {
    db: TransportDB
    l2RpcProvider: StaticJsonRpcProvider
  } = {} as any

  protected async _init(): Promise<void> {
    if (this.options.legacySequencerCompatibility) {
      this.logger.info(
        'Using legacy sync, this will be quite a bit slower than normal'
      )
    }

    this.l2IngestionMetrics = registerMetrics(this.metrics)

    this.state.db = new TransportDB(this.options.db, {
      bssHardfork1Index: this.options.bssHardfork1Index,
    })

    this.state.l2RpcProvider =
      typeof this.options.l2RpcProvider === 'string'
        ? new StaticJsonRpcProvider({
            url: this.options.l2RpcProvider,
            headers: { 'User-Agent': 'data-transport-layer' },
          })
        : this.options.l2RpcProvider
  }

  protected async _start(): Promise<void> {
    while (this.running) {
      try {
        const highestSyncedL2BlockNumber =
          (await this.state.db.getHighestSyncedUnconfirmedBlock()) || 1

        const currentL2Block = await this.state.l2RpcProvider.getBlockNumber()

        // Make sure we don't exceed the tip.
        const targetL2Block = Math.min(
          highestSyncedL2BlockNumber +
            this.options.transactionsPerPollingInterval,
          currentL2Block
        )

        // We're already at the head, so no point in attempting to sync.
        // Also wait on edge case of no L2 transactions
        if (
          highestSyncedL2BlockNumber === targetL2Block ||
          currentL2Block === 0
        ) {
          await sleep(this.options.pollingInterval)
          continue
        }

        this.logger.info(
          'Synchronizing unconfirmed transactions from Layer 2 (Optimism)',
          {
            fromBlock: highestSyncedL2BlockNumber,
            toBlock: targetL2Block,
          }
        )

        // Synchronize by requesting blocks from the sequencer. Sync from L1 takes precedence.
        await this._syncSequencerBlocks(
          highestSyncedL2BlockNumber,
          targetL2Block
        )

        await this.state.db.setHighestSyncedUnconfirmedBlock(targetL2Block)
        await this.state.db.setTargetL2Block(currentL2Block)

        this.l2IngestionMetrics.highestSyncedL2Block.set(targetL2Block)

        if (
          currentL2Block - highestSyncedL2BlockNumber <
          this.options.transactionsPerPollingInterval
        ) {
          await sleep(this.options.pollingInterval)
        }
      } catch (err) {
        if (!this.running || this.options.dangerouslyCatchAllErrors) {
          this.logger.error('Caught an unhandled error', {
            message: err.toString(),
            stack: err.stack,
            code: err.code,
          })
          await sleep(this.options.pollingInterval)
        } else {
          throw err
        }
      }
    }
  }

  /**
   * Synchronizes unconfirmed transactions from a range of sequencer blocks.
   *
   * @param startBlockNumber Block to start querying from.
   * @param endBlockNumber Block to query to.
   */
  private async _syncSequencerBlocks(
    startBlockNumber: number,
    endBlockNumber: number
  ): Promise<void> {
    if (startBlockNumber > endBlockNumber) {
      this.logger.warn(
        'Cannot query with start block number larger than end block number',
        {
          startBlockNumber,
          endBlockNumber,
        }
      )
      return
    }

    let blocks: any = []
    if (this.options.legacySequencerCompatibility) {
      const blockPromises = []
      for (let i = startBlockNumber; i <= endBlockNumber; i++) {
        blockPromises.push(
          this.state.l2RpcProvider.send('eth_getBlockByNumber', [
            toRpcHexString(i),
            true,
          ])
        )
      }

      // Just making sure that the blocks will come back in increasing order.
      blocks = (await Promise.all(blockPromises)).sort((a, b) => {
        return (
          BigNumber.from(a.number).toNumber() -
          BigNumber.from(b.number).toNumber()
        )
      })
    } else {
      // This request returns a large response.  Parsing it into JSON inside the ethers library is
      // quite slow, and can block the event loop for upwards of multiple seconds.  When this happens,
      // incoming http requests will likely timeout and fail.
      // Instead, we will parse the incoming http stream directly with the bfj package, which yields
      // the event loop periodically so that we don't fail to serve requests.
      const req = {
        jsonrpc: '2.0',
        method: 'eth_getBlockRange',
        params: [
          toRpcHexString(startBlockNumber),
          toRpcHexString(endBlockNumber),
          true,
        ],
        id: '1',
      }

      const resp = await axios.post(
        this.state.l2RpcProvider.connection.url,
        req,
        { responseType: 'stream' }
      )
      const respJson = await bfj.parse(resp.data, {
        yieldRate: 4096, // this yields abit more often than the default of 16384
      })
      blocks = respJson.result
    }

    for (const block of blocks) {
      const entry = await handleSequencerBlock.parseBlock(
        block,
        this.options.l2ChainId
      )
      await handleSequencerBlock.storeBlock(entry, this.state.db)
    }
  }
}
