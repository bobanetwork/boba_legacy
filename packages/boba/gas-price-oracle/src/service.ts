/* Imports: External */
import { Contract, Wallet, BigNumber, providers, utils } from 'ethers'
import fs, { promises as fsPromise } from 'fs'
import path from 'path'
import { orderBy } from 'lodash'
import fetch from 'node-fetch'

/* Imports: Internal */
import { sleep } from '@eth-optimism/core-utils'
import { BaseService } from '@eth-optimism/common-ts'
import { loadContract } from '@eth-optimism/contracts'

import Boba_GasPriceOracleJson from '@eth-optimism/contracts/artifacts/contracts/L2/predeploys/Boba_GasPriceOracle.sol/Boba_GasPriceOracle.json'

interface GasPriceOracleOptions {
  // Providers for interacting with L1 and L2.
  l1RpcProvider: providers.StaticJsonRpcProvider
  l2RpcProvider: providers.StaticJsonRpcProvider

  // Address Manager address
  addressManagerAddress: string

  // Address of the gasPrice contract
  gasPriceOracleAddress: string
  OVM_SequencerFeeVault: string
  l2_L1NativeTokenAddress: string

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

  // L1 token CoinGecko ID
  l1TokenCoinGeckoId?: string

  // l1 token Coinmarketcap ID
  l1TokenCoinMarketCapId?: string

  // Coinmarketcap API key
  coinMarketCapApiKey?: string
}

const optionSettings = {}

export class GasPriceOracleService extends BaseService<GasPriceOracleOptions> {
  constructor(options: GasPriceOracleOptions) {
    super('GasPriceOracle', options, optionSettings)
  }

  private state: {
    Lib_AddressManager: Contract
    OVM_GasPriceOracle: Contract
    CanonicalTransactionChain: Contract
    StateCommitmentChain: Contract
    Boba_GasPriceOracle: Contract
    L2SecondaryFeeToken: Contract
    BobaBillingContractAddress: string
    L1SecondaryFeeTokenBalance: BigNumber
    L1SecondaryFeeTokenCostFee: BigNumber
    L1RelayerBalance: BigNumber
    L1RelayerCostFee: BigNumber
    L2BOBAVaultBalance: BigNumber
    L2BOBACollectFee: BigNumber
    L2BOBABillingVaultBalance: BigNumber
    L2BOBABillingCollectFee: BigNumber
    L2SecondaryFeeTokenVaultBalance: BigNumber
    L2SecondaryFeeTokenCollectFee: BigNumber
    chainID: number
    BobaPrice: number
    L1NativeTokenPrice: number
  }

