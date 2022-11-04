/* Imports: External */
import { Contract, Wallet, BigNumber, providers, EventFilter } from 'ethers'
import { LevelUp } from 'levelup'
import level from 'level'
import { orderBy } from 'lodash'

/* Imports: Internal */
import { sleep } from '@eth-optimism/core-utils'
import { BaseService } from '@eth-optimism/common-ts'

/* Imports: Artifacts */
import TeleportationJson from '@boba/contracts/artifacts/contracts/Teleportation.sol/Teleportation.json'
import L2StandardERC20Json from '@eth-optimism/contracts/artifacts/contracts/standards/L2StandardERC20.sol/L2StandardERC20.json'

/* Imports: Interface */
import { ChainInfo, DepositTeleportations, Disbursement } from './utils/types'

/* Imports: Config */
import { BobaChains } from './utils/chains'

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

  eventPerPollingInterval: number

  dbPath: string
}

const optionSettings = {}

export class TeleportationService extends BaseService<TeleportationOptions> {
  constructor(options: TeleportationOptions) {
    super('Teleportation', options, optionSettings)
  }

  private state: {
    db: LevelUp
    Teleportation: Contract
    // This is only for Mainnet and Goerli L2s
    BOBAToken: Contract
    // the chain is registered in the teleportation contract
    supportedChains: ChainInfo[]
    // the contract of the chain that users deposit token
    depositTeleportations: DepositTeleportations[]
  }

