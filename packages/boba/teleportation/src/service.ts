/* Imports: External */
import { Contract, Wallet, BigNumber, providers, EventFilter } from 'ethers'
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

  // Address of the L2 BOBA token
  bobaTokenAddress: string

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
    // This is only for Mainnet and Goerli L2s
    BOBAToken: Contract
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

    this.logger.info('Connecting to BOBAToken contract...')
    this.state.BOBAToken = getContractFactory('L2StandardERC20')
      .attach(this.options.bobaTokenAddress)
      .connect(this.options.disburserWallet)
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
        // search BobaReceived events
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
      this.state.Teleportation.filters.BobaReceived(),
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
        const sourceChainId = event.args.sourceChainId
        const depositId = event.args.depositId
        const amount = event.args.amount
        const emitter = event.args.emitter

        // we disburse tokens only if depositId is greater or equal to the last disbursement
        if (depositId.gte(lastDisbursement)) {
          disbursement = [
            ...disbursement,
            {
              amount: amount.toString(),
              addr: emitter,
              depositId: depositId.toNumber(),
              sourceChainId: sourceChainId.toString(),
            },
          ]
          this.logger.info(
            `Found a new deposit - sourceChainId: ${sourceChainId.toString()} - depositId: ${depositId.toNumber()} - amount: ${amount.toString()} - emitter: ${emitter}`
          )
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
        const totalDisbursements = slicedDisbursement.reduce((acc, cur) => {
          return acc.add(BigNumber.from(cur.amount))
        }, BigNumber.from('0'))
        if (this.options.bobaTokenAddress !== bobaTokenAddressOnAltL2s) {
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