  protected async _init(): Promise<void> {
    this.logger.info('Initializing gas price oracle', {
      gasPriceOracleAddress: this.options.gasPriceOracleAddress,
      OVM_SequencerFeeVault: this.options.OVM_SequencerFeeVault,
      gasOracleOwnerAddress: this.options.gasPriceOracleOwnerWallet.address,
      sequencerWallet: this.options.sequencerAddress,
      proposerWallet: this.options.proposerAddress,
      relayerWallet: this.options.relayerAddress,
      fastRelayerWallet: this.options.fastRelayerAddress,
      pollingInterval: this.options.pollingInterval,
      overheadRatio1000X: this.options.overheadRatio1000X,
      overheadMinPercentChange: this.options.overheadMinPercentChange,
      minOverhead: this.options.minOverhead,
      minL1BaseFee: this.options.minL1BaseFee,
      bobaFeeRatio100X: this.options.bobaFeeRatio100X,
      bobaFeeRatioMinPercentChange: this.options.bobaFeeRatioMinPercentChange,
      bobaLocalTestnetChainId: this.options.bobaLocalTestnetChainId,
      l1TokenCoinGeckoId: this.options.l1TokenCoinGeckoId,
      l1TokenCoinMarketCapId: this.options.l1TokenCoinMarketCapId,
      coinMarketCapApiKey: this.options.coinMarketCapApiKey,
    })

    this.state = {} as any

    this.logger.info('Connecting to Lib_AddressManager...')
    this.state.Lib_AddressManager = loadContract(
      'Lib_AddressManager',
      this.options.addressManagerAddress,
      this.options.l1RpcProvider
    )
    this.logger.info('Connected to Lib_AddressManager', {
      address: this.state.Lib_AddressManager.address,
    })

    this.logger.info('Connecting to CanonicalTransactionChain...')
    const CanonicalTransactionChainAddress =
      await this.state.Lib_AddressManager.getAddress(
        'CanonicalTransactionChain'
      )
    this.state.CanonicalTransactionChain = loadContract(
      'CanonicalTransactionChain',
      CanonicalTransactionChainAddress,
      this.options.l1RpcProvider
    )
    this.logger.info('Connected to CanonicalTransactionChain', {
      address: this.state.CanonicalTransactionChain.address,
    })

    this.logger.info('Connecting to StateCommitmentChain...')
    const StateCommitmentChainAddress =
      await this.state.Lib_AddressManager.getAddress('StateCommitmentChain')
    this.state.StateCommitmentChain = loadContract(
      'StateCommitmentChain',
      StateCommitmentChainAddress,
      this.options.l1RpcProvider
    )
    this.logger.info('Connected to StateCommitmentChain', {
      address: this.state.StateCommitmentChain.address,
    })

    this.logger.info('Connecting to OVM_GasPriceOracle...')
    this.state.OVM_GasPriceOracle = loadContract(
      'OVM_GasPriceOracle',
      this.options.gasPriceOracleAddress,
      this.options.l2RpcProvider
    ).connect(this.options.gasPriceOracleOwnerWallet)
    this.logger.info('Connected to OVM_GasPriceOracle', {
      address: this.state.OVM_GasPriceOracle.address,
    })

    this.logger.info('Connecting to Boba_GasPriceOracle...')
    const Boba_GasPriceOracleAddress =
      await this.state.Lib_AddressManager.getAddress(
        'Proxy__Boba_GasPriceOracle'
      )
    this.state.Boba_GasPriceOracle = new Contract(
      Boba_GasPriceOracleAddress,
      Boba_GasPriceOracleJson.abi,
      this.options.l2RpcProvider
    ).connect(this.options.gasPriceOracleOwnerWallet)
    this.logger.info('Connected to Boba_GasPriceOracle', {
      address: this.state.Boba_GasPriceOracle.address,
    })

    this.logger.info('Connecting to Proxy__BobaBillingContract...')
    this.state.BobaBillingContractAddress =
      await this.state.Lib_AddressManager.getAddress(
        'Proxy__BobaBillingContract'
      )
    this.logger.info('Connected to Proxy__BobaBillingContract', {
      address: this.state.BobaBillingContractAddress,
    })

    this.logger.info('Connecting to L2SecondaryFeeToken...')
    this.state.L2SecondaryFeeToken = loadContract(
      'L2_L1NativeToken',
      this.options.l2_L1NativeTokenAddress,
      this.options.l2RpcProvider
    ).connect(this.options.gasPriceOracleOwnerWallet)
    this.logger.info('Connected to L2SecondaryFeeToken', {
      address: this.state.L2SecondaryFeeToken.address,
    })

    // Total cost
    this.state.L1SecondaryFeeTokenBalance = BigNumber.from('0')
    this.state.L1SecondaryFeeTokenCostFee = BigNumber.from('0')
    // For ajusting the billing price
    this.state.L1RelayerBalance = BigNumber.from('0')
    this.state.L1RelayerCostFee = BigNumber.from('0')
    // Total ETH revenuse
    this.state.L2BOBACollectFee = BigNumber.from('0')
    this.state.L2BOBAVaultBalance = BigNumber.from('0')
    // BOBA revenue
    this.state.L2BOBABillingVaultBalance = BigNumber.from('0')
    this.state.L2BOBABillingCollectFee = BigNumber.from('0')
    // L1 native token revenue
    this.state.L2SecondaryFeeTokenVaultBalance = BigNumber.from('0')
    this.state.L2SecondaryFeeTokenCollectFee = BigNumber.from('0')

    // set boba and l1 native token price
    this.state.BobaPrice = 0
    this.state.L1NativeTokenPrice = 0

    // Load history
    await this._loadL1ETHFee()
    await this._loadL2FeeCost()

    // Get chain ID
    this.state.chainID = (await this.options.l2RpcProvider.getNetwork()).chainId
  }

