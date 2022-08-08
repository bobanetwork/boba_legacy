// Only load if not in browser.
import { isNode } from 'browser-or-node'

// eslint-disable-next-line no-var
declare var window: any

const fetch = isNode ? require('node-fetch') : window.fetch

import {
  EnqueueResponse,
  StateRootBatchResponse,
  StateRootResponse,
  SyncingResponse,
  TransactionBatchResponse,
  TransactionResponse,
} from '../types'

export class L1DataTransportClient {
  constructor(private url: string) {}

  public async syncing(): Promise<SyncingResponse> {
    return this._get(`/eth/syncing`)
  }

  public async getEnqueueByIndex(index: number): Promise<EnqueueResponse> {
    return this._get(`/enqueue/index/${index}`)
  }

  public async syncingL2(): Promise<SyncingResponse> {
    return this._get(`/eth/syncing/l2`)
  }

  public async getLatestEnqueue(): Promise<EnqueueResponse> {
    return this._get(`/enqueue/latest`)
  }

  public async getTransactionByIndex(
    index: number
  ): Promise<TransactionResponse> {
    return this._get(`/transaction/index/${index}`)
  }

  public async getLatestTransaction(): Promise<TransactionResponse> {
    return this._get(`/transaction/latest`)
  }

  public async getTransactionBatchByIndex(
    index: number
  ): Promise<TransactionBatchResponse> {
    return this._get(`/batch/transaction/index/${index}`)
  }

  public async getLatestTransactionBatch(): Promise<TransactionBatchResponse> {
    return this._get(`/batch/transaction/latest`)
  }

  public async getStateRootByIndex(index: number): Promise<StateRootResponse> {
    return this._get(`/stateroot/index/${index}`)
  }

  public async getLatestStateRoot(): Promise<StateRootResponse> {
    return this._get(`/stateroot/latest`)
  }

  public async getStateRootBatchByIndex(
    index: number
  ): Promise<StateRootBatchResponse> {
    return this._get(`/batch/stateroot/index/${index}`)
  }

  public async getLatestStateRootBatch(): Promise<StateRootBatchResponse> {
    return this._get(`/batch/stateroot/latest`)
  }

  private async _get<TResponse>(endpoint: string): Promise<TResponse> {
    return (await fetch(`${this.url}${endpoint}`)).json()
  }
}
