import { BigNumber, Contract, providers } from 'ethers'

export interface ChainInfo {
  chainId: number
  url: string
  provider: providers.StaticJsonRpcProvider
  testnet: boolean
  name: string
  teleportationAddress: string
  height: number
  supportedAssets: {
    [address: string]: string // symbol (MUST BE UNIQUE)
  }
}

export interface DepositTeleportations {
  Teleportation: Contract
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