  protected async _start(): Promise<void> {
    while (this.running) {
      await sleep(this.options.pollingInterval)
      // update price ratio
      await this._updatePriceRatio()
      // l2 gas price
      await this._getL1Balance()
      await this._getL2GasCost()
      // l1 gas price and overhead fee
      await this._updateOverhead()
      await this._upateL1BaseFee()
    }
  }

  private async _loadL1ETHFee(): Promise<void> {
    const dumpsPath = path.resolve(__dirname, '../data/l1History.json')
    if (fs.existsSync(dumpsPath)) {
      this.logger.warn('Loading L1 cost history...')
      const historyJsonRaw = await fsPromise.readFile(dumpsPath)
      const historyJSON = JSON.parse(historyJsonRaw.toString())
      if (historyJSON.L1SecondaryFeeTokenCostFee) {
        /* eslint-disable */
        this.state.L1SecondaryFeeTokenBalance = BigNumber.from(historyJSON.L1SecondaryFeeTokenBalance)
        this.state.L1SecondaryFeeTokenCostFee = BigNumber.from(historyJSON.L1SecondaryFeeTokenCostFee)
        this.state.L1RelayerBalance = BigNumber.from(historyJSON.L1RelayerBalance)
        this.state.L1RelayerCostFee = BigNumber.from(historyJSON.L1RelayerCostFee)
        /* eslint-enable */
      } else {
        this.logger.warn('Invalid L1 cost history!')
      }
    } else {
      this.logger.warn('No L1 cost history Found!')
    }
  }

  private async _loadL2FeeCost(): Promise<void> {
    const ETHVaultBalance = await this.options.l2RpcProvider.getBalance(
      this.options.OVM_SequencerFeeVault
    )
    const L2BOBABillingVaultBalance =
      await this.options.l2RpcProvider.getBalance(
        this.state.BobaBillingContractAddress
      )
    const L2SecondaryFeeTokenVaultBalance =
      await this.state.L2SecondaryFeeToken.balanceOf(
        this.state.Boba_GasPriceOracle.address
      )
    // load data
    const dumpsPath = path.resolve(__dirname, '../data/l2History.json')
    if (fs.existsSync(dumpsPath)) {
      this.logger.warn('Loading L2 cost history...')
      const historyJsonRaw = await fsPromise.readFile(dumpsPath)
      const historyJSON = JSON.parse(historyJsonRaw.toString())
      // Load ETH
      if (historyJSON.L2BOBACollectFee) {
        this.state.L2BOBACollectFee = BigNumber.from(
          historyJSON.L2BOBACollectFee
        )
      } else {
        this.logger.warn('Invalid L2 ETH cost history!')
        this.state.L2BOBACollectFee = ETHVaultBalance
      }
      // Load Boba billing
      if (historyJSON.L2BOBABillingCollectFee) {
        this.state.L2BOBABillingCollectFee = BigNumber.from(
          historyJSON.L2BOBABillingCollectFee
        )
      } else {
        this.logger.warn('Invalid L2 BOBA billing history!')
        this.state.L2BOBABillingCollectFee = L2BOBABillingVaultBalance
      }
      // Load L1 native token
      if (historyJSON.L2SecondaryFeeTokenCollectFee) {
        this.state.L2SecondaryFeeTokenCollectFee = BigNumber.from(
          historyJSON.L2SecondaryFeeTokenCollectFee
        )
      } else {
        this.logger.warn('Invalid L1 native token collect history!')
        this.state.L2SecondaryFeeTokenCollectFee = L2SecondaryFeeTokenVaultBalance
      }
    } else {
      this.logger.warn('No L2 cost history Found!')
      this.state.L2BOBACollectFee = ETHVaultBalance
      this.state.L2BOBABillingCollectFee = L2BOBABillingVaultBalance
      this.state.L2SecondaryFeeTokenCollectFee = L2SecondaryFeeTokenVaultBalance
    }

    /* eslint-disable */
    // adjust the collectFeeHistory if it is not correct
    // if vaultBalance is larger than collectFeeHistory, then we need to adjust the collectFeeHistory
    const _adjustCollectFee = (collectFeeHistory: BigNumber,vaultBalance: BigNumber) => {
      if (collectFeeHistory.lt(vaultBalance)) {
        collectFeeHistory = vaultBalance
      }
    }

    _adjustCollectFee(this.state.L2BOBACollectFee, ETHVaultBalance)
    _adjustCollectFee(this.state.L2BOBABillingCollectFee, L2BOBABillingVaultBalance)
    _adjustCollectFee(this.state.L2SecondaryFeeTokenCollectFee, L2SecondaryFeeTokenVaultBalance)
    /* eslint-enable */

    this.state.L2BOBAVaultBalance = ETHVaultBalance
    this.logger.info('Loaded L2 Cost Data', {
      L2BOBAVaultBalance: this.state.L2BOBAVaultBalance.toString(),
      L2BOBACollectFee: this.state.L2BOBACollectFee.toString(),
      L2BOBABillingCollectFee: this.state.L2BOBABillingCollectFee.toString(),
      L2SecondaryFeeTokenCollectFee:
        this.state.L2SecondaryFeeTokenCollectFee.toString(),
    })
  }

