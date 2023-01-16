import { Contract } from 'ethers'

export interface BobaLinkPairs {
  [key: string]: BobaLinkPair
}

export interface BobaLinkPair {
  pair: string
  decimals: number
  l2ContractAddress: string
}

export interface BobaLinkContracts {
  [key: string]: BobaLinkContract
}

export interface BobaLinkContract {
  l2Contract: Contract
  l1Contract: Contract
}

export interface GasPriceOverride {
  gasLimit: number
  gasPrice?: number
}
