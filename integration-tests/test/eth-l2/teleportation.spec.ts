import { expect } from '@boba/teleportation/test/setup'

/* External Imports */
import { ethers } from 'hardhat'
import {
  BigNumber,
  Contract,
  ContractFactory,
  Signer,
  utils,
  Wallet,
} from 'ethers'
import { orderBy } from 'lodash'

/* Imports: Artifacts */
import TeleportationJson from '@boba/contracts/artifacts/contracts/Teleportation.sol/Teleportation.json'
import L1ERC20Json from '@boba/contracts/artifacts/contracts/test-helpers/L1ERC20.sol/L1ERC20.json'

/* Imports: Interface */
import { ChainInfo } from '@boba/teleportation/src/utils/types'

/* Imports: Core */
import { TeleportationService } from '@boba/teleportation/src/service'
import {
  AppDataSource,
  historyDataRepository,
} from '@boba/teleportation/src/data-source'
import { OptimismEnv } from './shared/env'
import { getContractFactory, predeploys } from '@eth-optimism/contracts'

describe('teleportation', () => {
  let env: OptimismEnv
  let signer: Signer
  let signerAddr: string

  let wallet1: Wallet
  let address1: string

  let selectedBobaChains: ChainInfo[]
  let selectedBobaChainsBnb: ChainInfo[]
  const pollingInterval: number = 1000
  const blockRangePerPolling = 1000

  const defaultMinDepositAmount = utils.parseEther('1')
  const defaultMaxDepositAmount = utils.parseEther('100')
  const defaultMaxTransferPerDay = utils.parseEther('100000')

  before(async () => {
    env = await OptimismEnv.new()
    await AppDataSource.initialize()
    await AppDataSource.synchronize(true) // drops database and recreates

    signer = env.l2Wallet
    signerAddr = await signer.getAddress()
    wallet1 = env.l2Wallet_2
    address1 = wallet1.address

    await signer.sendTransaction({
      to: wallet1.address,
      value: ethers.utils.parseEther('100'),
    })
  })

  let chainId: number
  let chainIdBnb: number
  let Factory__Teleportation: ContractFactory
  let Teleportation: Contract
  let TeleportationBNB: Contract

  let Factory__L2BOBA: ContractFactory
  let L2BOBA: Contract
  let L2BobaOnBobaBnb: Contract
  let L2BNBOnBobaEth: Contract

  before(async () => {
    chainId = (await ethers.provider.getNetwork()).chainId
    chainIdBnb = chainId + 1

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
      defaultMinDepositAmount,
      defaultMaxDepositAmount
    )
    // add the supported chain & token
    await Teleportation.addSupportedChain(chainId)
    await Teleportation.addSupportedToken(
      L2BOBA.address,
      defaultMinDepositAmount,
      defaultMaxDepositAmount,
      defaultMaxTransferPerDay
    )

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
        supportedAssets: {
          [L2BOBA.address]: 'BOBA',
          [ethers.constants.AddressZero]: 'ETH',
        },
      },
      // bnb will be added in routing tests to have cleaner before hooks
    ]
    selectedBobaChainsBnb = selectedBobaChains
  })

  const startTeleportationService = async (useBnb?: boolean) => {
    const chainIdToUse = useBnb ? chainIdBnb : chainId
    return new TeleportationService({
      l2RpcProvider: ethers.provider,
      chainId: chainIdToUse,
      teleportationAddress: useBnb
        ? TeleportationBNB.address
        : Teleportation.address,
      disburserWallet: wallet1,
      selectedBobaChains: useBnb ? selectedBobaChainsBnb : selectedBobaChains,
      // only defined one other for the routing tests (so idx 0 = own origin network)
      originSupportedAssets: useBnb
        ? selectedBobaChains[0].supportedAssets
        : selectedBobaChainsBnb[0].supportedAssets,
      pollingInterval,
      blockRangePerPolling,
    })
  }

  it('should create TeleportationService', async () => {
    const teleportationService = await startTeleportationService()
    await teleportationService.init()
  })

  describe('unit function tests', () => {
    it('should get an event from Teleportation contract', async () => {
      const teleportationService = await startTeleportationService()
      await teleportationService.init()

      const blockNumber = await ethers.provider.getBlockNumber()

      const events = await teleportationService._getEvents(
        Teleportation,
        Teleportation.filters.AssetReceived(),
        0,
        blockNumber
      )
      expect(events.length).to.be.eq(0)

      // deposit token
      await L2BOBA.approve(Teleportation.address, utils.parseEther('10'))
      await Teleportation.connect(signer).teleportAsset(
        L2BOBA.address,
        utils.parseEther('10'),
        chainId
      )

      const latestBlockNumber = await ethers.provider.getBlockNumber()
      const latestEvents = await teleportationService._getEvents(
        Teleportation,
        Teleportation.filters.AssetReceived(),
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
      const teleportationService = await startTeleportationService()
      await teleportationService.init()

      const blockNumber = await ethers.provider.getBlockNumber()
      const events = await teleportationService._getEvents(
        Teleportation,
        Teleportation.filters.AssetReceived(),
        0,
        blockNumber
      )

      expect(events.length).to.be.gt(0, 'Event length must be greater than 0')

      let disbursement = []
      for (const event of events) {
        const sourceChainId = event.args.sourceChainId
        const depositId = event.args.depositId
        const amount = event.args.amount
        const token = event.args.token
        const emitter = event.args.emitter

        disbursement = [
          ...disbursement,
          {
            token,
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

      const amountDisbursements = await Teleportation.connect(
        signer
      ).totalDisbursements(chainId)

      expect(amountDisbursements).to.be.eq(1)
    })

    it('should block the disbursement TX if it is already disbursed', async () => {
      const teleportationService = await startTeleportationService()
      await teleportationService.init()

      const blockNumber = await ethers.provider.getBlockNumber()
      const events = await teleportationService._getEvents(
        Teleportation,
        Teleportation.filters.AssetReceived(),
        0,
        blockNumber
      )

      let disbursement = []
      for (const event of events) {
        const sourceChainId = event.args.sourceChainId
        const depositId = event.args.depositId
        const amount = event.args.amount
        const emitter = event.args.emitter
        const token = event.args.token

        disbursement = [
          ...disbursement,
          {
            token,
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
      const teleportationService = await startTeleportationService()
      await teleportationService.init()

      const startBlockNumber = await ethers.provider.getBlockNumber()

      // deposit token
      for (let i = 0; i < 15; i++) {
        await L2BOBA.approve(Teleportation.address, utils.parseEther('10'))
        await Teleportation.connect(signer).teleportAsset(
          L2BOBA.address,
          utils.parseEther('10'),
          chainId
        )
      }

      const endBlockNumber = await ethers.provider.getBlockNumber()
      const latestEvents = await teleportationService._getEvents(
        Teleportation,
        Teleportation.filters.AssetReceived(),
        startBlockNumber,
        endBlockNumber
      )

      expect(latestEvents.length).to.be.eq(15)
    })

    it('should slice events into chunks and send disbursements', async () => {
      const teleportationService = await startTeleportationService()
      await teleportationService.init()

      const blockNumber = await ethers.provider.getBlockNumber()
      const events = await teleportationService._getEvents(
        Teleportation,
        Teleportation.filters.AssetReceived(),
        0,
        blockNumber
      )
      const lastDisbursement = await Teleportation.totalDisbursements(chainId)

      let disbursement = []
      for (const event of events) {
        const token = event.args.token
        const sourceChainId = event.args.sourceChainId
        const depositId = event.args.depositId
        const amount = event.args.amount
        const emitter = event.args.emitter

        if (depositId.gte(lastDisbursement)) {
          disbursement = [
            ...disbursement,
            {
              token,
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
      const teleportationService = await startTeleportationService()
      await teleportationService.init()

      // deposit token
      await L2BOBA.approve(Teleportation.address, utils.parseEther('11'))
      await Teleportation.connect(signer).teleportAsset(
        L2BOBA.address,
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
      expect(events[1].args.token).to.be.eq(L2BOBA.address)
      expect(events[1].args.sourceChainId).to.be.eq(chainId)
      expect(events[1].args.toChainId).to.be.eq(chainId)
      expect(events[1].args.depositId).to.be.eq(16)
      expect(events[1].args.emitter).to.be.eq(signerAddr)
      expect(events[1].args.amount).to.be.eq(utils.parseEther('11'))
    })

    it('should disburse BOBA token for a single event', async () => {
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

    it('should get all AssetReceived events', async () => {
      const teleportationService = await startTeleportationService()
      await teleportationService.init()

      // deposit token
      await L2BOBA.approve(Teleportation.address, utils.parseEther('100'))
      for (let i = 0; i < 11; i++) {
        await Teleportation.connect(signer).teleportAsset(
          L2BOBA.address,
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
      const teleportationService = await startTeleportationService()
      await teleportationService.init()

      await historyDataRepository.delete({ chainId })

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

  describe('asset routing', () => {
    before(async () => {
      TeleportationBNB = await Factory__Teleportation.deploy()
      await Teleportation.deployTransaction.wait()

      // deploy other token for routing tests
      L2BobaOnBobaBnb = await Factory__L2BOBA.deploy(
        utils.parseEther('100000000000'),
        'BOBA',
        'BOBA',
        18
      )
      await L2BobaOnBobaBnb.deployTransaction.wait()
      await L2BobaOnBobaBnb.transfer(address1, utils.parseEther('100000000'))

      // deploy other token for routing tests
      L2BNBOnBobaEth = await Factory__L2BOBA.deploy(
        utils.parseEther('100000000000'),
        'BNB',
        'BNB',
        18
      )
      await L2BNBOnBobaEth.deployTransaction.wait()
      await L2BNBOnBobaEth.transfer(address1, utils.parseEther('100000000'))

      // intialize the teleportation contract
      await TeleportationBNB.initialize(
        defaultMinDepositAmount,
        defaultMaxDepositAmount
      )

      // add the supported chain & token
      await TeleportationBNB.addSupportedChain(chainId)
      await TeleportationBNB.addSupportedToken(
        L2BobaOnBobaBnb.address,
        defaultMinDepositAmount,
        defaultMaxDepositAmount,
        defaultMaxTransferPerDay
      )

      // add support on previous network
      await Teleportation.addSupportedChain(chainIdBnb)
      await Teleportation.addSupportedToken(
        L2BNBOnBobaEth.address,
        defaultMinDepositAmount,
        defaultMaxDepositAmount,
        defaultMaxTransferPerDay
      )

      console.log(
        `Teleportation on ETH: ${Teleportation.address} / on BNB: ${TeleportationBNB.address}`
      )

      // mock BNB network & overwrite prev network
      selectedBobaChains = [
        {
          chainId: chainIdBnb,
          url: 'http://localhost:8545',
          provider: ethers.provider,
          testnet: true,
          name: 'localhost:bnb',
          teleportationAddress: TeleportationBNB.address,
          height: 0,
          supportedAssets: {
            [L2BobaOnBobaBnb.address]: 'BOBA',
            [ethers.constants.AddressZero]: 'BNB', // simulate BNB for native to token teleport
          },
        },
      ]
      selectedBobaChainsBnb = [
        {
          chainId,
          url: 'http://localhost:8545',
          provider: ethers.provider,
          testnet: true,
          name: 'localhost',
          teleportationAddress: Teleportation.address,
          height: 0,
          supportedAssets: {
            [L2BOBA.address]: 'BOBA',
            [ethers.constants.AddressZero]: 'ETH',
            [L2BNBOnBobaEth.address]: 'BNB',
          },
        },
      ]
    })

    it('teleport BOBA as token from chain A (e.g. BNB) to chain B (ETH)', async () => {
      const teleportationServiceBnb = await startTeleportationService(true)
      await teleportationServiceBnb.init()

      // deposit token
      const preBlockNumber = await ethers.provider.getBlockNumber()
      await L2BobaOnBobaBnb.connect(signer).approve(
        TeleportationBNB.address,
        utils.parseEther('10')
      )
      await TeleportationBNB.connect(signer).teleportAsset(
        L2BobaOnBobaBnb.address,
        utils.parseEther('10'),
        chainId // toChainId
      )

      const blockNumber = await ethers.provider.getBlockNumber()
      const events = await teleportationServiceBnb._getEvents(
        TeleportationBNB,
        TeleportationBNB.filters.AssetReceived(),
        preBlockNumber,
        blockNumber
      )

      expect(events.length).to.be.gt(0, 'Event length must be greater than 0')

      let disbursement = []
      for (const event of events) {
        const sourceChainId = chainIdBnb // event.args.sourceChainId.toNumber() -> (is correct, but we were mocking a fake chainId for testing)
        const depositId = event.args.depositId
        const amount = event.args.amount
        const token = event.args.token
        const emitter = event.args.emitter

        const receivingChainTokenAddr =
          teleportationServiceBnb._getSupportedDestChainTokenAddrBySourceChainTokenAddr(
            token,
            sourceChainId,
            chainId
          )
        expect(receivingChainTokenAddr).to.be.eq(
          L2BOBA.address,
          'BOBA token address on BNB not correctly routed'
        )

        disbursement = [
          ...disbursement,
          {
            token: receivingChainTokenAddr,
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

      const teleportationServiceEth = await startTeleportationService(false)
      await teleportationServiceEth.init()

      await teleportationServiceEth._disburseTx(
        disbursement,
        chainId,
        blockNumber
      )

      const postBOBABalance = await L2BOBA.balanceOf(address1)
      const postSignerBOBABalance = await L2BOBA.balanceOf(signerAddr)

      expect(preBOBABalance.sub(postBOBABalance)).to.be.eq(
        utils.parseEther('10')
      )
      expect(postSignerBOBABalance.sub(preSignerBOBABalance)).to.be.eq(
        utils.parseEther('10')
      )
    })

    it('teleport BNB as native from chain B (e.g. BNB) to chain A (ETH) as wrapped token', async () => {
      const teleportationService = await startTeleportationService(true)
      await teleportationService.init()

      // deposit token
      const preBlockNumber = await ethers.provider.getBlockNumber()
      await TeleportationBNB.connect(signer).teleportAsset(
        ethers.constants.AddressZero, // send native BNB
        utils.parseEther('10'),
        chainId, // toChainId
        { value: utils.parseEther('10') }
      )

      const blockNumber = await ethers.provider.getBlockNumber()
      const events = await teleportationService._getEvents(
        TeleportationBNB,
        TeleportationBNB.filters.AssetReceived(),
        preBlockNumber,
        blockNumber
      )

      expect(events.length).to.be.gt(0, 'Event length must be greater than 0')

      let disbursement = []
      for (const event of events) {
        const sourceChainId = chainIdBnb // event.args.sourceChainId.toNumber() -> (is correct, but we were mocking a fake chainId for testing)
        const depositId = event.args.depositId
        const amount = event.args.amount
        const token = event.args.token
        const emitter = event.args.emitter

        const receivingChainTokenAddr =
          teleportationService._getSupportedDestChainTokenAddrBySourceChainTokenAddr(
            token,
            sourceChainId,
            chainId
          )
        expect(receivingChainTokenAddr).to.be.eq(
          L2BNBOnBobaEth.address,
          'BNB token address on Boba ETH not correctly routed'
        )

        disbursement = [
          ...disbursement,
          {
            token: receivingChainTokenAddr,
            amount: amount.toString(),
            addr: emitter,
            depositId: depositId.toNumber(),
            sourceChainId: sourceChainId.toString(),
          },
        ]
      }

      disbursement = orderBy(disbursement, ['depositId'], ['asc'])

      const preBNBBalance = await L2BNBOnBobaEth.balanceOf(address1)
      const preSignerBNBBalance = await L2BNBOnBobaEth.balanceOf(signerAddr)

      const teleportationServiceEth = await startTeleportationService(false)
      await teleportationServiceEth.init()

      await teleportationServiceEth._disburseTx(
        disbursement,
        chainId,
        blockNumber
      )

      const postBNBBalance = await L2BNBOnBobaEth.balanceOf(address1)
      const postSignerBNBBalance = await L2BNBOnBobaEth.balanceOf(signerAddr)

      expect(preBNBBalance.sub(postBNBBalance)).to.be.eq(utils.parseEther('10'))
      expect(postSignerBNBBalance.sub(preSignerBNBBalance)).to.be.eq(
        utils.parseEther('10')
      )
    })

    it('teleport BNB as token from chain A (ETH) to chain B (e.g. BNB) as native asset', async () => {
      const teleportationService = await startTeleportationService(false)
      await teleportationService.init()

      // deposit token
      const preBlockNumber = await ethers.provider.getBlockNumber()

      await L2BNBOnBobaEth.approve(
        Teleportation.address,
        utils.parseEther('10')
      )
      await Teleportation.connect(signer).teleportAsset(
        L2BNBOnBobaEth.address, // send BNB as token
        utils.parseEther('10'),
        chainIdBnb // toChainId
      )

      const blockNumber = await ethers.provider.getBlockNumber()
      const events = await teleportationService._getEvents(
        Teleportation,
        Teleportation.filters.AssetReceived(),
        preBlockNumber,
        blockNumber
      )

      expect(events.length).to.be.gt(0, 'Event length must be greater than 0')

      let disbursement = []
      for (const event of events) {
        const sourceChainId = event.args.sourceChainId.toNumber()
        const depositId = await TeleportationBNB.totalDisbursements(chainId) // event.args.depositId --> correct, but we used a fake chainId to simulate Bnb so we need to correct depositId here
        const amount = event.args.amount
        const token = event.args.token
        const emitter = event.args.emitter

        const receivingChainTokenAddr =
          teleportationService._getSupportedDestChainTokenAddrBySourceChainTokenAddr(
            token,
            sourceChainId,
            chainIdBnb
          )
        expect(receivingChainTokenAddr).to.be.eq(
          ethers.constants.AddressZero,
          'BNB native asset on Boba BNB not correctly routed'
        )

        disbursement = [
          ...disbursement,
          {
            token: receivingChainTokenAddr,
            amount: amount.toString(),
            addr: emitter,
            depositId, // artificially increment necessary, as we mocked fake chainId in previous test (to avoid unexpected next depositId)
            sourceChainId: sourceChainId.toString(),
          },
        ]
      }

      disbursement = orderBy(disbursement, ['depositId'], ['asc'])

      const bnbChainInfo = selectedBobaChains.find(
        (c) => c.chainId === chainIdBnb
      )
      if (!bnbChainInfo) {
        throw new Error('BNB provider not configured!')
      }

      const preBNBBalance = await bnbChainInfo.provider.getBalance(address1)
      const preSignerBNBBalance = await bnbChainInfo.provider.getBalance(
        signerAddr
      )

      const teleportationServiceBnb = await startTeleportationService(true)
      await teleportationServiceBnb.init()

      await teleportationServiceBnb._disburseTx(
        disbursement,
        chainIdBnb,
        blockNumber
      )

      const postBNBBalance = await bnbChainInfo.provider.getBalance(address1)
      const postSignerBNBBalance = await bnbChainInfo.provider.getBalance(
        signerAddr
      )

      expect(preBNBBalance.sub(postBNBBalance)).to.be.closeTo(
        utils.parseEther('9.08'),
        utils.parseEther('10.02') // gas used by disburse transaction(s)
      )
      expect(postSignerBNBBalance.sub(preSignerBNBBalance)).to.be.closeTo(
        utils.parseEther('9.08'),
        utils.parseEther('10.02')
      )
    })

    it('teleport ETH despite using BOBA as a fee token (should have no effect on msg.value)', async () => {
      const Boba_GasPriceOracle = getContractFactory('Boba_GasPriceOracle')
        .attach(predeploys.Proxy__Boba_GasPriceOracle)
        .connect(signer)

      const Proxy__Boba_GasPriceOracle = getContractFactory(
        'Lib_ResolvedDelegateBobaProxy'
      )
        .attach(predeploys.Proxy__Boba_GasPriceOracle)
        .connect(signer)

      const Factory__Boba_GasPriceOracleProxyCall =
        await ethers.getContractFactory(
          'Boba_GasPriceOracleProxyCall',
          signer
        )

      const Boba_GasPriceOracleProxyCall =
        await Factory__Boba_GasPriceOracleProxyCall.deploy(
          Boba_GasPriceOracle.address
        )
      await Boba_GasPriceOracleProxyCall.deployTransaction.wait()

      const registerTx = await Boba_GasPriceOracle.useBobaAsFeeToken()
      await registerTx.wait()

      expect(
        await Boba_GasPriceOracle.bobaFeeTokenUsers(env.l2Wallet.address)
      ).to.be.deep.eq(true)


      // now teleport as in previous tests

      const teleportationService = await startTeleportationService(true)
      await teleportationService.init()

      // deposit token
      const preBlockNumber = await ethers.provider.getBlockNumber()
      await TeleportationBNB.connect(signer).teleportAsset(
        ethers.constants.AddressZero, // send native BNB
        utils.parseEther('10'),
        chainId, // toChainId
        { value: utils.parseEther('10') }
      )

      const blockNumber = await ethers.provider.getBlockNumber()
      const events = await teleportationService._getEvents(
        TeleportationBNB,
        TeleportationBNB.filters.AssetReceived(),
        preBlockNumber,
        blockNumber
      )

      expect(events.length).to.be.gt(0, 'Event length must be greater than 0')

      let disbursement = []
      for (const event of events) {
        const sourceChainId = chainIdBnb // event.args.sourceChainId.toNumber() -> (is correct, but we were mocking a fake chainId for testing)
        const depositId = event.args.depositId
        const amount = event.args.amount
        const token = event.args.token
        const emitter = event.args.emitter

        const receivingChainTokenAddr =
          teleportationService._getSupportedDestChainTokenAddrBySourceChainTokenAddr(
            token,
            sourceChainId,
            chainId
          )
        expect(receivingChainTokenAddr).to.be.eq(
          L2BNBOnBobaEth.address,
          'BNB token address on Boba ETH not correctly routed'
        )

        disbursement = [
          ...disbursement,
          {
            token: receivingChainTokenAddr,
            amount: amount.toString(),
            addr: emitter,
            depositId: depositId.toNumber(),
            sourceChainId: sourceChainId.toString(),
          },
        ]
      }

      disbursement = orderBy(disbursement, ['depositId'], ['asc'])

      const preBNBBalance = await L2BNBOnBobaEth.balanceOf(address1)
      const preSignerBNBBalance = await L2BNBOnBobaEth.balanceOf(signerAddr)

      const teleportationServiceEth = await startTeleportationService(false)
      await teleportationServiceEth.init()

      await teleportationServiceEth._disburseTx(
        disbursement,
        chainId,
        blockNumber
      )

      const postBNBBalance = await L2BNBOnBobaEth.balanceOf(address1)
      const postSignerBNBBalance = await L2BNBOnBobaEth.balanceOf(signerAddr)

      expect(preBNBBalance.sub(postBNBBalance)).to.be.eq(utils.parseEther('10'))
      expect(postSignerBNBBalance.sub(preSignerBNBBalance)).to.be.eq(
        utils.parseEther('10')
      )
    })
  })
})
