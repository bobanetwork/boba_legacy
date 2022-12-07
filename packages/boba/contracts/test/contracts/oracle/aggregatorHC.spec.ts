import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { ethers } from 'hardhat'
import { Contract, Signer, utils } from 'ethers'

let FluxAggregatorHC: Contract

const deployFluxAggregatorHC = async (): Promise<Contract> => {
  FluxAggregatorHC = await (
    await ethers.getContractFactory('FluxAggregatorHC')
  ).deploy()
  await FluxAggregatorHC.initialize(
    0, // min submission value
    utils.parseUnits('50000', 8), // max submission value
    8, // decimals
    'TST USD', // description
    '0x0000000000000000000000000000000000000000',
    'https://example.com',
    '0x0000000000000000000000000000000000000000'
  )
  return FluxAggregatorHC
}

describe('Oracle Flux Aggregator Tests', async () => {
  beforeEach(async () => {
    FluxAggregatorHC = await deployFluxAggregatorHC()
  })

  describe('owner tests', async () => {
    it('should not intialize again', async () => {
      await expect(
        FluxAggregatorHC.initialize(
          0, // min submission value
          utils.parseUnits('50000', 8), // max submission value
          8, // decimals
          'TST USD', // description
          '0x0000000000000000000000000000000000000000',
          'https://example.com',
          '0x0000000000000000000000000000000000000000'
        )
      ).to.be.revertedWith('Contract has been initialized')
    })

    it('should be able to transfer ownership', async () => {
      const signer1: Signer = (await ethers.getSigners())[0]
      const address1 = await signer1.getAddress()
      expect(await FluxAggregatorHC.owner()).to.be.eq(address1)
      const signer2: Signer = (await ethers.getSigners())[1]
      await FluxAggregatorHC.transferOwnership(await signer2.getAddress())
      const owner = await FluxAggregatorHC.owner()
      expect(owner).to.be.eq(await signer2.getAddress())
    })

    it('should not be able to transfer ownership if not owner', async () => {
      const signer1: Signer = (await ethers.getSigners())[0]
      const signer2: Signer = (await ethers.getSigners())[1]
      await FluxAggregatorHC.transferOwnership(await signer2.getAddress())
      await expect(
        FluxAggregatorHC.transferOwnership(await signer1.getAddress())
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('should update turing url', async () => {
      const url = 'https://example2.com'
      await FluxAggregatorHC.updateHCUrl(url)
      const HCUrl = await FluxAggregatorHC.HCUrl()
      expect(HCUrl).to.be.eq(url)
    })

    it('should not update turing url if not owner', async () => {
      const signer2: Signer = (await ethers.getSigners())[1]
      const url = 'https://example2.com'
      await expect(
        FluxAggregatorHC.connect(signer2).updateHCUrl(url)
      ).to.be.revertedWith('Caller is not the owner')
    })

    it('should update turing address', async () => {
      const signer2: Signer = (await ethers.getSigners())[1]
      const address = await signer2.getAddress()
      await FluxAggregatorHC.updateHCHelper(address)
      const HCHelperAddr = await FluxAggregatorHC.HCHelperAddr()
      expect(HCHelperAddr).to.be.eq(address)
    })

    it('should not update turing address if not owner', async () => {
      const signer: Signer = (await ethers.getSigners())[1]
      const address = await signer.getAddress()
      await expect(
        FluxAggregatorHC.connect(signer).updateHCHelper(address)
      ).to.be.revertedWith('Caller is not the owner')
    })

    it("should update ChainLink's contract address", async () => {
      const signer: Signer = (await ethers.getSigners())[1]
      const address = await signer.getAddress()
      await FluxAggregatorHC.updateHCChainLinkPriceFeedAddr(address)
      const turingChainLinkPriceFeedAddr =
        await FluxAggregatorHC.HCChainLinkPriceFeedAddr()
      expect(turingChainLinkPriceFeedAddr).to.be.eq(address)
    })

    it("should not update ChainLink's contract address if not owner", async () => {
      const signer: Signer = (await ethers.getSigners())[1]
      const address = await signer.getAddress()
      await expect(
        FluxAggregatorHC.connect(signer).updateHCChainLinkPriceFeedAddr(address)
      ).to.be.revertedWith('Caller is not the owner')
    })
  })

  describe('Oracle admin tests', async () => {
    const staringRoundId = 1000

    it('should add an oracle', async () => {
      const signerAddr = await (await ethers.getSigners())[0].getAddress()
      await FluxAggregatorHC.setOracle(signerAddr, signerAddr, staringRoundId)
      const oracleAdmin = await FluxAggregatorHC.getAdmin()
      expect(oracleAdmin).to.be.eq(signerAddr)
    })

    it('should not add an oracle again', async () => {
      const signerAddr = await (await ethers.getSigners())[0].getAddress()
      await FluxAggregatorHC.setOracle(signerAddr, signerAddr, staringRoundId)
      await expect(
        FluxAggregatorHC.setOracle(signerAddr, signerAddr, staringRoundId)
      ).to.be.revertedWith('oracleAddress already set')
    })

    it('should transfer oracle admin', async () => {
      const signerAddr = await (await ethers.getSigners())[0].getAddress()
      const signer2Addr = await (await ethers.getSigners())[1].getAddress()
      await FluxAggregatorHC.setOracle(signerAddr, signerAddr, staringRoundId)
      await FluxAggregatorHC.transferOracleAdmin(signer2Addr)
      const oracleAdmin = await FluxAggregatorHC.getAdmin()
      expect(oracleAdmin).to.be.eq(signer2Addr)
    })

    it('should not transfer oracle admin if not admin', async () => {
      const signerAddr = await (await ethers.getSigners())[0].getAddress()
      const signer2Addr = await (await ethers.getSigners())[1].getAddress()
      await FluxAggregatorHC.setOracle(signerAddr, signerAddr, staringRoundId)
      await FluxAggregatorHC.transferOracleAdmin(signer2Addr)
      await expect(
        FluxAggregatorHC.transferOracleAdmin(signer2Addr)
      ).to.be.revertedWith('Caller is not the oracle owner')
    })
  })

  describe('Data submission tests', async () => {
    const staringRoundId = 1000

    it('should submit data for round 1001', async () => {
      const nextRoundId = 1001
      const submissionAnswer = 1000

      const signerAddr = await (await ethers.getSigners())[0].getAddress()
      await FluxAggregatorHC.setOracle(signerAddr, signerAddr, staringRoundId)
      await FluxAggregatorHC.emergencySubmit(
        nextRoundId,
        submissionAnswer,
        nextRoundId
      )
      const latestRound = await FluxAggregatorHC.latestRound()
      const answer = await FluxAggregatorHC.getAnswer(nextRoundId)
      const latestTimestamp = await FluxAggregatorHC.latestTimestamp()
      const timestamp = await FluxAggregatorHC.getTimestamp(nextRoundId)
      const roundData = await FluxAggregatorHC.getRoundData(nextRoundId)
      expect(latestRound).to.be.eq(nextRoundId)
      expect(answer).to.be.eq(submissionAnswer)
      expect(latestTimestamp).to.be.eq(timestamp)
      expect(timestamp).not.be.eq(0)
      expect(roundData.answer).to.be.eq(submissionAnswer)
      expect(roundData.updatedAt).to.be.eq(timestamp)
      expect(roundData.answeredInRound).to.be.eq(nextRoundId)
      expect(roundData.startedAt).to.be.eq(timestamp)
    })

    it('should not submit data twice for the same round id', async () => {
      const nextRoundId = 1001
      const submissionAnswer = 1000

      const signerAddr = await (await ethers.getSigners())[0].getAddress()
      await FluxAggregatorHC.setOracle(signerAddr, signerAddr, staringRoundId)
      await FluxAggregatorHC.emergencySubmit(
        nextRoundId,
        submissionAnswer,
        nextRoundId
      )
      await expect(
        FluxAggregatorHC.emergencySubmit(
          nextRoundId,
          submissionAnswer,
          nextRoundId
        )
      ).to.be.revertedWith('invalid roundId to initialize')
    })

    it('should not submit data for wrong chainLinkLatestRoundId', async () => {
      const nextRoundId = 1001
      const submissionAnswer = 1000
      const chainLinkLatestRoundId = 10000

      const signerAddr = await (await ethers.getSigners())[0].getAddress()
      await FluxAggregatorHC.setOracle(signerAddr, signerAddr, staringRoundId)
      await expect(
        FluxAggregatorHC.emergencySubmit(
          nextRoundId,
          submissionAnswer,
          nextRoundId - 1
        )
      ).to.be.revertedWith('ChainLink latestRoundId is invalid')
      await FluxAggregatorHC.emergencySubmit(
        nextRoundId,
        submissionAnswer,
        chainLinkLatestRoundId
      )
      await expect(
        FluxAggregatorHC.emergencySubmit(
          nextRoundId + 1,
          submissionAnswer,
          chainLinkLatestRoundId - 1
        )
      ).to.be.revertedWith('ChainLink latestRoundId is invalid')
    })

    it('should continously submit data', async () => {
      let nextRoundId = 1001
      const submissionAnswer = 1000
      const nextSubmissionAnswer = 2000
      const chainLinkLatestRoundId = 10000

      const signerAddr = await (await ethers.getSigners())[0].getAddress()
      await FluxAggregatorHC.setOracle(signerAddr, signerAddr, staringRoundId)
      await FluxAggregatorHC.emergencySubmit(
        nextRoundId,
        submissionAnswer,
        chainLinkLatestRoundId
      )
      await FluxAggregatorHC.emergencySubmit(
        nextRoundId + 1,
        nextSubmissionAnswer,
        chainLinkLatestRoundId
      )

      nextRoundId = nextRoundId + 1
      const latestRound = await FluxAggregatorHC.latestRound()
      const answer = await FluxAggregatorHC.getAnswer(nextRoundId)
      const latestTimestamp = await FluxAggregatorHC.latestTimestamp()
      const timestamp = await FluxAggregatorHC.getTimestamp(nextRoundId)
      const roundData = await FluxAggregatorHC.getRoundData(nextRoundId)
      expect(latestRound).to.be.eq(nextRoundId)
      expect(answer).to.be.eq(nextSubmissionAnswer)
      expect(latestTimestamp).to.be.eq(timestamp)
      expect(timestamp).not.be.eq(0)
      expect(roundData.answer).to.be.eq(nextSubmissionAnswer)
      expect(roundData.updatedAt).to.be.eq(timestamp)
      expect(roundData.answeredInRound).to.be.eq(nextRoundId)
      expect(roundData.startedAt).to.be.eq(timestamp)
    })
  })
})
