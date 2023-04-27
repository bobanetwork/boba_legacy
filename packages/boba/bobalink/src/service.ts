/* Imports: External */
import { Contract, Wallet, BigNumber, providers } from 'ethers'

/* Imports: Internal */
import { sleep } from '@eth-optimism/core-utils'
import { BaseService } from '@eth-optimism/common-ts'
import { getBobaContractABI } from '@boba/contracts'

/* Imports: Inteface */
import {
  BobaLinkPairs,
  BobaLinkContracts,
  BobaLinkContract,
  GasPriceOverride,
} from './utils/types'

interface BobaLinkOptions {
  l1RpcProvider: providers.StaticJsonRpcProvider
  l2RpcProvider: providers.StaticJsonRpcProvider

  // chain ID of the L2 network
  chainId: number

  reporterWallet: Wallet

  bobaLinkPairs: BobaLinkPairs

  pollingInterval: number

  setGasPriceToZero: boolean
}

const optionSettings = {}

export class BobaLinkService extends BaseService<BobaLinkOptions> {
  constructor(options: BobaLinkOptions) {
    super('BOBALinkService', options, optionSettings)
  }

  private state: {
    bobaLinkContracts: BobaLinkContracts
    bobaLinkContractAddresses: string[]
    gasPriceOracleOwnerAddress: string
    gasOverride: GasPriceOverride
  } = {} as any

  async _init(): Promise<void> {
    this.logger.info('Initializing bobaLink service...', {
      options: this.options,
    })

    this.logger.info('Connecting to bobaLink contracts...', {
      bobaLinkPairs: this.options.bobaLinkPairs,
    })
    /* eslint-disable */
    const FluxAggregatorHCABI = await getBobaContractABI('FluxAggregatorHC')
    this.state.bobaLinkContracts = Object.keys(this.options.bobaLinkPairs).reduce((bobaLinkContracts, key) => {
      const l2ContractAddress = this.options.bobaLinkPairs[key].l2ContractAddress
      bobaLinkContracts[l2ContractAddress] = {
        l2Contract: new Contract(l2ContractAddress, FluxAggregatorHCABI, this.options.reporterWallet),
        l1Contract: new Contract(key, FluxAggregatorHCABI, this.options.l1RpcProvider),
      }
      return bobaLinkContracts
    }, {})
    /* eslint-enable */

    for (const [, contracts] of Object.entries(this.state.bobaLinkContracts)) {
      this.logger.info('Connected to bobaLink contract', {
        pair: this.options.bobaLinkPairs[contracts.l1Contract.address].pair,
        l1ContractAddress: contracts.l1Contract.address,
        l2ContractAddress: contracts.l2Contract.address,
      })
    }

    this.state.gasOverride = this.options.setGasPriceToZero
      ? { gasLimit: 10000000, gasPrice: 0 }
      : { gasLimit: 10000000 }
  }

  async _start(): Promise<void> {
    while (this.running) {
      for (const [, contracts] of Object.entries(
        this.state.bobaLinkContracts
      )) {
        try {
          let [lastRoundId, CLLatestRoundId] = await this._getReportedRound(
            contracts
          )
          // reporting the new data
          while (lastRoundId.lt(CLLatestRoundId)) {
            await this._reportRound(contracts, lastRoundId, CLLatestRoundId)
            ;[lastRoundId, CLLatestRoundId] = await this._getReportedRound(
              contracts
            )
            sleep(500)
          }
        } catch (err) {
          this.logger.error('Error reporting round', {
            err,
          })
        }
      }
      await sleep(this.options.pollingInterval)
    }
  }

  protected async _getReportedRound(
    contracts: BobaLinkContract
  ): Promise<[BigNumber, BigNumber]> {
    const lastRoundId = await contracts.l2Contract.latestRound()
    const CLLatestRoundId = await contracts.l1Contract.latestRound()
    return [lastRoundId, CLLatestRoundId]
  }

  protected async _reportRound(
    contracts: BobaLinkContract,
    lastRoundId: BigNumber,
    CLLatestRoundId: BigNumber
  ): Promise<void> {
    const nextRoundId = lastRoundId.add(1)
    const roundData = await contracts.l1Contract.getRoundData(nextRoundId)

    try {
      await contracts.l2Contract.estimateGas.submit(nextRoundId)
      const submitTx = await contracts.l2Contract.submit(
        nextRoundId,
        this.state.gasOverride
      )
      await submitTx.wait()
      this.logger.info('Turing submitted round', {
        nextRoundId: nextRoundId.toString(),
      })
    } catch (err) {
      this.logger.error('Error submitting round', {
        err,
        nextRoundId,
      })
      const submitTx = await contracts.l2Contract.emergencySubmit(
        nextRoundId,
        roundData.answer,
        CLLatestRoundId,
        this.state.gasOverride
      )
      await submitTx.wait()
      this.logger.info('Emergency submitted round', {
        nextRoundId: nextRoundId.toString(),
        data: roundData.answer.toString(),
        CLLatestRoundId: CLLatestRoundId.toString(),
      })
    }
  }
}
