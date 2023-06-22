/* Imports: External */
import {
  BigNumber,
  constants as ethersConstants,
  Contract,
  EventFilter,
  providers,
  Wallet,
} from 'ethers'
import { orderBy } from 'lodash'
import 'reflect-metadata'

/* Imports: Internal */
import { sleep } from '@eth-optimism/core-utils'
import { BaseService } from '@eth-optimism/common-ts'
import { getContractFactory } from '@eth-optimism/contracts'
import { getBobaContractAt } from '@boba/contracts'

/* Imports: Interface */
import {
  ChainInfo,
  DepositTeleportations,
  Disbursement,
  SupportedAssets,
} from './utils/types'
import { HistoryData } from './entity/HistoryData'
import {
  failedDisbursementRepository,
  historyDataRepository,
} from './data-source'
import { FailedDisbursement } from './entity/FailedDisbursement'

interface TeleportationOptions {
  l2RpcProvider: providers.StaticJsonRpcProvider

  // chainId of the L2 network
  chainId: number

  // Address of the teleportation contract
  teleportationAddress: string

  // Wallet
  disburserWallet: Wallet

  selectedBobaChains: ChainInfo[]

  // Own chain to map token symbols to other networks
  originSupportedAssets: SupportedAssets

  pollingInterval: number

  blockRangePerPolling: number
}

const optionSettings = {}

export class TeleportationService extends BaseService<TeleportationOptions> {
  constructor(options: TeleportationOptions) {
    super('Teleportation', options, optionSettings)
  }

  private state: {
    Teleportation: Contract
    // the chain is registered in the teleportation contract
    supportedChains: ChainInfo[]
    // the contract of the chain that users deposit token
    depositTeleportations: DepositTeleportations[]
  } = {} as any

  protected async _init(): Promise<void> {
    this.logger.info('Initializing teleportation service...', {
      options: this.options,
    })

    this.logger.info('Connecting to Teleportation contract...')
    this.state.Teleportation = await getBobaContractAt(
      'Teleportation',
      this.options.teleportationAddress,
      this.options.disburserWallet
    )

    this.logger.info('Connected to Teleportation', {
      address: this.state.Teleportation.address,
    })

    // check the disburser wallet is the disburser of the contract
    const disburserAddress = await this.state.Teleportation.disburser()
    if (disburserAddress !== this.options.disburserWallet.address) {
      throw new Error(
        `Disburser wallet ${this.options.disburserWallet.address} is not the disburser of the contract ${disburserAddress}`
      )
    }

    // check if all chains are supported
    // if the chain is supported, then store the contract of the chain and the balance info
    // to the state
    this.state.supportedChains = []
    this.state.depositTeleportations = []
    for (const chain of this.options.selectedBobaChains) {
      const chainId = chain.chainId
      const isSupported = await this.state.Teleportation.supportedChains(
        chainId
      )
      if (!isSupported) {
        throw new Error(
          `Chain ${chainId} is not supported by the contract ${this.state.Teleportation.address}`
        )
      } else {
        this.state.supportedChains = [...this.state.supportedChains, chain]
        const depositTeleportation = await getBobaContractAt(
          'Teleportation',
          chain.teleportationAddress,
          chain.provider
        )
        const totalDisbursements =
          await this.state.Teleportation.totalDisbursements(chainId)
        const totalDeposits = await depositTeleportation.totalDeposits(
          this.options.chainId
        )
        this.state.depositTeleportations.push({
          Teleportation: depositTeleportation,
          chainId,
          totalDisbursements,
          totalDeposits,
          height: chain.height,
        })
      }
    }
  }

  protected async _start(): Promise<void> {
    while (this.running) {
      for (const depositTeleportation of this.state.depositTeleportations) {
        // search AssetReceived events
        const latestBlock =
          await depositTeleportation.Teleportation.provider.getBlockNumber()
        try {
          const events = await this._watchTeleportation(
            depositTeleportation,
            latestBlock
          )
          await this._disburseTeleportation(
            depositTeleportation,
            events,
            latestBlock
          )
        } catch (err) {
          this.logger.error('Error while running teleportation', {
            err,
          })
        }
      }
      await sleep(this.options.pollingInterval)
    }
  }

  private getConnectedTokenContract(address: string): Contract {
    return getContractFactory('L2StandardERC20')
      .attach(address)
      .connect(this.options.disburserWallet)
  }

  async _watchTeleportation(
    depositTeleportation: DepositTeleportations,
    latestBlock: number
  ): Promise<any> {
    let lastBlock: number
    const chainId = depositTeleportation.chainId.toString()
    try {
      lastBlock = await this._getDepositInfo(chainId)
    } catch (e) {
      this.logger.warn(`No deposit info found in chainId - ${chainId}`)
      lastBlock = depositTeleportation.height
      // store the new deposit info
      await this._putDepositInfo(chainId, lastBlock)
    }
    return await this._getEvents(
      depositTeleportation.Teleportation,
      this.state.Teleportation.filters.AssetReceived(),
      lastBlock,
      latestBlock
    )
  }

