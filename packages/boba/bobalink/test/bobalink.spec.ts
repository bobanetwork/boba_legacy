import { expect } from './setup'

/* External Imports */
import { ethers } from 'hardhat'
import { ContractFactory, Contract, Signer, Wallet, utils } from 'ethers'

/* Imports: Artifacts */
import FluxAggregatorJson from '@boba/contracts/artifacts/contracts/oracle/FluxAggregator.sol/FluxAggregator.json'
import FluxAggregatorHCJson from '@boba/contracts/artifacts/contracts/oracle/FluxAggregatorHC.sol/FluxAggregatorHC.json'
import L1ERC20Json from '@boba/contracts/artifacts/contracts/test-helpers/L1ERC20.sol/L1ERC20.json'

/* Imports: Interface */
import { BobaLinkPairs } from '../src/utils/types'

/* Imports: Core */
import { BobaLinkService } from '../dist/service'

describe('bobalink', () => {
  let signer: Signer
  let signerAddr: string

  let wallet: Wallet
  let walletAddr: string

  let bobaLinkPairs: BobaLinkPairs
  let FluxAggregatorList: Contract[]
  let FluxAggregatorHCList: Contract[]

  const Timer = (time) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve('TimeOut'), time)
    })
  }

  const deployPairContracts = async (bobaTokenAddr: string) => {
    Factory__FluxAggregator = new ethers.ContractFactory(
      FluxAggregatorJson.abi,
      FluxAggregatorJson.bytecode,
      wallet
    )
    FluxAggregator = await Factory__FluxAggregator.deploy(
      bobaTokenAddr, // L2 token address
      0, // starting payment amount
      180, // timeout, 3 mins
      '0x0000000000000000000000000000000000000000', // validator
      0, // min submission value
      utils.parseUnits('50000', 8), // max submission value
      8, // decimals
      'TST USD' // description
    )
    await FluxAggregator.deployTransaction.wait()

    Factory__FluxAggregatorHC = new ethers.ContractFactory(
      FluxAggregatorHCJson.abi,
      FluxAggregatorHCJson.bytecode,
      wallet
    )
    FluxAggregatorHC = await Factory__FluxAggregatorHC.deploy(
      bobaTokenAddr, // L2 token address
      0, // starting payment amount
      180, // timeout, 3 mins
      '0x0000000000000000000000000000000000000000', // validator
      0, // min submission value
      utils.parseUnits('50000', 8), // max submission value
      8, // decimals
      'TST USD', // description
      '0x0000000000000000000000000000000000000000',
      'https://example.com',
      '0x0000000000000000000000000000000000000000'
    )
    await FluxAggregatorHC.deployTransaction.wait()

    return [FluxAggregator, FluxAggregatorHC]
  }

  before(async () => {
    ;[signer] = await ethers.getSigners()
    signerAddr = await signer.getAddress()
    wallet = ethers.Wallet.createRandom().connect(ethers.provider)
    walletAddr = wallet.address
    await signer.sendTransaction({
      to: wallet.address,
      value: ethers.utils.parseEther('100'),
    })
  })

  let Factory__FluxAggregator: ContractFactory
  let FluxAggregator: Contract

  let Factory__FluxAggregatorHC: ContractFactory
  let FluxAggregatorHC: Contract

  let Factory__BOBA: ContractFactory
  let BOBA: Contract

  let bobaLinkService: any

  before(async () => {
    Factory__BOBA = new ethers.ContractFactory(
      L1ERC20Json.abi,
      L1ERC20Json.bytecode,
      signer
    )
    BOBA = await Factory__BOBA.deploy(
      utils.parseEther('100000000000'),
      'BOBA',
      'BOBA',
      18
    )
    await BOBA.deployTransaction.wait()
    ;[FluxAggregator, FluxAggregatorHC] = await deployPairContracts(
      BOBA.address
    )
    // build payload
    bobaLinkPairs = {
      [FluxAggregator.address]: {
        pair: 'TST / USD',
        decimals: 8,
        l2ContractAddress: FluxAggregatorHC.address,
      },
    }
  })

  const startBOBALinkService = async () => {
    const chainId = (await ethers.provider.getNetwork()).chainId
    bobaLinkService = new BobaLinkService({
      l1RpcProvider: ethers.provider,
      l2RpcProvider: ethers.provider,
      chainId,
      reporterWallet: wallet,
      bobaLinkPairs,
      pollingInterval: 2000,
      setGasPriceToZero: false,
    })
    return bobaLinkService
  }

  it('should create bobaLinkService', async () => {
    bobaLinkService = await startBOBALinkService()
    await bobaLinkService.init()
  })

  describe('unit function tests', () => {
    it('should get round Ids', async () => {
      // start the l1 simulated contract
      const addOracleTx = await FluxAggregator.changeOracles(
        [],
        [walletAddr],
        [walletAddr],
        1, // min submission count
        1, // max submission count
        0 // restart delay
      )
      await addOracleTx.wait()
      for (let i = 1; i < 10; i++) {
        await FluxAggregator.connect(wallet).submit(
          i,
          Math.round(Math.random() * 10000)
        )
      }
      // start the l2 simulated contract
      const addOracleTxHC = await FluxAggregatorHC.changeOracles(
        [],
        [walletAddr],
        [walletAddr],
        [3], // starting round id
        1, // min submission count
        1, // max submission count
        0 // restart delay
      )
      await addOracleTxHC.wait()
      for (const [_, contracts] of Object.entries(
        bobaLinkService.state.bobaLinkContracts
      )) {
        const [lastRoundId, CLLatestRoundId] =
          await bobaLinkService._getReportedRound(contracts)
        expect(lastRoundId).to.equal(3)
        expect(CLLatestRoundId).to.equal(9)
      }
    })

    it('should report round data', async () => {
      for (const [_, contracts] of Object.entries(
        bobaLinkService.state.bobaLinkContracts
      )) {
        const [lastRoundId, CLLatestRoundId] =
          await bobaLinkService._getReportedRound(contracts)
        expect(lastRoundId).to.equal(3)
        expect(CLLatestRoundId).to.equal(9)
        await bobaLinkService._reportRound(
          contracts,
          lastRoundId,
          CLLatestRoundId
        )
        const latestRoundId = await FluxAggregatorHC.latestRound()
        const roundData = await FluxAggregatorHC.getRoundData(latestRoundId)
        const CLRoundData = await FluxAggregator.getRoundData(latestRoundId)
        const chainLinkLatestRoundId =
          await FluxAggregatorHC.chainLinkLatestRoundId()
        expect(latestRoundId).to.equal(4)
        expect(roundData.answer).to.equal(CLRoundData.answer)
        expect(chainLinkLatestRoundId).to.equal(9)
      }
    })
  })

  describe('service tests', () => {
    it('should report round data to the latest round', async () => {
      await Promise.race([Timer(5000), bobaLinkService.start()])
      const latestRoundId = await FluxAggregatorHC.latestRound()
      const roundData = await FluxAggregatorHC.getRoundData(latestRoundId)
      const CLRoundData = await FluxAggregator.getRoundData(latestRoundId)
      const chainLinkLatestRoundId =
        await FluxAggregatorHC.chainLinkLatestRoundId()
      expect(latestRoundId).to.equal(9)
      expect(roundData.answer).to.equal(CLRoundData.answer)
      expect(chainLinkLatestRoundId).to.equal(9)
    })
  })

  describe('tests for multiple pairs', async () => {
    before(async () => {
      const [FluxAggregator1, FluxAggregatorHC1] = await deployPairContracts(
        BOBA.address
      )
      const [FluxAggregator2, FluxAggregatorHC2] = await deployPairContracts(
        BOBA.address
      )
      const [FluxAggregator3, FluxAggregatorHC3] = await deployPairContracts(
        BOBA.address
      )
      // build payload
      bobaLinkPairs = {
        [FluxAggregator1.address]: {
          pair: 'TST / USD',
          decimals: 8,
          l2ContractAddress: FluxAggregatorHC1.address,
        },
        [FluxAggregator2.address]: {
          pair: 'TST / USD',
          decimals: 8,
          l2ContractAddress: FluxAggregatorHC2.address,
        },
        [FluxAggregator3.address]: {
          pair: 'TST / USD',
          decimals: 8,
          l2ContractAddress: FluxAggregatorHC3.address,
        },
      }
      bobaLinkService = await startBOBALinkService()
      await bobaLinkService.init()
      FluxAggregatorList = [FluxAggregator1, FluxAggregator2, FluxAggregator3]
      FluxAggregatorHCList = [
        FluxAggregatorHC1,
        FluxAggregatorHC2,
        FluxAggregatorHC3,
      ]
    })

    it('should add new oracle submitters', async () => {
      for (let i = 0; i < 3; i++) {
        // start the l1 simulated contract
        const addOracleTx = await FluxAggregatorList[i].changeOracles(
          [],
          [walletAddr],
          [walletAddr],
          1, // min submission count
          1, // max submission count
          0 // restart delay
        )
        await addOracleTx.wait()
        for (let j = 1; j < 10; j++) {
          await FluxAggregatorList[i]
            .connect(wallet)
            .submit(j, Math.round(Math.random() * 10000))
        }
        // start the l2 simulated contract
        const addOracleTxHC = await FluxAggregatorHCList[i].changeOracles(
          [],
          [walletAddr],
          [walletAddr],
          [3], // starting round id
          1, // min submission count
          1, // max submission count
          0 // restart delay
        )
        await addOracleTxHC.wait()
      }

      // check that the new data is pushed
      for (const [_, contracts] of Object.entries(
        bobaLinkService.state.bobaLinkContracts
      )) {
        const [lastRoundId, CLLatestRoundId] =
          await bobaLinkService._getReportedRound(contracts)
        expect(lastRoundId).to.equal(3)
        expect(CLLatestRoundId).to.equal(9)
      }
    })

    it('should report round data to the latest round', async () => {
      await Promise.race([Timer(5000), bobaLinkService.start()])
      for (let i = 0; i < 3; i++) {
        const latestRoundId = await FluxAggregatorHCList[i].latestRound()
        /* eslint-disable */
        const roundData = await FluxAggregatorHCList[i].getRoundData(latestRoundId)
        const CLRoundData = await FluxAggregatorList[i].getRoundData(latestRoundId)
        const chainLinkLatestRoundId = await FluxAggregatorHCList[i].chainLinkLatestRoundId()
        /* eslint-enable */
        expect(latestRoundId).to.equal(9)
        expect(roundData.answer).to.equal(CLRoundData.answer)
        expect(chainLinkLatestRoundId).to.equal(9)
      }
    })
  })
})
