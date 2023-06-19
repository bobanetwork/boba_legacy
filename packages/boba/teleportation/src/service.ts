/* Imports: External */
import {
  Contract,
  Wallet,
  BigNumber,
  providers,
  EventFilter,
  constants as ethersConstants,
} from 'ethers'
import { orderBy } from 'lodash'
import fs, { promises as fsPromise } from 'fs'
import path from 'path'

/* Imports: Internal */
import { sleep } from '@eth-optimism/core-utils'
import { BaseService } from '@eth-optimism/common-ts'
import { getContractFactory } from '@eth-optimism/contracts'
import { getBobaContractAt } from '@boba/contracts'

/* Imports: Interface */
import { ChainInfo, DepositTeleportations, Disbursement } from './utils/types'

interface TeleportationOptions {
  l2RpcProvider: providers.StaticJsonRpcProvider

  // chainId of the L2 network
  chainId: number

  // Address of the teleportation contract
  teleportationAddress: string

  // Wallet
  disburserWallet: Wallet

  selectedBobaChains: ChainInfo[]

  pollingInterval: number

  blockRangePerPolling: number

  dbPath: string
}

const optionSettings = {}
const bobaTokenAddressOnAltL2s = '0x4200000000000000000000000000000000000006'

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
    const events = await this._getEvents(
      depositTeleportation.Teleportation,
      this.state.Teleportation.filters.AssetReceived(),
      lastBlock,
      latestBlock
    )
    return events
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
      this._putDepositInfo(chainId, latestBlock)
    } else {
      const lastDisbursement =
        await this.state.Teleportation.totalDisbursements(chainId)
      // eslint-disable-next-line prefer-const
      let disbursement = []

      for (const event of events) {
        const sourceChainId: BigNumber = event.args.sourceChainId
        const depositId = event.args.depositId
        const amount = event.args.amount
        const sourceChainTokenAddr = event.args.token
        const emitter = event.args.emitter

        // we disburse tokens only if depositId is greater or equal to the last disbursement
        if (depositId.gte(lastDisbursement)) {
          try {
            const receivingChainTokenAddr = this._getSupportedAssetBySymbol(
              sourceChainTokenAddr,
              sourceChainId.toNumber(),
              chainId,
              this.state.supportedChains
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
              disbursement = [
                ...disbursement,
                {
                  token: receivingChainTokenAddr, // token mapping for correct routing as addresses different on every network
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
          } catch (e) {
            this.logger.error(e.message)
            // TODO: Add recovery mechanism
            // TODO: Save somewhere to recover(!) or generally fail (do once db teleporter is merged)
            // TODO: for both when getSupportedAssetBySymbol fails or when onchain support is missing
          }
        }
      }

      // sort disbursement
      disbursement = orderBy(disbursement, ['depositId'], ['asc'])
      // disbure the token
      await this._disburseTx(disbursement, chainId, latestBlock)
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
        // do separate approves if necessary
        for (const token of tokens.entries()) {
          // ignore native
          if (token[0] !== ethersConstants.AddressZero) {
            const approveTx = await this.getConnectedTokenContract(
              token[0]
            ).approve(this.state.Teleportation.address, token[1])
            approvePending.push(approveTx.wait())
          }
        }
        await Promise.all(approvePending)

        const disburseTx = await this.state.Teleportation.disburseAsset(
          slicedDisbursement
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
      this._putDepositInfo(chainId, latestBlock)
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

  _getSupportedAssetBySymbol(
    sourceChainTokenAddr: string,
    sourceChainId: number,
    destChainId: number,
    supportedChains: ChainInfo[]
  ) {
    const sourceChain: ChainInfo = supportedChains.find(
      (c) => c.chainId === sourceChainId
    )
    const destChain: ChainInfo = supportedChains.find(
      (c) => c.chainId === destChainId
    )
    if (!destChain || !sourceChain) {
      throw new Error(
        `Either destination or source chain not configured/supported: ${destChain} (dest), ${sourceChain} (source)`
      )
    }

    const receivingChainTokenSymbol =
      sourceChain.supportedAssets[sourceChainTokenAddr]
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
    const dumpsPath = path.resolve(__dirname, this.options.dbPath)
    if (!fs.existsSync(dumpsPath)) {
      fs.mkdirSync(dumpsPath)
    }
    try {
      const addrsPath = path.resolve(dumpsPath, `depositInfo-${chainId}.json`)
      await fsPromise.writeFile(addrsPath, JSON.stringify({ latestBlock }))
    } catch (error) {
      this.logger.error(`Failed to put depositInfo! - ${error}`)
    }
  }

  async _getDepositInfo(chainId: number | string): Promise<any> {
    const dumpsPath = path.resolve(
      __dirname,
      `${this.options.dbPath}/depositInfo-${chainId}.json`
    )
    if (fs.existsSync(dumpsPath)) {
      const historyJsonRaw = await fsPromise.readFile(dumpsPath)
      const historyJSON = JSON.parse(historyJsonRaw.toString())
      if (historyJSON.latestBlock) {
        return historyJSON.latestBlock
      } else {
        throw new Error("Can't find latestBlock in depositInfo")
      }
    }
    throw new Error("Can't find latestBlock in depositInfo")
  }
}