  private async _writeL1ETHFee(): Promise<void> {
    const dumpsPath = path.resolve(__dirname, '../data')
    if (!fs.existsSync(dumpsPath)) {
      fs.mkdirSync(dumpsPath)
    }
    try {
      const addrsPath = path.resolve(dumpsPath, 'l1History.json')
      await fsPromise.writeFile(
        addrsPath,
        JSON.stringify({
          L1SecondaryFeeTokenBalance:
            this.state.L1SecondaryFeeTokenBalance.toString(),
          L1SecondaryFeeTokenCostFee:
            this.state.L1SecondaryFeeTokenCostFee.toString(),
          L1RelayerBalance: this.state.L1RelayerBalance.toString(),
          L1RelayerCostFee: this.state.L1RelayerCostFee.toString(),
        })
      )
    } catch (error) {
      this.logger.error('Failed to write L1 cost history!', error)
    }
  }

  private async _writeL2FeeCollect(): Promise<void> {
    const dumpsPath = path.resolve(__dirname, '../data')
    if (!fs.existsSync(dumpsPath)) {
      fs.mkdirSync(dumpsPath)
    }
    try {
      const addrsPath = path.resolve(dumpsPath, 'l2History.json')
      await fsPromise.writeFile(
        addrsPath,
        JSON.stringify({
          L2BOBACollectFee: this.state.L2BOBACollectFee.toString(),
          L2BOBABillingCollectFee:
            this.state.L2BOBABillingCollectFee.toString(),
          L2SecondaryFeeTokenCollectFee:
            this.state.L2SecondaryFeeTokenCollectFee.toString(),
        })
      )
    } catch (error) {
      this.logger.error('Failed to write L1 cost history!', error)
    }
  }