  protected async _init(): Promise<void> {
    this.logger.info('Initializing teleportation service...', {
      options: this.options,
    })

    this.state.db = level(this.options.dbPath)
    await this.state.db.open()

    this.logger.info('Connecting to Teleportation contract...')
    this.state.Teleportation = new Contract(
      this.options.teleportationAddress,
      TeleportationJson.abi,
      this.options.disburserWallet
    )
    this.logger.info('Connected to Teleportation', {
      address: this.state.Teleportation.address,
    })

    this.logger.info('Connecting to BOBAToken contract...')
    this.state.BOBAToken = new Contract(
      BobaChains[this.options.chainId].tokenAddress,
      L2StandardERC20Json.abi,
      this.options.disburserWallet
    )
    this.logger.info('Connected to BOBAToken', {
      address: this.state.BOBAToken.address,
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
    for (const chain of this.options.selectedBobaChains) {
      const chainId = chain.chainId
      const isSupported = await this.state.Teleportation.supportChains(chainId)
      if (!isSupported) {
        throw new Error(
          `Chain ${chainId} is not supported by the contract ${this.state.Teleportation.address}`
        )
      } else {
        this.state.supportedChains.push(chain)
        const depositTeleportation = new Contract(
          chain.teleportationAddress,
          TeleportationJson.abi,
          new providers.StaticJsonRpcProvider(chain.url)
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
      await sleep(this.options.pollingInterval)
      for (const depositTeleportation of this.state.depositTeleportations) {
        // search BobaReceived events
        const latestBlock =
          await depositTeleportation.Teleportation.provider.getBlockNumber()
        const events = await this._watchTeleportation(
          depositTeleportation,
          latestBlock
        )
        await this._disbureTeleportation(
          depositTeleportation,
          events,
          latestBlock
        )
      }
    }
  }

  protected async _watchTeleportation(
    depositTeleportation: DepositTeleportations,
    latestBlock: number
  ): Promise<any> {
    let lastBlock: number
    let lastDisbursement: BigNumber
    const chainId = depositTeleportation.chainId.toString()
    try {
      const depositInfo = JSON.parse(await this.state.db.get(chainId))
      lastBlock = depositInfo.lastBlock
      lastDisbursement = BigNumber.from(depositInfo.lastDisbursement)
    } catch (e) {
      this.logger.warn(`No deposit info found ${chainId}`)
      lastBlock = depositTeleportation.height
      lastDisbursement = await this.state.Teleportation.totalDisbursements(
        chainId
      )
      // store the new deposit info
      await this._putDepositInfo(chainId, lastBlock, lastDisbursement)
    }
    const events = await this._getEvents(
      this.state.Teleportation.filters.BobaReceived(),
      lastBlock,
      latestBlock
    )
    return events
  }

  protected async _disbureTeleportation(
    depositTeleportation: DepositTeleportations,
    events: any,
    latestBlock: number
  ): Promise<void> {
    const chainId = depositTeleportation.chainId
    // parse events
    if (events.length === 0) {
      // update the deposit info if no events are found
      this._updateLatestBlockInDepositInfo(chainId, latestBlock)
    } else {
      const lastDisbursement =
        await this.state.Teleportation.totalDisbursements(chainId)
      // eslint-disable-next-line prefer-const
      let disbursement: Disbursement[]

      for (const event of events) {
        const sourceChainId = event.args.sourceChainId
        const depositId = event.args.depositId
        const amount = event.args.amount
        const emitter = event.args.emitter
        // two cases:
        // 1. the lastDisbursement is 0 and depositId is 0
        // this mean that we have not disbursed any token yet
        // 2. the lastDisbursement is not 0 and depositId is not 0
        // we need to make sure that lastDisbursement is smaller than depositId
        // if not, we need to skip this process
        if (
          (lastDisbursement.eq(0) && depositId.eq(0)) ||
          depositId.gt(lastDisbursement)
        ) {
          disbursement.push({
            amount: amount.toString(),
            addr: emitter,
            depositId: depositId.toString(),
            sourceChainId: sourceChainId.toString(),
          })
        }
      }

      // sort disbursement
      disbursement = orderBy(disbursement, ['depositId'], ['asc'])
      // disbure the token
      await this._disburseTx(disbursement, chainId, latestBlock)
    }
  }

  protected async _disburseTx(
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
        const totalDisbursements = slicedDisbursement.reduce((acc, cur) => {
          return acc.add(BigNumber.from(cur.amount))
        }, BigNumber.from('0'))
        if (this.options.chainId === 288 || this.options.chainId === 2888) {
          // approve BOBA token
          const approveTx = await this.state.BOBAToken.approve(
            this.state.Teleportation.address,
            totalDisbursements
          )
          await approveTx.wait()
          const disburseTx = await this.state.Teleportation.disburseBOBA(
            slicedDisbursement
          )
          await disburseTx.wait()
        } else {
          const disburseTx = await this.state.Teleportation.disburseNativeBOBA(
            slicedDisbursement,
            { value: totalDisbursements }
          )
          await disburseTx.wait()
        }
        sliceStart = sliceEnd
        sliceEnd = Math.min(sliceEnd + 10, numberOfDisbursement)
      }
      this._updateLatestBlockInDepositInfo(chainId, latestBlock)
    } catch (e) {
      this.logger.error(e)
    }
  }

  // get events from the contract
  protected async _getEvents(
    event: EventFilter,
    fromBlock: number,
    toBlock: number
  ): Promise<any> {
    let events = []
    let startBlock = fromBlock
    while (startBlock < toBlock) {
      const endBlock = Math.min(
        startBlock + this.options.eventPerPollingInterval,
        toBlock
      )
      const partialEvents = await this.state.Teleportation.queryFilter(
        event,
        startBlock,
        endBlock
      )
      events = [...events, ...partialEvents]
      startBlock = endBlock
    }
    return events
  }

  protected async _putDepositInfo(
    chainId: number | string,
    latestBlock: number,
    lastDisbursement: BigNumber
  ): Promise<void> {
    await this.state.db.put(
      chainId.toString(),
      JSON.stringify({
        latestBlock,
        lastDisbursement: lastDisbursement.toString(),
      })
    )
  }

  protected async _updateLatestBlockInDepositInfo(
    chainId: number,
    latestBlock: number
  ): Promise<void> {
    try {
      const depositInfo = JSON.parse(await this.state.db.get(chainId))
      const lastDisbursement = BigNumber.from(depositInfo.lastDisbursement)
      await this._putDepositInfo(chainId, latestBlock, lastDisbursement)
    } catch (e) {
      this.logger.warn(`No deposit info found ${chainId}`)
    }
  }

  protected async _updateLastDisbursementInDepositInfo(
    chainId: number,
    lastDisbursement: BigNumber
  ): Promise<void> {
    try {
      const depositInfo = JSON.parse(await this.state.db.get(chainId))
      const latestBlock = depositInfo.latestBlock
      await this._putDepositInfo(chainId, latestBlock, lastDisbursement)
    } catch (e) {
      this.logger.warn(`No deposit info found ${chainId}`)
    }
  }
}
