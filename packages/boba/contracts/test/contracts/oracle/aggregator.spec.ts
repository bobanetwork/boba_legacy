import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { ethers } from 'hardhat'
import { Contract, Signer, BigNumber, utils } from 'ethers'

let bobaToken: Contract
let FluxAggregator: Contract
const BOBA_SUPPLY = ethers.utils.parseEther('10000')
const BOBA_DECIMALS = 18

const deployBoba = async (): Promise<Contract> => {
  return (await ethers.getContractFactory('L1ERC20')).deploy(
    BOBA_SUPPLY,
    'BOBA',
    'BOBA',
    BOBA_DECIMALS
  )
}

const deployFluxAggregator = async (
  bobaTokenAddress: string
): Promise<Contract> => {
  return (await ethers.getContractFactory('FluxAggregator')).deploy(
    bobaTokenAddress, // L2 token address
    0, // starting payment amount
    180, // timeout, 3 mins
    '0x0000000000000000000000000000000000000000', // validator
    0, // min submission value
    utils.parseUnits('50000', 8), // max submission value
    8, // decimals
    'TST USD' // description
  )
}

const moveTimeForward = async (time = 0) => {
  await ethers.provider.send('evm_increaseTime', [time])
  await ethers.provider.send('evm_mine', [])
}