  private async _getL1Balance(): Promise<void> {
    try {
      const balances = await Promise.all([
        this.options.l1RpcProvider.getBalance(this.options.sequencerAddress),
        this.options.l1RpcProvider.getBalance(this.options.proposerAddress),
        this.options.l1RpcProvider.getBalance(this.options.relayerAddress),
        this.options.l1RpcProvider.getBalance(this.options.fastRelayerAddress),
      ])

      this.logger.info('L1 addresses balance', {
        sequencerBalance: this._formatBigNumberToUnits(balances[0]),
        proposerBalance: this._formatBigNumberToUnits(balances[1]),
        relayerBalance: this._formatBigNumberToUnits(balances[2]),
        fastRelayerBalance: this._formatBigNumberToUnits(balances[3]),
      })

      const L1SecondaryFeeTokenBalanceLatest = balances.reduce((acc, cur) => {
        return acc.add(cur)
      }, BigNumber.from('0'))

      const L1RelayerETHBalanceLatest = balances[2].add(balances[3])

      // ETH balance
      if (!this.state.L1SecondaryFeeTokenBalance.eq(BigNumber.from('0'))) {
        // condition 1 - L1SecondaryFeeTokenBalance <= L1SecondaryFeeTokenBalanceLatest -- do nothing
        // condition 2 - L1SecondaryFeeTokenBalance > L1SecondaryFeeTokenBalanceLatest
        if (
          this.state.L1SecondaryFeeTokenBalance.gt(
            L1SecondaryFeeTokenBalanceLatest
          )
        ) {
          this.state.L1SecondaryFeeTokenCostFee =
            this.state.L1SecondaryFeeTokenCostFee.add(
              this.state.L1SecondaryFeeTokenBalance.sub(
                L1SecondaryFeeTokenBalanceLatest
              )
            )
        }
      } else {
        // start from the point that L1ETHCost = L2ETHCollect
        this.state.L1SecondaryFeeTokenCostFee =
          await this.options.l2RpcProvider.getBalance(
            this.options.OVM_SequencerFeeVault
          )
      }

      // Relayer ETH balance
      if (!this.state.L1RelayerBalance.eq(BigNumber.from('0'))) {
        // condition 1 - L1RelayerBalance <= L1RelayerETHBalanceLatest -- do nothing
        // condition 2 - L1RelayerBalance > L1RelayerETHBalanceLatest
        if (this.state.L1RelayerBalance.gt(L1RelayerETHBalanceLatest)) {
          this.state.L1RelayerCostFee = this.state.L1RelayerCostFee.add(
            this.state.L1RelayerBalance.sub(L1RelayerETHBalanceLatest)
          )
        }
      } else {
        // start from 0
        this.state.L1RelayerCostFee = BigNumber.from(0)
      }

      this.state.L1SecondaryFeeTokenBalance = L1SecondaryFeeTokenBalanceLatest
      this.state.L1RelayerBalance = L1RelayerETHBalanceLatest

      // write history
      this._writeL1ETHFee()

      this.logger.info('Got L1 ETH balances', {
        network: 'L1',
        data: {
          /* eslint-disable */
          L1SecondaryFeeTokenBalance: this._formatBigNumberToEther(this.state.L1SecondaryFeeTokenBalance),
          L1SecondaryFeeTokenBalanceUSD: this._formatBigNumberToEtherUSD(this.state.L1SecondaryFeeTokenBalance, this.state.L1NativeTokenPrice),
          L1SecondaryFeeTokenCostFee: this._formatBigNumberToEther(this.state.L1SecondaryFeeTokenCostFee),
          L1SecondaryFeeTokenCostFeeUSD: this._formatBigNumberToEtherUSD(this.state.L1SecondaryFeeTokenCostFee, this.state.L1NativeTokenPrice),
          L1RelayerCostFee: this._formatBigNumberToEther(this.state.L1RelayerCostFee),
          L1RelayerCostFeeUSD: this._formatBigNumberToEtherUSD(this.state.L1RelayerCostFee, this.state.L1NativeTokenPrice),
          /* eslint-enable */
        },
      })
    } catch (error) {
      this.logger.warn(`CAN\'T GET L1 GAS COST ${error}`)
    }
  }

  private async _getL2GasCost(): Promise<void> {
    try {
      // Get L2 ETH Fee from contract
      const L2BOBACollectFee = await this.options.l2RpcProvider.getBalance(
        this.options.OVM_SequencerFeeVault
      )
      this._updateL2CollectFee(
        L2BOBACollectFee,
        this.state.L2BOBAVaultBalance,
        this.state.L2BOBACollectFee,
        'L2BOBA'
      )

      // Get L2 BOBA Billing balance from contract
      const L2BOBABillingCollectFee =
        await this.options.l2RpcProvider.getBalance(
          this.state.BobaBillingContractAddress
        )
      this._updateL2CollectFee(
        L2BOBABillingCollectFee,
        this.state.L2BOBABillingVaultBalance,
        this.state.L2BOBABillingCollectFee,
        'L2BOBABilling'
      )

      // Get L1 native token balance on L2 from contract
      const L2SecondaryFeeTokenCollectFee =
        await this.state.L2SecondaryFeeToken.balanceOf(
          this.state.Boba_GasPriceOracle.address
        )
      this._updateL2CollectFee(
        L2SecondaryFeeTokenCollectFee,
        this.state.L2SecondaryFeeTokenVaultBalance,
        this.state.L2SecondaryFeeTokenCollectFee,
        'L2SecondaryFeeToken'
      )

      await this._writeL2FeeCollect()

      this.logger.info('Got L2 Gas Collect', {
        network: 'L2',
        data: {
          /* eslint-disable */
          L2BOBACollectFee: this._formatBigNumberToEther(this.state.L2BOBACollectFee),
          L2BOBACollectFeeUSD: this._formatBigNumberToEtherUSD(this.state.L2BOBACollectFee, this.state.BobaPrice),
          L2BOBABillingCollectFee: this._formatBigNumberToEther(this.state.L2BOBABillingCollectFee),
          L2BOBABillingCollectFeeUSD: this._formatBigNumberToEtherUSD(this.state.L2BOBABillingCollectFee, this.state.BobaPrice),
          L2SecondaryFeeTokenCollectFee: this._formatBigNumberToEther(this.state.L2SecondaryFeeTokenCollectFee),
          L2SecondaryFeeTokenCollectFeeUSD: this._formatBigNumberToEtherUSD(this.state.L2SecondaryFeeTokenCollectFee, this.state.L1NativeTokenPrice),
          /* eslint-enable */
        },
      })
    } catch (error) {
      this.logger.warn(`CAN\'T GET L2 GAS COST ${error}`)
    }
  }