  async _disburseTeleportation(
    depositTeleportation: DepositTeleportations,
    events: any,
    latestBlock: number
  ): Promise<void> {
    const chainId = depositTeleportation.chainId
    // parse events
    if (events.length === 0) {
      // update the deposit info if no events are found
      await this._putDepositInfo(chainId, latestBlock)
    } else {
      const lastDisbursement =
        await this.state.Teleportation.totalDisbursements(chainId)
      // eslint-disable-next-line prefer-const
      let disbursement: Disbursement[] = []
      const failedDisbursement: FailedDisbursement[] = []
      // after one failing disbursement we skip all subsequent ones and save them for later recovery as FailedDisbursement
      let disbursementFailed: boolean = false

      for (const event of events) {
        const sourceChainId: BigNumber = event.args.sourceChainId
        const depositId = event.args.depositId
        const amount = event.args.amount
        const sourceChainTokenAddr = event.args.token
        const emitter = event.args.emitter

        // we disburse tokens only if depositId is greater or equal to the last disbursement
        if (depositId.gte(lastDisbursement)) {
          let destChainTokenAddr: string
          try {
            destChainTokenAddr =
              this._getSupportedDestChainTokenAddrBySourceChainTokenAddr(
                sourceChainTokenAddr,
                sourceChainId.toNumber(),
                chainId
              )

            const [isTokenSupported, , , , ,] =
              await this.state.Teleportation.supportedTokens(
                sourceChainTokenAddr
              )
            if (!isTokenSupported) {
              throw new Error(
                `Token '${sourceChainTokenAddr}' not supported originating from chain '${sourceChainId}' with amount '${amount}'!`
              )
            } else {
              if (disbursementFailed) {
                this.logger.warn(
                  `Found a new deposit but not disbursing as previous disbursement failed. Saving into DB for later recovery - depositId: ${depositId.toNumber()} - amount: ${amount.toString()} - emitter: ${emitter} - token/native: ${sourceChainTokenAddr}`
                )

                failedDisbursement.push({
                  amount: amount.toString(),
                  depositId: depositId.toNumber(),
                  destChainId: chainId,
                  sourceChainId: sourceChainId.toString(),
                  destChainTokenAddr,
                  sourceChainTokenAddr,
                  emitter,
                  errorMsg: 'Previous depositID has failed.',
                })
              } else {
                disbursement = [
                  ...disbursement,
                  {
                    token: destChainTokenAddr, // token mapping for correct routing as addresses different on every network
                    amount: amount.toString(),
                    addr: emitter,
                    depositId: depositId.toNumber(),
                    sourceChainId: sourceChainId.toString(),
                  },
                ]
                this.logger.info(
                  `Found a new deposit - sourceChainId: ${sourceChainId.toString()} - depositId: ${depositId.toNumber()} - amount: ${amount.toString()} - emitter: ${emitter} - token/native: ${sourceChainTokenAddr}`
                )
              }
            }
          } catch (e) {
            this.logger.error(e.message)

            // Save first failing and all subsequent disbursements as depositId = amountDisbursements and would fail when disbursing
            disbursementFailed = true

            failedDisbursement.push({
              amount: amount.toString(),
              depositId: depositId.toNumber(),
              destChainId: chainId,
              sourceChainId: sourceChainId.toString(),
              destChainTokenAddr,
              sourceChainTokenAddr,
              emitter,
              errorMsg: e.message,
            })
          }
        }
      }

      disbursement = [
        ...disbursement,
        ...(await this._recoverPreviouslyFailedDisbursements(chainId)),
      ]

      // Save failed disbursements here in bulk (also needed to avoid instant retry)
      await failedDisbursementRepository.save(failedDisbursement)

      // sort disbursement
      disbursement = orderBy(disbursement, ['depositId'], ['asc'])
      // disbure the token
      await this._disburseTx(disbursement, chainId, latestBlock)
    }
  }

  async _recoverPreviouslyFailedDisbursements(
    destChainId: string | number
  ): Promise<Disbursement[]> {
    try {
      const previouslyFailedDisbursements =
        await failedDisbursementRepository.find({ where: { destChainId } })
      return previouslyFailedDisbursements.map((fd) => {
        return {
          token: fd.destChainTokenAddr,
          amount: fd.amount,
          addr: fd.emitter,
          depositId: fd.depositId,
          sourceChainId: fd.sourceChainId,
        }
      })

      // TODO: Delete recovered/retried disbursements

      // TODO: Or just rely on latest block and retry????!!!!!

    } catch (e) {
      this.logger.error(
        `Could not recover previously failed disbursements: ${e.message}`
      )
    }
  }

