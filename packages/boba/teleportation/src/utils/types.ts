import { BigNumber, Contract, providers } from 'ethers'
import {IBobaChain} from "./chains";

export interface SupportedAssets {
  [address: string]: string // symbol (MUST BE UNIQUE)
}

export interface AssetReceivedEvent {
  args: {
    token: string
    sourceChainId: BigNumber
    toChainId: BigNumber
    depositId: BigNumber
    emitter: string
    amount: BigNumber
  }
}

export interface ChainInfo extends IBobaChain {
  chainId: number
  provider: providers.StaticJsonRpcProvider
  wsProvider?: providers.WebSocketProvider
}

export interface DepositTeleportations {
  Teleportation: Contract
  wsAvailable: boolean
  chainId: number
  totalDeposits: BigNumber
  totalDisbursements: BigNumber
  height: number
}

export interface Disbursement {
  /** @dev Ignored for native disbursements */
  token: string
  amount: string
  addr: string
  sourceChainId: number | string
  depositId: number | string
}