  private async _updateOverhead(): Promise<void> {
    try {
      const latestL1Block = await this.options.l1RpcProvider.getBlockNumber()
      const CanonicalTransactionChainLog =
        await this.state.CanonicalTransactionChain.queryFilter(
          this.state.CanonicalTransactionChain.filters.SequencerBatchAppended(),
          Number(latestL1Block) - 1000,
          Number(latestL1Block)
        )
      const StateCommitmentChainLog =
        await this.state.StateCommitmentChain.queryFilter(
          this.state.StateCommitmentChain.filters.StateBatchAppended(),
          Number(latestL1Block) - 1000,
          Number(latestL1Block)
        )

      const orderedOverheadLog = orderBy(
        [...CanonicalTransactionChainLog, ...StateCommitmentChainLog],
        'blockNumber',
        'desc'
      )

      // Calculate the batch size
      let L1BatchSubmissionGasUsage = BigNumber.from(0)
      const transactionHashList = orderedOverheadLog.reduce(
        (acc, cur, index) => {
          if (!acc.includes(cur.transactionHash)) {
            acc.push(cur.transactionHash)
          }
          return acc
        },
        []
      )

      const batchSize = StateCommitmentChainLog.reduce((acc, cur) => {
        acc += cur.args._batchSize.toNumber()
        return acc
      }, 0)

      for (const hash of transactionHashList) {
        const txReceipt =
          await this.options.l1RpcProvider.getTransactionReceipt(hash)
        L1BatchSubmissionGasUsage = L1BatchSubmissionGasUsage.add(
          txReceipt.gasUsed
        )
      }

      const batchFee = L1BatchSubmissionGasUsage.div(BigNumber.from(batchSize))
      const targetOverheadGas = batchFee
        .mul(BigNumber.from(this.options.overheadRatio1000X))
        .div(BigNumber.from('1000'))

      const overheadProduction = await this.state.OVM_GasPriceOracle.overhead()

      if (
        (targetOverheadGas.toNumber() <
          overheadProduction.toNumber() *
            (1 + this.options.overheadMinPercentChange) &&
          targetOverheadGas.toNumber() >
            overheadProduction.toNumber() *
              (1 - this.options.overheadMinPercentChange)) ||
        !targetOverheadGas.toNumber()
      ) {
        this.logger.info('No need to update overhead value', {
          targetOverheadGas: targetOverheadGas.toNumber(),
          overheadGas: overheadProduction.toNumber(),
        })
      } else {
        if (targetOverheadGas.toNumber() > this.options.minOverhead) {
          this.logger.debug('Updating overhead gas...')
          const tx = await this.state.OVM_GasPriceOracle.setOverhead(
            targetOverheadGas,
            { gasPrice: 0 }
          )
          await tx.wait()
          this.logger.info('Updated overhead gas', {
            overheadProduction: overheadProduction.toNumber(),
            overheadGas: targetOverheadGas.toNumber(),
          })
        } else {
          this.logger.info('No need to update overhead value', {
            targetOverheadGas: targetOverheadGas.toNumber(),
            overheadGas: overheadProduction.toNumber(),
            minOverheadGas: this.options.minOverhead,
          })
        }
      }
    } catch (error) {
      this.logger.warn(`CAN\'T UPDATE OVER HEAD RATIO ${error}`)
    }
  }

