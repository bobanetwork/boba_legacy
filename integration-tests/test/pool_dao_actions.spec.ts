import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { Contract, ContractFactory, BigNumber, utils, ethers } from 'ethers'
import { Direction } from './shared/watcher-utils'
import { getContractFactory } from '@eth-optimism/contracts'
import L1ERC20Json from '@boba/contracts/artifacts/contracts/test-helpers/L1ERC20.sol/L1ERC20.json'
import L1BobaJson from '@boba/contracts/artifacts/contracts/DAO/governance-token/BOBA.sol/BOBA.json'
import L2BobaJson from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'

import L1LiquidityPoolJson from '@boba/contracts/artifacts/contracts/LP/L1LiquidityPool.sol/L1LiquidityPool.json'
import L2LiquidityPoolJson from '@boba/contracts/artifacts/contracts/LP/L2LiquidityPool.sol/L2LiquidityPool.json'

import GovernorBravoDelegateJson from '@boba/contracts/artifacts/contracts/DAO/governance/GovernorBravoDelegate.sol/GovernorBravoDelegate.json'

import { OptimismEnv } from './shared/env'

describe('Dao Action Test', async () => {

  let Factory__L1ERC20: ContractFactory
  let Factory__L2ERC20: ContractFactory

  let L1LiquidityPool: Contract
  let L2LiquidityPool: Contract
  let L1ERC20: Contract
  let L2ERC20: Contract
  let L1Boba: Contract
  let L2Boba: Contract
  let L1StandardBridge: Contract

  let Governor: Contract

  let L2StandardBridgeAddress
  let quorumVotesPlus

  let initialL1LPUserRewardMinFeeRate
  let initialL1LPUserRewardMaxFeeRate
  let initialL1LPOwnerRewardFeeRate
  let initialL2LPUserRewardMinFeeRate
  let initialL2LPUserRewardMaxFeeRate
  let initialL2LPOwnerRewardFeeRate

  let env: OptimismEnv

  const proposalStates = [
    'Pending',
    'Active',
    'Canceled',
    'Defeated',
    'Succeeded',
    'Queued',
    'Expired',
    'Executed',
  ]

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

    L2ERC20 = await Factory__L2ERC20.deploy(
      L2StandardBridgeAddress,
      L1ERC20.address,
      'JLKN',
      'JLKN',
      18
    )
    await L2ERC20.deployTransaction.wait()

    // increase l1 time and in turn change the l2 timestamp
    await env.l1Provider.send("evm_increaseTime", [time])

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

    L1Boba = new Contract(
      env.addressesBOBA.TOKENS.BOBA.L1,
      L1BobaJson.abi,
      env.l1Wallet
    )

    const L1StandardBridgeAddress = await env.addressManager.getAddress(
      'Proxy__L1StandardBridge'
    )

    L1StandardBridge = getContractFactory(
      'L1StandardBridge',
      env.l1Wallet
    ).attach(L1StandardBridgeAddress)

    L2StandardBridgeAddress = await L1StandardBridge.l2TokenBridge()

    L2Boba = new Contract(
      env.addressesBOBA.TOKENS.BOBA.L2,
      L2BobaJson.abi,
      env.l2Wallet
    )

    L1LiquidityPool = new Contract(
      env.addressesBOBA.Proxy__L1LiquidityPool,
      L1LiquidityPoolJson.abi,
      env.l1Wallet
    )

    L2LiquidityPool = new Contract(
      env.addressesBOBA.Proxy__L2LiquidityPool,
      L2LiquidityPoolJson.abi,
      env.l2Wallet
    )

    Governor = new Contract(
      env.addressesBOBA.GovernorBravoDelegator,
      GovernorBravoDelegateJson.abi,
      env.l2Wallet
    )

    const L2Balance = await L2Boba.balanceOf(env.l2Wallet.address)

    quorumVotesPlus = (await Governor.quorumVotes()).add(utils.parseEther('100000'))

    if (L2Balance.lt(quorumVotesPlus)) {
      const approveL1BobaTX = await L1Boba.approve(
        L1StandardBridge.address,
        quorumVotesPlus
      )
      await approveL1BobaTX.wait()

      await env.waitForXDomainTransaction(
        env.l1Bridge.depositERC20(
          L1Boba.address,
          L2Boba.address,
          quorumVotesPlus,
          9999999,
          ethers.utils.formatBytes32String(new Date().getTime().toString())
        ),
        Direction.L1ToL2
      )
    }
  })

  describe('Config fee L2 LP', async () => {
    before(async () => {
      // get the initial fee config
      initialL2LPUserRewardMinFeeRate = await L2LiquidityPool.userRewardMinFeeRate()
      initialL2LPUserRewardMaxFeeRate = await L2LiquidityPool.userRewardMaxFeeRate()
      initialL2LPOwnerRewardFeeRate = await L2LiquidityPool.ownerRewardFeeRate()
    })

    it('should delegate voting rights', async () => {
      const delegateTx = await L2Boba.delegate(env.l2Wallet.address)
      await delegateTx.wait()
      const updatedDelegate = await L2Boba.delegates(env.l2Wallet.address)
      expect(updatedDelegate).to.eq(env.l2Wallet.address)
      const currentVotes = await L2Boba.getCurrentVotes(env.l2Wallet.address)
      expect(currentVotes).to.eq(BigNumber.from(quorumVotesPlus))
    })

    it('should create a new proposal to configure fee', async () => {
      try {
        const priorProposalID = (await Governor.proposalCount())._hex
        console.log(priorProposalID.toString())
        if (priorProposalID !== '0x00') {
          const priorState = await Governor.state(priorProposalID)

          console.log(priorState.toString())
          // clear any pending or active proposal
          if (priorState === 0 || priorState === 1) {
            const cancelTx = await Governor.cancel(priorProposalID)
            await cancelTx.wait()
          }
        }
        await moveTimeForward()

        const addresses = [env.addressesBOBA.Proxy__L2LiquidityPool] // the address of the contract where the function will be called
        const values = [0] // the eth necessary to send to the contract above
        const signatures = ['configureFee(uint256,uint256,uint256)'] // the function that will carry out the proposal
        const updatedUserRewardMinFeeRate = initialL2LPUserRewardMinFeeRate.toNumber() + 1
        const updatedUserRewardMaxFeeRate = initialL2LPUserRewardMaxFeeRate.toNumber() + 1
        const updatedOwnerRewardFeeRate = initialL2LPOwnerRewardFeeRate.toNumber() + 1

        const calldatas = [ethers.utils.defaultAbiCoder.encode( // the parameter for the above function
            ['uint256', 'uint256', 'uint256'],
            [updatedUserRewardMinFeeRate, updatedUserRewardMaxFeeRate, updatedOwnerRewardFeeRate]
        )]

        const description = '# Update Fee for swap-ons' // the description of the proposal

        // submit the proposal
        const proposeTx = await Governor.propose(
          addresses,
          values,
          signatures,
          calldatas,
          description
        )
        await proposeTx.wait()

        const proposalID = (await Governor.proposalCount())._hex

        // const proposal = await Governor.proposals(proposalID)
        // console.log(`Proposal:`, proposal)

        const state = await Governor.state(proposalID)
        expect(proposalStates[state]).to.deep.eq('Pending')
      } catch (error) {
        // cancel the current proposal if there's a problem to avoid errors on rerun
        const proposalID = (await Governor.proposalCount())._hex
        const cancelTx = await Governor.cancel(proposalID)
        await cancelTx.wait()
      }
    })

    it('should cast vote to the proposal and wait for voting period to end', async () => {
      try {
        // get current voting delay from contract
        const votingDelay = (await Governor.votingDelay()).toNumber()
        // mock timestmap
        await moveTimeForward(votingDelay)

        const proposalID = (await Governor.proposalCount())._hex

        await Governor.castVote(proposalID, 1)

        // const proposal = await Governor.proposals(proposalID)
        // console.log(`Proposal End Block:`, proposal.endBlock.toString())

        const stateAfterVote = await Governor.state(proposalID)
        expect(proposalStates[stateAfterVote]).to.deep.eq('Active')

        // wait till voting period ends
        console.log("\twaiting for voting period to end...")

        const votingPeriod = (await Governor.votingPeriod()).toNumber()
        // mock timestamp
        await moveTimeForward(votingPeriod)

        const stateAfterVotingPeriod = await Governor.state(proposalID)
        expect(proposalStates[stateAfterVotingPeriod]).to.deep.eq('Succeeded')
      } catch (error) {
        // cancel the current proposal if there's a problem to avoid errors on rerun
        const proposalID = (await Governor.proposalCount())._hex
        const cancelTx = await Governor.cancel(proposalID)
        await cancelTx.wait()
      }
    }).timeout(100000)

    it('should queue the proposal successfully', async () => {
      const proposalID = (await Governor.proposalCount())._hex
      const queueTx = await Governor.queue(proposalID)
      await queueTx.wait()

      const state = await Governor.state(proposalID)
      expect(proposalStates[state]).to.deep.eq('Queued')
    })

    it('should execute the proposal successfully', async () => {
      const proposalID = (await Governor.proposalCount())._hex
      const executeTx = await Governor.execute(proposalID)
      await executeTx.wait()

      const state = await Governor.state(proposalID)
      expect(proposalStates[state]).to.deep.eq('Executed')

      const userRewardMinFeeRate = await L2LiquidityPool.userRewardMinFeeRate()
      const userRewardMaxFeeRate = await L2LiquidityPool.userRewardMaxFeeRate()
      expect(userRewardMinFeeRate).to.deep.eq(initialL2LPUserRewardMinFeeRate.add(1))
      expect(userRewardMaxFeeRate).to.deep.eq(initialL2LPUserRewardMaxFeeRate.add(1))
      const ownerRewardFeeRate = await L2LiquidityPool.ownerRewardFeeRate()
      expect(ownerRewardFeeRate).to.deep.eq(initialL2LPOwnerRewardFeeRate.add(1))
    })
  })

  // test configFee for fast-exits
  describe('Config fee L1 LP', async () => {
    before(async () => {
      // get the initial fee config
      initialL1LPUserRewardMinFeeRate = await L1LiquidityPool.userRewardMinFeeRate()
      initialL1LPUserRewardMaxFeeRate = await L1LiquidityPool.userRewardMaxFeeRate()
      initialL1LPOwnerRewardFeeRate = await L1LiquidityPool.ownerRewardFeeRate()
    })

    it('should create a new proposal to configure fee', async () => {
      try {
        const priorProposalID = (await Governor.proposalCount())._hex
        if (priorProposalID !== '0x00') {
          const priorState = await Governor.state(priorProposalID)
          // clear any pending or active proposal
          if (priorState === 0 || priorState === 1) {
            const cancelTx = await Governor.cancel(priorProposalID)
            await cancelTx.wait()
          }
        }
        await moveTimeForward()

        const addresses = [env.addressesBOBA.Proxy__L2LiquidityPool] // the address of the contract where the function will be called
        const values = [0] // the eth necessary to send to the contract above
        const signatures = ['configureFeeExits(uint256,uint256,uint256)'] // the function that will carry out the proposal
        const updatedUserRewardMinFeeRate = initialL1LPUserRewardMinFeeRate.toNumber() + 1
        const updatedUserRewardMaxFeeRate = initialL1LPUserRewardMaxFeeRate.toNumber()
        const updatedOwnerRewardFeeRate = initialL1LPOwnerRewardFeeRate.toNumber() + 1

        const calldatas = [ethers.utils.defaultAbiCoder.encode( // the parameter for the above function
            ['uint256', 'uint256', 'uint256'],
            [updatedUserRewardMinFeeRate, updatedUserRewardMaxFeeRate, updatedOwnerRewardFeeRate]
        )]

        const description = '# Update Fee for swap-offs' // the description of the proposal

        // submitting the proposal
        const proposeTx = await Governor.propose(
          addresses,
          values,
          signatures,
          calldatas,
          description
        )
        await proposeTx.wait()

        const proposalID = (await Governor.proposalCount())._hex

        // const proposal = await Governor.proposals(proposalID)
        // console.log(`Proposal:`, proposal)

        const state = await Governor.state(proposalID)
        expect(proposalStates[state]).to.deep.eq('Pending')
      } catch (error) {
        // cancel the current proposal if there's a problem to avoid errors on rerun
        const proposalID = (await Governor.proposalCount())._hex
        const cancelTx = await Governor.cancel(proposalID)
        await cancelTx.wait()
      }
    })

    it('should cast vote to the proposal and wait for voting period to end', async () => {
      try {
        // get current voting delay from contract
        const votingDelay = (await Governor.votingDelay()).toNumber()
        // mock timestamp
        await moveTimeForward(votingDelay)

        const proposalID = (await Governor.proposalCount())._hex

        await Governor.castVote(proposalID, 1)

        // const proposal = await Governor.proposals(proposalID)
        // console.log(`Proposal End Block:`, proposal.endBlock.toString())

        const stateAfterVote = await Governor.state(proposalID)
        expect(proposalStates[stateAfterVote]).to.deep.eq('Active')

        // wait till voting period ends
        console.log("\twaiting for voting period to end...")

        const votingPeriod = (await Governor.votingPeriod()).toNumber()
        // mock timestamp
        await moveTimeForward(votingPeriod)

        const stateAfterVotingPeriod = await Governor.state(proposalID)
        expect(proposalStates[stateAfterVotingPeriod]).to.deep.eq('Succeeded')
      } catch (error) {
        // cancel the current proposal if there's a problem to avoid errors on rerun
        const proposalID = (await Governor.proposalCount())._hex
        const cancelTx = await Governor.cancel(proposalID)
        await cancelTx.wait()
      }
    }).timeout(100000)

    it('should queue the proposal successfully', async () => {
      const proposalID = (await Governor.proposalCount())._hex
      const queueTx = await Governor.queue(proposalID)
      await queueTx.wait()

      const state = await Governor.state(proposalID)
      expect(proposalStates[state]).to.deep.eq('Queued')
    })

    it('should execute the proposal successfully', async () => {
      const proposalID = (await Governor.proposalCount())._hex
      const executeTx = await Governor.execute(proposalID)
      await executeTx.wait()

      const state = await Governor.state(proposalID)
      expect(proposalStates[state]).to.deep.eq('Executed')

      // involves xDomain message, wait for xdomain relay
      await env.waitForXDomainTransactionFast(executeTx, Direction.L2ToL1)

      const userRewardMinFeeRate = await L1LiquidityPool.userRewardMinFeeRate()
      const userRewardMaxFeeRate = await L1LiquidityPool.userRewardMaxFeeRate()
      expect(userRewardMinFeeRate).to.deep.eq(initialL1LPUserRewardMinFeeRate.add(1))
      expect(userRewardMaxFeeRate).to.deep.eq(initialL1LPUserRewardMaxFeeRate)
      const ownerRewardFeeRate = await L1LiquidityPool.ownerRewardFeeRate()
      expect(ownerRewardFeeRate).to.deep.eq(initialL1LPOwnerRewardFeeRate.add(1))
    }).timeout(100000)
  })
})
