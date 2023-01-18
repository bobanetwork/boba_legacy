import { BigNumber, Contract, providers } from 'ethers'

export interface ChainInfo {
  chainId: number
  url: string
  provider: providers.StaticJsonRpcProvider
  testnet: boolean
  name: string
  teleportationAddress: string
  height: number
  BobaTokenAddress?: string
}

export interface DepositTeleportations {
  Teleportation: Contract
  chainId: number
  totalDeposits: BigNumber
  totalDisbursements: BigNumber
  height: number
}

export interface Disbursement {
  amount: string
  addr: string
  sourceChainId: number | string
  depositId: number | string
}