  private async _upateL1BaseFee(): Promise<void> {
    try {
      const l1GasPrice = await this.options.l1RpcProvider.getGasPrice()
      const l1BaseFee = await this.state.OVM_GasPriceOracle.l1BaseFee()
      if (
        l1GasPrice.toNumber() !== l1BaseFee.toNumber() &&
        l1GasPrice.toNumber() > this.options.minL1BaseFee &&
        l1GasPrice.toNumber() < this.options.maxL1BaseFee
      ) {
        const tx = await this.state.OVM_GasPriceOracle.setL1BaseFee(
          l1GasPrice,
          this.state.chainID === this.options.bobaLocalTestnetChainId
            ? {}
            : { gasPrice: 0 }
        )
        await tx.wait()
        this.logger.info('Updated l1BaseFee', {
          l1GasPrice: l1GasPrice.toNumber(),
          l1BaseFee: l1BaseFee.toNumber(),
        })
      } else {
        this.logger.info('No need to update L1 base gas price', {
          l1GasPrice: l1GasPrice.toNumber(),
          l1BaseFee: l1BaseFee.toNumber(),
          minL1BaseFee: this.options.minL1BaseFee,
          maxL1BaseFee: this.options.maxL1BaseFee,
        })
      }
    } catch (error) {
      this.logger.warn(`CAN\'T UPDATE L1 BASE FEE ${error}`)
    }
  }

  private async _updatePriceRatio(): Promise<void> {
    try {
      /* eslint-disable */
      const BobaPriceFromCoinGecko = await this._getTokenPriceFromCoinGecko('boba-network')
      const l1NativeTokenPriceFromCoinGecko = await this._getTokenPriceFromCoinGecko(this.options.l1TokenCoinGeckoId)
      const BobaPriceFromCoinMarketCap = await this._getTokenPriceFromCoinMarketCap('14556')
      const l1NativeTokenPriceFromCoinMarketCap = await this._getTokenPriceFromCoinMarketCap(this.options.l1TokenCoinMarketCapId)
      const BobaMarketPricesFromCoinMarketCap = await this._getTokenMarketPriceFromCoinMarketCap('14556')
      const l1NativeTokenMarketPricesFromCoinMarketCap = await this._getTokenMarketPriceFromCoinMarketCap(this.options.l1TokenCoinMarketCapId)

      BobaMarketPricesFromCoinMarketCap.push(BobaPriceFromCoinGecko, BobaPriceFromCoinMarketCap)
      l1NativeTokenMarketPricesFromCoinMarketCap.push(l1NativeTokenPriceFromCoinGecko, l1NativeTokenPriceFromCoinMarketCap)

      // calculate the average price of the two sources
      const calculateAverage = (array: Array<number>) => array.reduce((a, b) => a + b) / array.length
      const BobaPrice = calculateAverage(this.filterOutliers(BobaMarketPricesFromCoinMarketCap))
      const l1NativeTokenPrice = calculateAverage(this.filterOutliers(l1NativeTokenMarketPricesFromCoinMarketCap))
      /* eslint-enable */

      // store prices
      this.state.BobaPrice = BobaPrice
      this.state.L1NativeTokenPrice = l1NativeTokenPrice

      if (BobaPrice === 0 || l1NativeTokenPrice === 0) {
        this.logger.warn(`Token price is 0, skipping update`)
      } else {
        const decimals = (
          await this.state.Boba_GasPriceOracle.decimals()
        ).toNumber()
        const marketPriceRatio = Math.round(
          (BobaPrice / l1NativeTokenPrice) * 10 ** decimals
        )
        const priceRatio = Math.round(
          (marketPriceRatio * this.options.bobaFeeRatio100X) / 100
        )

        /* eslint-disable */
        const originalPriceRatio = (await this.state.Boba_GasPriceOracle.priceRatio()).toNumber()
        const originalMarketPriceRatio = (await this.state.Boba_GasPriceOracle.marketPriceRatio()).toNumber()
        /* eslint-enable */

        if (
          priceRatio !== originalPriceRatio ||
          marketPriceRatio !== originalMarketPriceRatio
        ) {
          const tx = await this.state.Boba_GasPriceOracle.updatePriceRatio(
            priceRatio,
            marketPriceRatio,
            this.state.chainID === this.options.bobaLocalTestnetChainId
              ? {}
              : { gasPrice: 0 }
          )
          await tx.wait()
          this.logger.info('Updated price ratio', {
            priceRatio,
            marketPriceRatio,
            BobaPriceFromCoinGecko,
            BobaPriceFromCoinMarketCap,
            BobaMarketPricesFromCoinMarketCap,
            l1NativeTokenPriceFromCoinGecko,
            l1NativeTokenPriceFromCoinMarketCap,
            l1NativeTokenMarketPricesFromCoinMarketCap,
          })
        } else {
          this.logger.info('No need to update price ratio', {
            priceRatio,
            originalPriceRatio,
            marketPriceRatio,
            originalMarketPriceRatio,
          })
        }
      }
    } catch (error) {
      this.logger.warn(`CAN\'T QUERY TOKEN PRICE ${error}`)
    }
  }