  async _disburseTx(
    disbursement: Disbursement[],
    chainId: number,
    latestBlock: number
  ): Promise<void> {
    try {
      // build payload for the disbursement
      // the maximum number of disbursement is 10
      const numberOfDisbursement = disbursement.length
      let sliceStart = 0
      let sliceEnd = numberOfDisbursement > 10 ? 10 : numberOfDisbursement
      while (sliceStart < numberOfDisbursement) {
        const slicedDisbursement = disbursement.slice(sliceStart, sliceEnd)

        // approve token(s), disbursements can be mixed - sum up token amounts per token
        const tokens: Map<string, BigNumber> = new Map<string, BigNumber>()
        const approvePending = []
        for (const disb of slicedDisbursement) {
          tokens.set(
            disb.token,
            BigNumber.from(disb.amount).add(tokens.get(disb.token) ?? '0')
          )
        }
        // do separate approves if necessary & sum up native requirement
        let nativeValue: BigNumber = BigNumber.from('0')
        for (const token of tokens.entries()) {
          if (token[0] === ethersConstants.AddressZero) {
            nativeValue = nativeValue.add(token[1])
          } else {
            const approveTx = await this.getConnectedTokenContract(
              token[0]
            ).approve(this.state.Teleportation.address, token[1])
            approvePending.push(approveTx.wait())
          }
        }
        await Promise.all(approvePending)

        const disburseTx = await this.state.Teleportation.disburseAsset(
          slicedDisbursement,
          { value: nativeValue }
        )
        await disburseTx.wait()

        sliceStart = sliceEnd
        sliceEnd = Math.min(sliceEnd + 10, numberOfDisbursement)
      }
      this.logger.info(
        `Disbursement successful - chainId: ${chainId} - slicedDisbursement:${JSON.stringify(
          disbursement
        )} - latestBlock: ${latestBlock}`
      )
      await this._putDepositInfo(chainId, latestBlock)
    } catch (e) {
      this.logger.error(e)
    }
  }

  // get events from the contract
  async _getEvents(
    contract: Contract,
    event: EventFilter,
    fromBlock: number,
    toBlock: number
  ): Promise<any> {
    let events = []
    let startBlock = fromBlock
    while (startBlock < toBlock) {
      const endBlock = Math.min(
        startBlock + this.options.blockRangePerPolling,
        toBlock
      )
      const partialEvents = await contract.queryFilter(
        event,
        startBlock,
        endBlock
      )
      events = [...events, ...partialEvents]
      startBlock = endBlock
    }
    return events
  }

  /**
   * @dev Helper method for accessing the supportedAssets map via value (needed as we need it one way another as we don't save the ticker on-chain).
   * @param sourceChainTokenAddr: Token/Asset address (ZeroAddr for native asset) on source network
   * @param sourceChainId: ChainId the request is coming from
   * @param destChainId: Target chainId to bridge the asset.
   **/
  _getSupportedDestChainTokenAddrBySourceChainTokenAddr(
    sourceChainTokenAddr: string,
    sourceChainId: number,
    destChainId: number
  ) {
    const destChain: ChainInfo = this.state.supportedChains.find(
      (c) => c.chainId === destChainId
    )
    if (!destChain) {
      throw new Error(
        `Destination chain not configured/supported: ${destChain}`
      )
    }

    const receivingChainTokenSymbol =
      this.options.originSupportedAssets[sourceChainTokenAddr]

    const supportedAsset = Object.entries(destChain.supportedAssets).find(
      ([address, tokenSymbol]) => {
        return tokenSymbol === receivingChainTokenSymbol
      }
    )
    if (!supportedAsset) {
      throw new Error(
        `Asset ${receivingChainTokenSymbol} on chain ${destChainId} not configured but possibly supported on-chain`
      )
    }
    return supportedAsset[0] // return only address
  }

  async _putDepositInfo(
    chainId: number | string,
    latestBlock: number
  ): Promise<void> {
    try {
      const historyData = new HistoryData()
      historyData.chainId = chainId
      historyData.blockNo = latestBlock
      await historyDataRepository.save(historyData)
    } catch (error) {
      this.logger.error(`Failed to put depositInfo! - ${error}`)
    }
  }

  async _getDepositInfo(chainId: number | string): Promise<number> {
    const historyData = await historyDataRepository.findOneBy({
      chainId,
    })

    if (historyData) {
      return historyData.blockNo
    } else {
      throw new Error("Can't find latestBlock in depositInfo")
    }
  }
}
