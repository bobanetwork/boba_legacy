import { BigNumber } from 'ethers'

export interface L2block {
  L2block: number
  L1block: number
  batchRoot: string
  batchSize: number
  batchIndex: number
  prevTotalElements: number
  extraData: string
  stateRoot: string
}