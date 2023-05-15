import { expect } from './setup'

/* External Imports */
import { ethers } from 'hardhat'
import {
  ContractFactory,
  Contract,
  Signer,
  BigNumber,
  Wallet,
  utils,
} from 'ethers'
import { orderBy } from 'lodash'

/* Imports: Artifacts */
import TeleportationJson from '@boba/contracts/artifacts/contracts/Teleportation.sol/Teleportation.json'
import L1ERC20Json from '@boba/contracts/artifacts/contracts/test-helpers/L1ERC20.sol/L1ERC20.json'

/* Imports: Interface */
import { ChainInfo } from '../src/utils/types'

/* Imports: Core */
import { TeleportationService } from '../src/service'
import { AppDataSource } from "../src/data-source";
import { HistoryData } from "../src/entity/HistoryData";

describe('teleportation', () => {
  let signer: Signer
  let signerAddr: string

  let wallet1: Wallet
  let address1: string

  let selectedBobaChains: ChainInfo[]
  const pollingInterval: number = 1000
  const blockRangePerPolling = 1000
  const dbPath = './db'

  before(async () => {
    await AppDataSource.initialize()
    // empty db
    await AppDataSource.manager.delete(HistoryData, {})

    ;[signer] = await ethers.getSigners()
    signerAddr = await signer.getAddress()
    wallet1 = ethers.Wallet.createRandom().connect(ethers.provider)
    address1 = wallet1.address
    await signer.sendTransaction({
      to: wallet1.address,
      value: ethers.utils.parseEther('100'),
    })
  })

  let Factory__Teleportation: ContractFactory
  let Teleportation: Contract

  let Factory__L2BOBA: ContractFactory
  let L2BOBA: Contract

  before(async () => {
    const chainId = (await ethers.provider.getNetwork()).chainId

    Factory__Teleportation = new ethers.ContractFactory(
      TeleportationJson.abi,
      TeleportationJson.bytecode,
      wallet1
    )
    Teleportation = await Factory__Teleportation.deploy()
    await Teleportation.deployTransaction.wait()

    Factory__L2BOBA = new ethers.ContractFactory(
      L1ERC20Json.abi,
      L1ERC20Json.bytecode,
      signer
    )
    L2BOBA = await Factory__L2BOBA.deploy(
      utils.parseEther('100000000000'),
      'BOBA',
      'BOBA',
      18
    )
    await L2BOBA.deployTransaction.wait()

    await L2BOBA.transfer(address1, utils.parseEther('100000000'))

    // intialize the teleportation contract
    await Teleportation.initialize(
      L2BOBA.address,
      utils.parseEther('1'),
      utils.parseEther('100')
    )
    // add the supported chain
    await Teleportation.addSupportedChain(chainId)

    // build payload
    selectedBobaChains = [
      {
        chainId,
        url: 'http://localhost:8545',
        provider: ethers.provider,
        testnet: true,
        name: 'localhost',
        teleportationAddress: Teleportation.address,
        height: 0,
        BobaTokenAddress: L2BOBA.address,
      },
    ]
  })

  const startTeleportationService = async () => {
    const chainId = (await ethers.provider.getNetwork()).chainId
    const teleportationService = new TeleportationService({
      l2RpcProvider: ethers.provider,
      chainId,
      teleportationAddress: Teleportation.address,
      bobaTokenAddress: L2BOBA.address,
      disburserWallet: wallet1,
      selectedBobaChains,
      pollingInterval,
      blockRangePerPolling,
    })
    return teleportationService
  }

  it('should create TeleportationService', async () => {
    const teleportationService = await startTeleportationService()
    await teleportationService.init()
  })

  describe('unit function tests', () => {
    it('should get an event from Teleportation contract', async () => {
      const chainId = (await ethers.provider.getNetwork()).chainId
      const teleportationService = await startTeleportationService()
      await teleportationService.init()

      const blockNumber = await ethers.provider.getBlockNumber()

      const events = await teleportationService._getEvents(
        Teleportation,
        Teleportation.filters.BobaReceived(),
        0,
        blockNumber
      )
      expect(events.length).to.be.eq(0)

      // deposit token
      await L2BOBA.approve(Teleportation.address, utils.parseEther('10'))
      await Teleportation.connect(signer).teleportBOBA(
        utils.parseEther('10'),
        chainId
      )

      const latestBlockNumber = await ethers.provider.getBlockNumber()
      const latestEvents = await teleportationService._getEvents(
        Teleportation,
        Teleportation.filters.BobaReceived(),
        0,
        latestBlockNumber
      )

      expect(latestEvents.length).to.be.eq(1)
      expect(latestEvents[0].args.sourceChainId).to.be.eq(chainId)
      expect(latestEvents[0].args.toChainId).to.be.eq(chainId)
      expect(latestEvents[0].args.depositId).to.be.eq(0)
      expect(latestEvents[0].args.emitter).to.be.eq(signerAddr)
      expect(latestEvents[0].args.amount).to.be.eq(utils.parseEther('10'))
    })

    it('should send a disbursement TX for a single event', async () => {
      const chainId = (await ethers.provider.getNetwork()).chainId
      const teleportationService = await startTeleportationService()
      await teleportationService.init()

      const blockNumber = await ethers.provider.getBlockNumber()
      const events = await teleportationService._getEvents(
        Teleportation,
        Teleportation.filters.BobaReceived(),
        0,
        blockNumber
      )

      let disbursement = []
      for (const event of events) {
        const sourceChainId = event.args.sourceChainId
        const depositId = event.args.depositId
        const amount = event.args.amount
        const emitter = event.args.emitter

        disbursement = [
          ...disbursement,
          {
            amount: amount.toString(),
            addr: emitter,
            depositId: depositId.toNumber(),
            sourceChainId: sourceChainId.toString(),
          },
        ]
      }

      disbursement = orderBy(disbursement, ['depositId'], ['asc'])

      const preBOBABalance = await L2BOBA.balanceOf(address1)
      const preSignerBOBABalance = await L2BOBA.balanceOf(signerAddr)

      await teleportationService._disburseTx(disbursement, chainId, blockNumber)

      const postBOBABalance = await L2BOBA.balanceOf(address1)
      const postSignerBOBABalance = await L2BOBA.balanceOf(signerAddr)

      expect(preBOBABalance.sub(postBOBABalance)).to.be.eq(
        utils.parseEther('10')
      )
      expect(postSignerBOBABalance.sub(preSignerBOBABalance)).to.be.eq(
        utils.parseEther('10')
      )
    })

    it('should block the disbursement TX if it is already disbursed', async () =>{
      const chainId = (await ethers.provider.getNetwork()).chainId
      const teleportationService = await startTeleportationService()
      await teleportationService.init()

      const blockNumber = await ethers.provider.getBlockNumber()
      const events = await teleportationService._getEvents(
        Teleportation,
        Teleportation.filters.BobaReceived(),
        0,
        blockNumber
      )

      let disbursement = []
      for (const event of events) {
        const sourceChainId = event.args.sourceChainId
        const depositId = event.args.depositId
        const amount = event.args.amount
        const emitter = event.args.emitter

        disbursement = [
          ...disbursement,
          {
            amount: amount.toString(),
            addr: emitter,
            depositId: depositId.toNumber(),
            sourceChainId: sourceChainId.toString(),
          },
        ]
      }

      disbursement = orderBy(disbursement, ['depositId'], ['asc'])

      const preBOBABalance = await L2BOBA.balanceOf(address1)
      const preSignerBOBABalance = await L2BOBA.balanceOf(signerAddr)

      await teleportationService._disburseTx(disbursement, chainId, blockNumber)

      const postBOBABalance = await L2BOBA.balanceOf(address1)
      const postSignerBOBABalance = await L2BOBA.balanceOf(signerAddr)

      expect(preBOBABalance).to.be.eq(postBOBABalance)
      expect(preSignerBOBABalance).to.be.eq(postSignerBOBABalance)
    })

    it('should get events from Teleportation contract', async () => {
      const chainId = (await ethers.provider.getNetwork()).chainId
      const teleportationService = await startTeleportationService()
      await teleportationService.init()

      const startBlockNumber = await ethers.provider.getBlockNumber()

      // deposit token
      for (let i = 0; i < 15; i++) {
        await L2BOBA.approve(Teleportation.address, utils.parseEther('10'))
        await Teleportation.connect(signer).teleportBOBA(
          utils.parseEther('10'),
          chainId
        )
      }

      const endBlockNumber = await ethers.provider.getBlockNumber()
      const latestEvents = await teleportationService._getEvents(
        Teleportation,
        Teleportation.filters.BobaReceived(),
        startBlockNumber,
        endBlockNumber
      )

      expect(latestEvents.length).to.be.eq(15)
    })

    it('should slice events into chunks and send disbursements', async () => {
      const chainId = (await ethers.provider.getNetwork()).chainId
      const teleportationService = await startTeleportationService()
      await teleportationService.init()

      const blockNumber = await ethers.provider.getBlockNumber()
      const events = await teleportationService._getEvents(
        Teleportation,
        Teleportation.filters.BobaReceived(),
        0,
        blockNumber
      )
      const lastDisbursement = await Teleportation.totalDisbursements(chainId)

      let disbursement = []
      for (const event of events) {
        const sourceChainId = event.args.sourceChainId
        const depositId = event.args.depositId
        const amount = event.args.amount
        const emitter = event.args.emitter

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
        }
      }

      disbursement = orderBy(disbursement, ['depositId'], ['asc'])

      const preBOBABalance = await L2BOBA.balanceOf(address1)
      const preSignerBOBABalance = await L2BOBA.balanceOf(signerAddr)
      const preBlockNumber = await ethers.provider.getBlockNumber()

      await teleportationService._disburseTx(disbursement, chainId, blockNumber)

      const postBOBABalance = await L2BOBA.balanceOf(address1)
      const postSignerBOBABalance = await L2BOBA.balanceOf(signerAddr)
      const postBlockNumber = await ethers.provider.getBlockNumber()

      expect(preBOBABalance.sub(postBOBABalance)).to.be.eq(
        utils.parseEther('150')
      )
      expect(postSignerBOBABalance.sub(preSignerBOBABalance)).to.be.eq(
        utils.parseEther('150')
      )
      expect(postBlockNumber - preBlockNumber).to.be.eq(4)
    })
  })

  describe('global tests', () => {
    it('should watch Teleportation contract', async () => {
      const chainId = (await ethers.provider.getNetwork()).chainId
      const teleportationService = await startTeleportationService()
      await teleportationService.init()

      // deposit token
      await L2BOBA.approve(Teleportation.address, utils.parseEther('11'))
      await Teleportation.connect(signer).teleportBOBA(
        utils.parseEther('11'),
        chainId
      )

      // check events
      const latestBlock = await ethers.provider.getBlockNumber()
      const depositTeleportations = {
        Teleportation,
        chainId,
        totalDeposits: BigNumber.from('0'),
        totalDisbursements: BigNumber.from('0'),
        height: 0,
      }
      const events = await teleportationService._watchTeleportation(
        depositTeleportations,
        latestBlock
      )
      expect(events.length).to.be.eq(2)
      expect(events[1].args.sourceChainId).to.be.eq(chainId)
      expect(events[1].args.toChainId).to.be.eq(chainId)
      expect(events[1].args.depositId).to.be.eq(16)
      expect(events[1].args.emitter).to.be.eq(signerAddr)
      expect(events[1].args.amount).to.be.eq(utils.parseEther('11'))
    })

    it('should disburse BOBA token for a single event', async () => {
      const chainId = (await ethers.provider.getNetwork()).chainId
      const teleportationService = await startTeleportationService()
      await teleportationService.init()

      const latestBlock = await ethers.provider.getBlockNumber()
      const depositTeleportations = {
        Teleportation,
        chainId,
        totalDeposits: BigNumber.from('0'),
        totalDisbursements: BigNumber.from('0'),
        height: 0,
      }
      const events = await teleportationService._watchTeleportation(
        depositTeleportations,
        latestBlock
      )

      const preBOBABalance = await L2BOBA.balanceOf(address1)
      await teleportationService._disburseTeleportation(
        depositTeleportations,
        events,
        0
      )
      const postBOBABalance = await L2BOBA.balanceOf(address1)
      expect(preBOBABalance.sub(postBOBABalance)).to.be.eq(
        utils.parseEther('11')
      )

      // should not relay twice
      await teleportationService._disburseTeleportation(
        depositTeleportations,
        events,
        latestBlock
      )
      const BOBABalance = await L2BOBA.balanceOf(address1)
      expect(BOBABalance).to.be.eq(postBOBABalance)

      // should store the latest block
      const storedBlock = await teleportationService._getDepositInfo(chainId)
      expect(storedBlock).to.be.eq(latestBlock)
    }).retries(3)

    it('should get all BobaReceived events', async () => {
      const chainId = (await ethers.provider.getNetwork()).chainId
      const teleportationService = await startTeleportationService()
      await teleportationService.init()

      // deposit token
      await L2BOBA.approve(Teleportation.address, utils.parseEther('100'))
      for (let i = 0; i < 11; i++) {
        await Teleportation.connect(signer).teleportBOBA(
          utils.parseEther('1'),
          chainId
        )
      }

      // check events
      const latestBlock = await ethers.provider.getBlockNumber()
      const depositTeleportations = {
        Teleportation,
        chainId,
        totalDeposits: BigNumber.from('0'),
        totalDisbursements: BigNumber.from('0'),
        height: 0,
      }
      const events = await teleportationService._watchTeleportation(
        depositTeleportations,
        latestBlock
      )
      expect(events.length).to.be.eq(12)
    })

    it('should disburse BOBA token for all events', async () => {
      const chainId = (await ethers.provider.getNetwork()).chainId
      const teleportationService = await startTeleportationService()
      await teleportationService.init()

      const latestBlock = await ethers.provider.getBlockNumber()
      const depositTeleportations = {
        Teleportation,
        chainId,
        totalDeposits: BigNumber.from('0'),
        totalDisbursements: BigNumber.from('0'),
        height: 0,
      }
      const events = await teleportationService._watchTeleportation(
        depositTeleportations,
        latestBlock
      )

      const preBOBABalance = await L2BOBA.balanceOf(address1)
      await teleportationService._disburseTeleportation(
        depositTeleportations,
        events,
        0
      )
      const postBOBABalance = await L2BOBA.balanceOf(address1)
      expect(preBOBABalance.sub(postBOBABalance)).to.be.eq(
        utils.parseEther('11')
      )

      // should not relay twice
      await teleportationService._disburseTeleportation(
        depositTeleportations,
        events,
        latestBlock
      )
      const BOBABalance = await L2BOBA.balanceOf(address1)
      expect(BOBABalance).to.be.eq(postBOBABalance)

      // should store the latest block
      const storedBlock = await teleportationService._getDepositInfo(chainId)
      expect(storedBlock).to.be.eq(latestBlock)
    }).retries(3)

    it('should not disburse BOBA token if the data is reset', async () => {

      const chainId = (await ethers.provider.getNetwork()).chainId
      const teleportationService = await startTeleportationService()
      await teleportationService.init()

      await AppDataSource.manager.delete(HistoryData, { chainId })

      const latestBlock = await ethers.provider.getBlockNumber()
      const depositTeleportations = {
        Teleportation,
        chainId,
        totalDeposits: BigNumber.from('0'),
        totalDisbursements: BigNumber.from('0'),
        height: 0,
      }
      const events = await teleportationService._watchTeleportation(
        depositTeleportations,
        latestBlock
      )

      const preBOBABalance = await L2BOBA.balanceOf(address1)
      await teleportationService._disburseTeleportation(
        depositTeleportations,
        events,
        0
      )
      const postBOBABalance = await L2BOBA.balanceOf(address1)
      expect(preBOBABalance.sub(postBOBABalance)).to.be.eq(0)
    })
  })
})
