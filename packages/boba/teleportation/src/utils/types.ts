import { BigNumber, Contract, providers } from 'ethers'

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

export interface ChainInfo {
  chainId: number
  url: string
  wsUrl?: string
  provider: providers.StaticJsonRpcProvider
  wsProvider?: providers.WebSocketProvider
  testnet: boolean
  name: string
  teleportationAddress: string
  height: number
  supportedAssets: SupportedAssets
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
