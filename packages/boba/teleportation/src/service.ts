/* Imports: External */
import {
  BigNumber,
  constants as ethersConstants,
  Contract,
  EventFilter,
  providers, Signer,
  Wallet,
} from 'ethers'
import {orderBy} from 'lodash'
import 'reflect-metadata'

/* Imports: Internal */
import {sleep} from '@eth-optimism/core-utils'
import {BaseService} from '@eth-optimism/common-ts'
import {getContractFactory} from '@eth-optimism/contracts'
import {getBobaContractAt} from '@boba/contracts'

/* Imports: Interface */
import {
  AssetReceivedEvent,
  ChainInfo,
  DepositTeleportations,
  Disbursement,
  SupportedAssets,
} from './utils/types'
import {HistoryData} from './entities/HistoryData.entity'
import {historyDataRepository} from './data-source'
import {IKMSSignerConfig, KMSSigner} from './utils/kms-signing'
import {IBobaChain} from "./utils/chains";

interface TeleportationOptions {
  l2RpcProvider: providers.StaticJsonRpcProvider
  l2WSRpcProvider?: providers.WebSocketProvider

  // chainId of the L2 network
  chainId: number

  // Address of the teleportation contract
  teleportationAddress: string

  selectedBobaChains: ChainInfo[]

  // Own chain to map token symbols to other networks
  ownSupportedAssets: SupportedAssets

  pollingInterval: number

  blockRangePerPolling: number

  awsConfig: IKMSSignerConfig
}

const optionSettings = {}

export class TeleportationService extends BaseService<TeleportationOptions> {
  private readonly EXPECTED_PONG_BACK = 15000
  private readonly KEEP_ALIVE_CHECK_INTERVAL = 7500

  constructor(options: TeleportationOptions) {
    super('Teleportation', options, optionSettings)
  }

  private state: {
    Teleportation: Contract
    // the chain is registered in the teleportation contract
    supportedChains: ChainInfo[]
    // the contract of the chain that users deposit token
    depositTeleportations: DepositTeleportations[]
    // AWS KMS Signer for disburser key, ..
    KMSSigner: KMSSigner,
    // ws connection ping timeout
    wsPingTimeout: { number: NodeJS.Timeout },
    // ws connection keep alive interval
    wsKeepAliveInterval: { number: NodeJS.Timer },
  } = {} as any

  protected async _init(): Promise<void> {
    this.logger.info('Initializing teleportation service...', {
      options: this.options,
    })

    this.logger.info('Initializing KMSSigner...')
    this.state.KMSSigner = new KMSSigner(this.options.awsConfig)

    this.logger.info('Connecting to Teleportation contract...')
    this.state.Teleportation = await getBobaContractAt(
      'Teleportation',
      this.options.teleportationAddress,
      this.options.l2WSRpcProvider ?? this.options.l2RpcProvider
    )

    this.logger.info('Connected to Teleportation', {
      address: this.state.Teleportation.address,
    })

    // check the disburser wallet is the disburser of the contract
    const disburserAddress = await this.state.Teleportation.disburser()
    const kmsSignerAddress = await this.state.KMSSigner.getSignerAddr()
    if (disburserAddress.toLowerCase() !== kmsSignerAddress.toLowerCase()) {
      throw new Error(
        `Disburser wallet ${kmsSignerAddress} is not the disburser of the contract ${disburserAddress}`
      )
    }

    // check if all chains are supported
    // if the chain is supported, then store the contract of the chain and the balance info
    // to the state
    this.state.supportedChains = []
    this.state.depositTeleportations = []
    for (const chain of this.options.selectedBobaChains) {
      const chainId = chain.chainId
      // assuming BOBA is enabled on supported networks to retain battle-tested logic
      const bobaTokenContract = Object.keys(chain.supportedAssets).find(
        (k) => chain.supportedAssets[k] === 'BOBA'
      )

      const isSupported = await this.state.Teleportation.supportedTokens(
        bobaTokenContract,
        chainId
      )
      if (!isSupported) {
        throw new Error(
          `Chain ${chainId} is not supported by the contract ${
            this.state.Teleportation.address
          } on chain ${
            (await this.state.Teleportation.provider.getNetwork()).chainId
          }`
        )
      } else {
        this.state.supportedChains = [...this.state.supportedChains, chain]
        const depositTeleportation = await getBobaContractAt(
          'Teleportation',
          chain.teleportationAddress,
          chain.wsProvider ?? chain.provider
        )
        const totalDisbursements =
          await this.state.Teleportation.totalDisbursements(chainId)
        const totalDeposits = await depositTeleportation.totalDeposits(
          this.options.chainId
        )

        this.state.depositTeleportations.push({
          Teleportation: depositTeleportation,
          wsAvailable: !!chain.wsProvider,
          chainId,
          totalDisbursements,
          totalDeposits,
          height: chain.height,
        })
      }
    }
    this.logger.info('Teleportation service initialized successfully.')
  }

