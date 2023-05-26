import {
  AccountDeployedEvent,
  UserOperationEventEvent,
  SignatureAggregatorChangedEvent,
} from '@boba/accountabstraction/dist/types/EntryPoint'
import { ReputationManager } from './ReputationManager'
import { EntryPoint } from '@boba/accountabstraction'
import Debug from 'debug'
import { TypedEvent } from '@boba/accountabstraction/dist/types/common'
import { JsonRpcProvider } from '@ethersproject/providers'
import { MempoolManager } from './MempoolManager'

const debug = Debug('aa.events')

/**
 * listen to events. trigger ReputationManager's Included
 */
export class EventsManager {
  provider: JsonRpcProvider
  lastBlock = 0

  constructor(
    readonly entryPoint: EntryPoint,
    readonly mempoolManager: MempoolManager,
    readonly reputationManager: ReputationManager,
    readonly l1Offset: number
  ) {
    this.provider = entryPoint.provider as JsonRpcProvider
    this.lastBlock = l1Offset
  }

  /**
   * automatically listen to all UserOperationEvent events
   */
  initEventListener(): void {
    this.entryPoint.on(
      this.entryPoint.filters.UserOperationEvent(),
      (...args) => {
        const ev = args.slice(-1)[0]
        void this.handleEvent(ev as any)
      }
    )
  }

  /**
   * process all new events since last run
   */
  async handlePastEvents(): Promise<void> {
    let startBlock = this.lastBlock
    const currentBlock = await this.provider.getBlockNumber()
    if (currentBlock > startBlock + 5000) {
      while (startBlock + 5000 < currentBlock) {
        const events = await this.entryPoint.queryFilter(
          { address: this.entryPoint.address },
          startBlock,
          startBlock+4999
        )
        for (const ev of events) {
          this.handleEvent(ev)
        }
        startBlock = startBlock + 5000
      }
      this.lastBlock = startBlock
    }
    const events = await this.entryPoint.queryFilter(
      { address: this.entryPoint.address },
      this.lastBlock,
      currentBlock
    )
    for (const ev of events) {
      this.handleEvent(ev)
    }
  }

  handleEvent(
    ev:
      | UserOperationEventEvent
      | AccountDeployedEvent
      | SignatureAggregatorChangedEvent
  ): void {
    switch (ev.event) {
      case 'UserOperationEvent':
        this.handleUserOperationEvent(ev as any)
        break
      case 'AccountDeployed':
        this.handleAccountDeployedEvent(ev as any)
        break
      case 'SignatureAggregatorForUserOperations':
        this.handleAggregatorChangedEvent(ev as any)
        break
    }
    this.lastBlock = ev.blockNumber + 1
  }

  handleAggregatorChangedEvent(ev: SignatureAggregatorChangedEvent): void {
    debug('handle ', ev.event, ev.args.aggregator)
    this.eventAggregator = ev.args.aggregator
    this.eventAggregatorTxHash = ev.transactionHash
  }

  eventAggregator: string | null = null
  eventAggregatorTxHash: string | null = null

  // aggregator event is sent once per events bundle for all UserOperationEvents in this bundle.
  // it is not sent at all if the transaction is handleOps
  getEventAggregator(ev: TypedEvent): string | null {
    if (ev.transactionHash !== this.eventAggregatorTxHash) {
      this.eventAggregator = null
      this.eventAggregatorTxHash = ev.transactionHash
    }
    return this.eventAggregator
  }

  // AccountDeployed event is sent before each UserOperationEvent that deploys a contract.
  handleAccountDeployedEvent(ev: AccountDeployedEvent): void {
    this._includedAddress(ev.args.factory)
  }

  handleUserOperationEvent(ev: UserOperationEventEvent): void {
    const hash = ev.args.userOpHash
    this.mempoolManager.removeUserOp(hash)
    this._includedAddress(ev.args.sender)
    this._includedAddress(ev.args.paymaster)
    this._includedAddress(this.getEventAggregator(ev))
  }

  _includedAddress(data: string | null): void {
    if (data != null && data.length > 42) {
      const addr = data.slice(0, 42)
      this.reputationManager.updateIncludedStatus(addr)
    }
  }
}