describe('Oracle Flux Aggregator Tests', async () => {
  beforeEach(async () => {
    bobaToken = await deployBoba()
    FluxAggregator = await deployFluxAggregator(bobaToken.address)
  })

  describe('Optional payments for oracle submission', async () => {
    beforeEach(async () => {
      const signer2: Signer = (await ethers.getSigners())[1]
      // add oracles
      const addOracleTx = await FluxAggregator.changeOracles(
        [],
        [await signer2.getAddress()],
        [await signer2.getAddress()],
        1, // min submission count
        1, // max submission count
        0 // restart delay
      )
      await addOracleTx.wait()
      // send funds to aggregator
      const reserveRounds = 2
      const paymentAmount = utils.parseEther('1')
      const requiredBalance = paymentAmount.mul(reserveRounds)

      const approveTx = await bobaToken.approve(
        FluxAggregator.address,
        requiredBalance
      )
      await approveTx.wait()
      const addFundsTx = await FluxAggregator.addFunds(requiredBalance)
      await addFundsTx.wait()

      // update payment for round
      const updateFutureRoundsTx = await FluxAggregator.updateFutureRounds(
        paymentAmount, // payment amount
        1, // same min submission count
        1, // same max submission count
        0, // same restart delay
        180 // same timeout
      )
      await updateFutureRoundsTx.wait()

      // deplete funds with dummy submissions two rounds
      await FluxAggregator.connect(signer2).submit(1, 1000)
      await FluxAggregator.connect(signer2).submit(2, 1010)
    })

    it('should not allow submissions when funds depleted and voluntary submissions stopped', async () => {
      const signer2: Signer = (await ethers.getSigners())[1]
      await expect(
        FluxAggregator.connect(signer2).submit(3, 1030)
      ).to.be.revertedWith('available funds depleted')
    })

    it('should allow submissions when funds depleted and voluntary submissions allowed', async () => {
      const signer2: Signer = (await ethers.getSigners())[1]
      const currentStatus = await FluxAggregator.voluntarySubmissionsAllowed()
      expect(currentStatus).to.be.eq(false)

      await expect(
        FluxAggregator.connect(signer2).flipVoluntarySubmissionsAllowed()
      ).to.be.revertedWith('Only callable by owner')

      await FluxAggregator.flipVoluntarySubmissionsAllowed()
      const updatedStatus = await FluxAggregator.voluntarySubmissionsAllowed()
      expect(updatedStatus).to.be.eq(true)

      const preWithdrawablePayment = await FluxAggregator.withdrawablePayment(
        await signer2.getAddress()
      )

      const SubmitTx = await FluxAggregator.connect(signer2).submit(3, 1030)
      await SubmitTx.wait()

      const latestRound = await FluxAggregator.latestRound()
      expect(latestRound).to.be.eq(3)

      const postWithdrawablePayment = await FluxAggregator.withdrawablePayment(
        await signer2.getAddress()
      )
      expect(postWithdrawablePayment).to.be.eq(preWithdrawablePayment)
    })
  })

  describe('Aggregator available funds status', async () => {
    it('should update available funds data on using method', async () => {
      const depositL2ERC20Amount = utils.parseEther('100')
      const approveTx = await bobaToken.approve(
        FluxAggregator.address,
        depositL2ERC20Amount
      )
      await approveTx.wait()

      const preAvailableFunds = await FluxAggregator.availableFunds()
      const preAllocatedFunds = await FluxAggregator.allocatedFunds()
      const addFundsTx = await FluxAggregator.addFunds(depositL2ERC20Amount)
      await addFundsTx.wait()
      const postAvailableFunds = await FluxAggregator.availableFunds()
      const postAllocatedFunds = await FluxAggregator.allocatedFunds()

      expect(postAllocatedFunds).to.eq(preAllocatedFunds)
      expect(postAvailableFunds).to.eq(
        preAvailableFunds.add(depositL2ERC20Amount)
      )
    })

    it('should be able to withdraw directly transferred funds', async () => {
      const signer: Signer = (await ethers.getSigners())[0]
      const transferAmount = utils.parseEther('10')
      const preAvailableFunds = await FluxAggregator.availableFunds()

      const reserveRounds = 2
      const paymentAmount = await FluxAggregator.paymentAmount()
      const requiredBalance = paymentAmount.mul(reserveRounds)
      // directly transfer funds
      const transferTx = await bobaToken.transfer(
        FluxAggregator.address,
        transferAmount
      )
      await transferTx.wait()

      const withdrawTx = await FluxAggregator.withdrawFunds(
        await signer.getAddress(),
        transferAmount.add(preAvailableFunds).sub(requiredBalance)
      )
      await withdrawTx.wait()

      const postAvailableFunds = await FluxAggregator.availableFunds()
      expect(postAvailableFunds).to.eq(requiredBalance)
    })
  })

  describe('Allow rounds between min-max submissions', async () => {
    beforeEach(async () => {
      const signer: Signer = (await ethers.getSigners())[0]
      const signer2: Signer = (await ethers.getSigners())[1]
      const signer3: Signer = (await ethers.getSigners())[2]
      const paymentAmount = await FluxAggregator.paymentAmount()
      const approveTx = await bobaToken.approve(
        FluxAggregator.address,
        paymentAmount.mul(6)
      )
      await approveTx.wait()
      const addFundsTx = await FluxAggregator.addFunds(paymentAmount.mul(6))
      await addFundsTx.wait()

      const addFirstOracleTx = await FluxAggregator.changeOracles(
        [],
        [await signer2.getAddress()],
        [await signer2.getAddress()],
        1, // min submission count
        1, // max submission count
        0 // restart delay
      )
      await addFirstOracleTx.wait()

      await FluxAggregator.connect(signer2).submit(1, 1000)
      await FluxAggregator.connect(signer2).submit(2, 1010)
      await FluxAggregator.connect(signer2).submit(3, 1020)

      const addOracleTx = await FluxAggregator.changeOracles(
        [],
        [await signer3.getAddress(), await signer.getAddress()],
        [await signer3.getAddress(), await signer.getAddress()],
        2, // min submission count
        3, // max submission count
        0 // restart delay
      )
      await addOracleTx.wait()
    })

    it('rounds with less than min submissions is timedOut', async () => {
      // submit first oracle
      const signer2: Signer = (await ethers.getSigners())[1]
      const SubmitTx = await FluxAggregator.connect(signer2).submit(4, 1040)
      await SubmitTx.wait()

      // move time forward until timeout
      const timeout = await FluxAggregator.timeout()
      await moveTimeForward(timeout)

      // start new round and check last round data
      const SubmitSecondRoundTx = await FluxAggregator.connect(signer2).submit(
        5,
        1050
      )
      await SubmitSecondRoundTx.wait()

      const previousRoundData = await FluxAggregator.getRoundData(4)
      const roundThreeData = await FluxAggregator.getRoundData(3)

      expect(previousRoundData.answeredInRound).to.be.eq(3)
      expect(previousRoundData.answer).to.be.eq(roundThreeData.answer)
    })

    it('rounds with at least min submissions is not timedOut', async () => {
      // submit second oracle
      const signer2: Signer = (await ethers.getSigners())[1]
      const signer3: Signer = (await ethers.getSigners())[2]
      const SubmitTxFirstOracle = await FluxAggregator.connect(signer2).submit(
        4,
        1040
      )
      await SubmitTxFirstOracle.wait()
      const SubmitTxSecondOracle = await FluxAggregator.connect(signer3).submit(
        4,
        1050
      )
      await SubmitTxSecondOracle.wait()

      // move time forward until timeout
      const timeout = await FluxAggregator.timeout()
      await moveTimeForward(timeout)

      // start new round and check last round data
      const SubmitSecondRoundTx = await FluxAggregator.connect(signer2).submit(
        5,
        1060
      )
      await SubmitSecondRoundTx.wait()

      const previousRoundData = await FluxAggregator.getRoundData(4)
      expect(previousRoundData.answeredInRound).to.be.eq(4)
    })
  })
})