  // Data provided by CoinGecko
  private async _getTokenPriceFromCoinGecko(id: string): Promise<number> {
    try {
      const URL = `https:///api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&community_date=false&developer_data=false&sparkline=false`
      const payload = await fetch(URL)
      const payloadParsed = await payload.json()
      return Number(payloadParsed.market_data.current_price.usd)
    } catch (err) {
      this.logger.warn(`CAN\'T QUERY TOKEN PRICE ${err} - ${id} FROM CoinGecko`)
      return 0
    }
  }

  // Data provided by Coinmarketcap
  private async _getTokenPriceFromCoinMarketCap(id: string): Promise<number> {
    try {
      const URL = `https://pro-api.coinmarketcap.com/v1/tools/price-conversion?amount=1&id=${id}`
      const payload = await fetch(URL, {
        method: 'GET',
        headers: { 'x-cmc_pro_api_key': this.options.coinMarketCapApiKey },
      })
      const payloadParsed = await payload.json()
      return Number(payloadParsed.data.quote.USD.price)
    } catch (err) {
      this.logger.warn(
        `CAN\'T QUERY TOKEN PRICE ${err} - ${id} FROM CoinMarketCap`
      )
      return 0
    }
  }

  private async _getTokenMarketPriceFromCoinMarketCap(
    id: string
  ): Promise<Array<number>> {
    try {
      const URL = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/market-pairs/latest?id=${id}`
      const payload = await fetch(URL, {
        method: 'GET',
        headers: { 'x-cmc_pro_api_key': this.options.coinMarketCapApiKey },
      })
      const payloadParsed = await payload.json()
      const marketData = payloadParsed.data.market_pairs
      // Get market price ratio
      const markertPrices = []
      for (const values of marketData) {
        if (values.outlier_detected === 0) {
          markertPrices.push(Number(values.quote.exchange_reported.price))
        }
      }
      return markertPrices
    } catch (err) {
      this.logger.warn(
        `CAN\'T QUERY TOKEN PRICE ${err} - ${id} FROM CoinMarketCap`
      )
      return []
    }
  }

  private filterOutliers(input: Array<number>) {
    if (input.length <= 2) {
      return input
    }
    const values = input.concat()
    values.sort((a: number, b: number) => a - b)

    const q1 = values[Math.floor(values.length / 4)]
    const q3 = values[Math.ceil(values.length * (3 / 4))]
    const iqr = q3 - q1

    const maxValue = q3 + iqr * 1.5
    const minValue = q1 - iqr * 1.5

    return values.filter((i) => i <= maxValue && i >= minValue)
  }

  private _updateL2CollectFee(
    latestCollectFee: BigNumber,
    vaultBalanceHistory: BigNumber,
    collectFeeCache: BigNumber,
    prefix: string
  ) {
    // If vault balance is lower than the cache, it means that the vault has been drained
    if (latestCollectFee.lt(vaultBalanceHistory)) {
      this.state[`${prefix}Balance`] = latestCollectFee
    }
    const collectFeeIncreased = latestCollectFee.sub(vaultBalanceHistory)
    this.state[`${prefix}VaultBalance`] = latestCollectFee

    this.state[`${prefix}CollectFee`] = collectFeeCache.add(collectFeeIncreased)
  }

  private _formatBigNumberToEther(
    number: BigNumber | string,
    decimal = 6
  ): Number {
    return Number(Number(number).toFixed(decimal))
  }

  private _formatBigNumberToEtherUSD(
    number: BigNumber | string,
    price: number,
    decimal = 6
  ): Number {
    return Number((Number(number) * price).toFixed(decimal))
  }

  private _formatBigNumberToUnits(
    number: BigNumber | string,
    units = 18,
    decimal = 2
  ) {
    return Number(Number(utils.formatUnits(number, units)).toFixed(decimal))
  }
}