  protected async _start(): Promise<void> {

    const wsDepositTeleportation = this.state.depositTeleportations.filter(t => t.wsAvailable)
    const noWsDepositTeleportation = this.state.depositTeleportations.filter(t => !t.wsAvailable)

    // Websocket providers
    for (const depositTeleportation of wsDepositTeleportation) {

      const latestBlock =
        await depositTeleportation.Teleportation.provider.getBlockNumber()

      try {
        // load events for blocks before currentBlock
        const events: AssetReceivedEvent[] = await this._watchTeleportation(
          depositTeleportation,
          latestBlock
        )
        await this._disburseTeleportation(
          depositTeleportation,
          events,
          latestBlock
        )
      } catch (err) {
        this.logger.error('Error while running teleportation (ws)', {
          err,
        })
      }

      this._handleWebsocketConnection(depositTeleportation, latestBlock)
    }

    while (this.running) {
      for (const depositTeleportation of noWsDepositTeleportation) {
        // search AssetReceived events
        const latestBlock =
          await depositTeleportation.Teleportation.provider.getBlockNumber()
        try {
          const events: AssetReceivedEvent[] = await this._watchTeleportation(
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

  _handleWebsocketConnection(depositTeleportation: DepositTeleportations, latestBlock: number) {
    const provider: providers.WebSocketProvider = depositTeleportation.Teleportation.provider as providers.WebSocketProvider
    const chainId = depositTeleportation.chainId

    // also returns all parameters of the event, which we don't need here (last one is the event itself)
    depositTeleportation.Teleportation.on(this.state.Teleportation.filters.AssetReceived(), async (_, _1, _2, _3, _4, _5, event) => {
      console.log("Received new event via websocket..")
      await this._disburseTeleportation(
        depositTeleportation,
        [event],
        latestBlock
      )
    })

    provider._websocket.on('open', () => {
      this.state.wsKeepAliveInterval[chainId] = setInterval(() => {
        console.log('Checking if the connection is alive, sending a ping for chainId', chainId)

        provider._websocket.ping()

        // Use `WebSocket#terminate()`, which immediately destroys the connection,
        // instead of `WebSocket#close()`, which waits for the close timer.
        // Delay should be equal to the interval at which your server
        // sends out pings plus a conservative assumption of the latency.
        this.state.wsPingTimeout[chainId] = setTimeout(() => {
          provider._websocket.terminate()
        }, this.EXPECTED_PONG_BACK)
      }, this.KEEP_ALIVE_CHECK_INTERVAL)
    })

    provider._websocket.on('close', () => {
      console.error('The websocket connection was closed for chainId', chainId)
      clearInterval(this.state.wsKeepAliveInterval[chainId])
      clearTimeout(this.state.wsPingTimeout[chainId])
      this._handleWebsocketConnection(depositTeleportation, latestBlock)
    })

    provider._websocket.on('pong', () => {
      console.log('Received pong, so connection is alive, clearing the timeout for chainId ', chainId)
      clearInterval(this.state.wsPingTimeout[chainId])
    })
    console.log("Websocket started..")
  }

  async _watchTeleportation(
    depositTeleportation: DepositTeleportations,
    latestBlock: number
  ): Promise<AssetReceivedEvent[]> {
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

    return this._getEvents(
      depositTeleportation.Teleportation,
      this.state.Teleportation.filters.AssetReceived(),
      lastBlock,
      latestBlock
    )
  }

  async _disburseTeleportation(
    depositTeleportation: DepositTeleportations,
    events: AssetReceivedEvent[],
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

      try {
        for (const event of events) {
          const sourceChainId: BigNumber = event.args.sourceChainId
          const depositId = event.args.depositId
          const amount = event.args.amount
          const sourceChainTokenAddr = event.args.token
          const emitter = event.args.emitter

          // we disburse tokens only if depositId is greater or equal to the last disbursement
          if (depositId.gte(lastDisbursement)) {
            const destChainTokenAddr =
              this._getSupportedDestChainTokenAddrBySourceChainTokenAddr(
                sourceChainTokenAddr,
                sourceChainId
              )

            const [isTokenSupported, , , , ,] =
              await this.state.Teleportation.supportedTokens(
                sourceChainTokenAddr,
                sourceChainId
              )
            if (!isTokenSupported) {
              throw new Error(
                `Token '${sourceChainTokenAddr}' not supported originating from chain '${sourceChainId}' with amount '${amount}'!`
              )
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
        }

        // sort disbursement
        disbursement = orderBy(disbursement, ['depositId'], ['asc'])
        // disbure the token but only if all disbursements could have been processed to avoid missing events due to updating the latestBlock
        await this._disburseTx(disbursement, chainId, latestBlock)
      } catch (e) {
        // Catch outside loop to stop at first failing depositID as all subsequent disbursements as depositId = amountDisbursements and would fail when disbursing
        this.logger.error(e.message)
      }
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
            const contract = getContractFactory('L2StandardERC20').attach(
              token[0]
            )
            const approveTxUnsigned =
              await contract.populateTransaction.approve(
                this.state.Teleportation.address,
                token[1]
              )
            const approveTx = await this.state.KMSSigner.sendTxViaKMS(
              this.state.Teleportation.provider,
              token[0],
              BigNumber.from('0'),
              approveTxUnsigned
            )
            approvePending.push(approveTx.wait())
          }
        }
        await Promise.all(approvePending)

        const disburseTxUnsigned =
          await this.state.Teleportation.populateTransaction.disburseAsset(
            slicedDisbursement,
            {value: nativeValue}
          )
        const disburseTx = await this.state.KMSSigner.sendTxViaKMS(
          this.state.Teleportation.provider,
          this.state.Teleportation.address,
          nativeValue,
          disburseTxUnsigned
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
   **/
  _getSupportedDestChainTokenAddrBySourceChainTokenAddr(
    sourceChainTokenAddr: string,
    sourceChainId: BigNumber | number
  ) {
    const srcChain: ChainInfo = this.state.supportedChains.find(
      (c) => c.chainId.toString() === sourceChainId.toString()
    )
    if (!srcChain) {
      throw new Error(
        `Source chain not configured/supported: ${srcChain} - ${sourceChainId} - supported: ${JSON.stringify(
          this.state.supportedChains.map((c) => c.chainId)
        )}`
      )
    }

    const srcChainTokenSymbol = srcChain.supportedAssets[sourceChainTokenAddr]

    const supportedAsset = Object.entries(this.options.ownSupportedAssets).find(
      ([address, tokenSymbol]) => {
        return tokenSymbol === srcChainTokenSymbol
      }
    )
    if (!supportedAsset) {
      throw new Error(
        `Asset ${srcChainTokenSymbol} on chain destinationChain not configured but possibly supported on-chain`
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
      if (
        await historyDataRepository.findOneBy({chainId: historyData.chainId})
      ) {
        await historyDataRepository.update(
          {chainId: historyData.chainId},
          historyData
        )
      } else {
        await historyDataRepository.save(historyData)
      }
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
