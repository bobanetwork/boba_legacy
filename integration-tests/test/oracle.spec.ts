import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { Contract, ContractFactory, BigNumber, utils, ethers } from 'ethers'
import { Direction } from './shared/watcher-utils'
import { getContractFactory } from '@eth-optimism/contracts'

import FluxAggregatorJson from '@boba/contracts/artifacts/contracts/oracle/FluxAggregator.sol/FluxAggregator.json'
import L1ERC20Json from '@boba/contracts/artifacts/contracts/test-helpers/L1ERC20.sol/L1ERC20.json'

import { OptimismEnv } from './shared/env'

describe('Oracle Flux Aggregator', async () => {
  let Factory__L1ERC20: ContractFactory
  let Factory__L2ERC20: ContractFactory
  let Factory__FluxAggregator: ContractFactory

  let L1ERC20: Contract
  let L2ERC20: Contract
  let L1StandardBridge: Contract
  let FluxAggregator: Contract

  let env: OptimismEnv

  const initialSupply = utils.parseEther('10000000000')
  const tokenName = 'JLKN'
  const tokenSymbol = 'JLKN'

  const moveTimeForward = async (time = 0) => {
    Factory__L1ERC20 = new ContractFactory(
      L1ERC20Json.abi,
      L1ERC20Json.bytecode,
      env.l1Wallet
    )

    L1ERC20 = await Factory__L1ERC20.deploy(
      utils.parseEther('10000000000'),
      'JLKN',
      'JLKN',
      18
    )
    await L1ERC20.deployTransaction.wait()

    Factory__L2ERC20 = getContractFactory('L2StandardERC20', env.l2Wallet)

    const L2StandardBridgeAddress = await L1StandardBridge.l2TokenBridge()

    L2ERC20 = await Factory__L2ERC20.deploy(
      L2StandardBridgeAddress,
      L1ERC20.address,
      'JLKN',
      'JLKN',
      18
    )
    await L2ERC20.deployTransaction.wait()

    // increase l1 time and in turn change the l2 timestamp
    await env.l1Provider.send('evm_increaseTime', [time])

    const approveL1ERC20TX = await L1ERC20.approve(
      L1StandardBridge.address,
      utils.parseEther('100')
    )
    await approveL1ERC20TX.wait()

    await env.waitForXDomainTransaction(
      L1StandardBridge.depositERC20(
        L1ERC20.address,
        L2ERC20.address,
        utils.parseEther('100'),
        9999999,
        ethers.utils.formatBytes32String(new Date().getTime().toString())
      ),
      Direction.L1ToL2
    )
  }

  before(async () => {
    env = await OptimismEnv.new()

    Factory__L1ERC20 = new ContractFactory(
      L1ERC20Json.abi,
      L1ERC20Json.bytecode,
      env.l1Wallet
    )

    const L1StandardBridgeAddress = await env.addressManager.getAddress(
      'Proxy__L1StandardBridge'
    )

    L1StandardBridge = getContractFactory(
      'L1StandardBridge',
      env.l1Wallet
    ).attach(L1StandardBridgeAddress)

    const L2StandardBridgeAddress = await L1StandardBridge.l2TokenBridge()

    //we deploy a new erc20, so tests won't fail on a rerun on the same contracts
    L1ERC20 = await Factory__L1ERC20.deploy(
      initialSupply,
      tokenName,
      tokenSymbol,
      18
    )
    await L1ERC20.deployTransaction.wait()

    Factory__L2ERC20 = getContractFactory('L2StandardERC20', env.l2Wallet)

    L2ERC20 = await Factory__L2ERC20.deploy(
      L2StandardBridgeAddress,
      L1ERC20.address,
      tokenName,
      tokenSymbol,
      18
    )
    await L2ERC20.deployTransaction.wait()

    Factory__FluxAggregator = new ContractFactory(
      FluxAggregatorJson.abi,
      FluxAggregatorJson.bytecode,
      env.l2Wallet
    )

    FluxAggregator = await Factory__FluxAggregator.deploy(
      L2ERC20.address, // L2 token address
      0, // starting payment amount
      180, // timeout, 3 mins
      '0x0000000000000000000000000000000000000000', // validator
      0, // min submission value
      utils.parseUnits('50000', 8), // max submission value
      8, // decimals
      'TST USD' // description
    )
  })

  describe('Optional payments for oracle submission', async () => {
    before(async () => {
      // deposit ERC20 to L2
      const depositL2ERC20Amount = utils.parseEther('10000')
      const approveL1ERC20TX = await L1ERC20.approve(
        L1StandardBridge.address,
        depositL2ERC20Amount
      )
      await approveL1ERC20TX.wait()

      await env.waitForXDomainTransaction(
        L1StandardBridge.depositERC20(
          L1ERC20.address,
          L2ERC20.address,
          depositL2ERC20Amount,
          9999999,
          ethers.utils.formatBytes32String(new Date().getTime().toString())
        ),
        Direction.L1ToL2
      )
      // add oracles
      const addOracleTx = await FluxAggregator.changeOracles(
        [],
        [env.l2Wallet_2.address],
        [env.l2Wallet_2.address],
        1, // min submission count
        1, // max submission count
        0 // restart delay
      )
      await addOracleTx.wait()
      // send funds to aggregator
      const reserveRounds = 2
      const paymentAmount = utils.parseEther('1')
      const requiredBalance = paymentAmount.mul(reserveRounds)

      const approveTx = await L2ERC20.approve(
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
      await FluxAggregator.connect(env.l2Wallet_2).submit(1, 1000)
      await FluxAggregator.connect(env.l2Wallet_2).submit(2, 1010)
    })

    it('{tag:other} should not allow submissions when funds depleted and voluntary submissions stopped', async () => {
      await expect(
        FluxAggregator.connect(env.l2Wallet_2).submit(3, 1030)
      ).to.be.revertedWith('available funds depleted')
    })

    it('{tag:other} should allow submissions when funds depleted and voluntary submissions allowed', async () => {
      const currentStatus = await FluxAggregator.voluntarySubmissionsAllowed()
      expect(currentStatus).to.be.eq(false)

      await expect(
        FluxAggregator.connect(env.l2Wallet_2).flipVoluntarySubmissionsAllowed()
      ).to.be.revertedWith('Only callable by owner')

      await FluxAggregator.flipVoluntarySubmissionsAllowed()
      const updatedStatus = await FluxAggregator.voluntarySubmissionsAllowed()
      expect(updatedStatus).to.be.eq(true)

      const preWithdrawablePayment = await FluxAggregator.withdrawablePayment(
        env.l2Wallet_2.address
      )

      const SubmitTx = await FluxAggregator.connect(env.l2Wallet_2).submit(
        3,
        1030
      )
      await SubmitTx.wait()

      const latestRound = await FluxAggregator.latestRound()
      expect(latestRound).to.be.eq(3)

      const postWithdrawablePayment = await FluxAggregator.withdrawablePayment(
        env.l2Wallet_2.address
      )
      expect(postWithdrawablePayment).to.be.eq(preWithdrawablePayment)
    })
  })

  describe('Aggregator available funds status', async () => {
    it('{tag:other} should update available funds data on using method', async () => {
      const depositL2ERC20Amount = utils.parseEther('100')
      const approveTx = await L2ERC20.approve(
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

    it('{tag:other} should be able to withdraw directly transferred funds', async () => {
      const transferAmount = utils.parseEther('10')
      const preAvailableFunds = await FluxAggregator.availableFunds()

      const reserveRounds = 2
      const paymentAmount = await FluxAggregator.paymentAmount()
      const requiredBalance = paymentAmount.mul(reserveRounds)
      // directly transfer funds
      const transferTx = await L2ERC20.transfer(
        FluxAggregator.address,
        transferAmount
      )
      await transferTx.wait()

      const withdrawTx = await FluxAggregator.withdrawFunds(
        env.l2Wallet.address,
        transferAmount.add(preAvailableFunds).sub(requiredBalance)
      )
      await withdrawTx.wait()

      const postAvailableFunds = await FluxAggregator.availableFunds()
      expect(postAvailableFunds).to.eq(requiredBalance)
    })
  })

  // TODO warp time on l2
  describe.skip('Allow rounds between min-max submissions', async () => {
    before(async () => {
      const paymentAmount = await FluxAggregator.paymentAmount()
      const approveTx = await L2ERC20.approve(
        FluxAggregator.address,
        paymentAmount.mul(6)
      )
      await approveTx.wait()
      const addFundsTx = await FluxAggregator.addFunds(paymentAmount.mul(6))
      await addFundsTx.wait()

      const addOracleTx = await FluxAggregator.changeOracles(
        [],
        [env.l2Wallet_3.address, env.l2Wallet.address],
        [env.l2Wallet_3.address, env.l2Wallet.address],
        2, // min submission count
        3, // max submission count
        0 // restart delay
      )
      await addOracleTx.wait()
    })
    // TODO warp time on l2
    it.skip('rounds with less than min submissions is timedOut', async () => {
      // submit first oracle
      const SubmitTx = await FluxAggregator.connect(env.l2Wallet_2).submit(
        4,
        1040
      )
      await SubmitTx.wait()

      // move time forward until timeout
      const timeout = await FluxAggregator.timeout()
      await moveTimeForward(timeout)

      // start new round and check last round data
      const SubmitSecondRoundTx = await FluxAggregator.connect(
        env.l2Wallet_2
      ).submit(5, 1050)
      await SubmitSecondRoundTx.wait()

      const previousRoundData = await FluxAggregator.getRoundData(4)
      const roundThreeData = await FluxAggregator.getRoundData(3)

      expect(previousRoundData.answeredInRound).to.be.eq(3)
      expect(previousRoundData.answer).to.be.eq(roundThreeData.answer)
    })
    // TODO warp time on l2
    it.skip('rounds with at least min submissions is not timedOut', async () => {
      // submit second oracle
      const SubmitTx = await FluxAggregator.connect(env.l2Wallet_3).submit(
        5,
        1050
      )
      await SubmitTx.wait()

      // move time forward until timeout
      const timeout = await FluxAggregator.timeout()
      await moveTimeForward(timeout)

      // start new round and check last round data
      const SubmitSecondRoundTx = await FluxAggregator.connect(
        env.l2Wallet_2
      ).submit(6, 1060)
      await SubmitSecondRoundTx.wait()

      const previousRoundData = await FluxAggregator.getRoundData(5)
      expect(previousRoundData.answeredInRound).to.be.eq(5)
    })
  })
})
