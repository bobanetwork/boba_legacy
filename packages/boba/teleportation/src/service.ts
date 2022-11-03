/* Imports: External */
import { Contract, Wallet, BigNumber, providers, utils } from 'ethers'
import fs, { promises as fsPromise } from 'fs'
import path from 'path'

/* Imports: Internal */
import { sleep } from '@eth-optimism/core-utils'
import { BaseService } from '@eth-optimism/common-ts'

interface GasPriceOracleOptions {
  // Providers for interacting with L1 and L2.
  l1RpcProvider: providers.StaticJsonRpcProvider
  l2RpcProvider: providers.StaticJsonRpcProvider

  // Address Manager address
  addressManagerAddress: string

  // Address of the gasPrice contract
  gasPriceOracleAddress: string
  OVM_SequencerFeeVault: string

  // Wallet
  gasPriceOracleOwnerWallet: Wallet

  // monitor accounts
  sequencerAddress: string
  proposerAddress: string
  relayerAddress: string
  fastRelayerAddress: string

  // Interval in seconds to wait between loops
  pollingInterval: number

  // overhead ratio
  overheadRatio1000X: number

  // Min percent change
  overheadMinPercentChange: number

  // Min overhead
  minOverhead: number

  // Min L1 base fee
  minL1BaseFee: number

  // Max L1 base fee
  maxL1BaseFee: number

  // boba fee / eth fee
  bobaFeeRatio100X: number

  // minimum percentage change for boba fee / eth fee
  bobaFeeRatioMinPercentChange: number

  // local testnet chain ID
  bobaLocalTestnetChainId: number
}

const optionSettings = {}

export class GasPriceOracleService extends BaseService<GasPriceOracleOptions> {
  constructor(options: GasPriceOracleOptions) {
    super('GasPriceOracle', options, optionSettings)
  }
}
