import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import { Contract, ContractFactory, BigNumber, utils, ethers } from 'ethers'
import { Direction } from './shared/watcher-utils'
import { getContractFactory } from '@eth-optimism/contracts'

import L1BobaJson from '@boba/contracts/artifacts/contracts/DAO/governance-token/BOBA.sol/BOBA.json'
import L2BobaJson from '@boba/contracts/artifacts/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json'
import xBobaJson from '@boba/contracts/artifacts/contracts/standards/xL2GovernanceERC20.sol/xL2GovernanceERC20.json'

import L1LiquidityPoolJson from '@boba/contracts/artifacts/contracts/LP/L1LiquidityPool.sol/L1LiquidityPool.json'
import L2LiquidityPoolJson from '@boba/contracts/artifacts/contracts/LP/L2LiquidityPool.sol/L2LiquidityPool.json'

// use a mock contract only to adjust time params freely
import GovernorBravoDelegateJson from '../artifacts/contracts/MockGovernorBravoDelegate.sol/MockGovernorBravoDelegate.json'
import TimelockJson from '../artifacts/contracts/MockTimelock.sol/MockTimelock.json'

import GovernorBravoDelegatorJson from '@boba/contracts/artifacts/contracts/DAO/governance/GovernorBravoDelegator.sol/GovernorBravoDelegator.json'

import { OptimismEnv } from './shared/env'

describe('Dao Action Test', async () => {
  let Factory__GovernorBravoDelegate: ContractFactory
  let GovernorBravoDelegate: Contract

  let Factory__GovernorBravoDelegator: ContractFactory
  let GovernorBravoDelegator: Contract

  let Factory__Timelock: ContractFactory
  let Timelock: Contract

  let L1LiquidityPool: Contract
  let L2LiquidityPool: Contract
  let L1Boba: Contract
  let L2Boba: Contract
  let xBoba: Contract
  let L1StandardBridge: Contract

  let Governor: Contract

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
    await new Promise((resolve) => setTimeout(resolve, time))
    // submit random tx
    await env.l2Wallet.sendTransaction({
      to: env.l2Wallet_2.address,
      value: utils.parseEther('0.01'),
    })
  }

  const getTimestamp = async () => {
    const blockNumber = await env.l2Provider.getBlockNumber()
    const block = await env.l2Provider.getBlock(blockNumber)
    return block.timestamp
  }

  const deployDAO = async (timeLockAddress: string = '') => {
    const delay_before_execute_s = 0
    const eta_delay_s = 5
    const governor_voting_period = 259200 // 3 days in seconds
    const governor_voting_delay = 172800 // 2 days in seconds
    const governor_proposal_threshold = utils.parseEther('50000')

    const BobaL2 = env.addressesBOBA.TOKENS.BOBA.L2
    const xBobaL2 = env.addressesBOBA.TOKENS.xBOBA.L2

    Factory__Timelock = new ContractFactory(
      TimelockJson.abi,
      TimelockJson.bytecode,
      env.l2Wallet
    )

    // if timeLock exists use the contract
    if (timeLockAddress !== '') {
      Timelock = new Contract(timeLockAddress, TimelockJson.abi, env.l2Wallet)
      await Timelock.setAdminMock(env.l2Wallet.address)
    } else {
      Timelock = await Factory__Timelock.deploy(
        env.l2Wallet.address,
        delay_before_execute_s
      )
      await Timelock.deployTransaction.wait()
    }

    Factory__GovernorBravoDelegate = new ContractFactory(
      GovernorBravoDelegateJson.abi,
      GovernorBravoDelegateJson.bytecode,
      env.l2Wallet
    )

    GovernorBravoDelegate = await Factory__GovernorBravoDelegate.deploy()
    await GovernorBravoDelegate.deployTransaction.wait()

    // deploy GovernorBravoDelegator
    Factory__GovernorBravoDelegator = new ContractFactory(
      GovernorBravoDelegatorJson.abi,
      GovernorBravoDelegatorJson.bytecode,
      env.l2Wallet
    )

    GovernorBravoDelegator = await Factory__GovernorBravoDelegator.deploy(
      Timelock.address,
      BobaL2,
      xBobaL2,
      Timelock.address,
      GovernorBravoDelegate.address,
      governor_voting_period, // VOTING PERIOD - duration of the voting period in seconds
      governor_voting_delay, // VOTING DELAY - time between when a proposal is proposed and when the voting period starts, in seconds
      governor_proposal_threshold // the votes necessary to propose
    )
    await GovernorBravoDelegator.deployTransaction.wait()

    // set admin Timelock
    // set eta to be the current timestamp for local and rinkeby
    const eta1 = (await getTimestamp()) + eta_delay_s

    const setPendingAdminData = utils.defaultAbiCoder.encode(
      // the parameters for the setPendingAdmin function
      ['address'],
      [GovernorBravoDelegator.address]
    )

    const setPendingAdminTx = await Timelock.queueTransaction(
      Timelock.address,
      0, //is the amount of ETH you want to send with an execution to the Timelock
      'setPendingAdmin(address)', // the function to be called
      setPendingAdminData,
      eta1 // end of timelock in unix time
    )

    await setPendingAdminTx.wait()
    // call initiate() to complete setAdmin
    // set eta to be the current timestamp for local and rinkeby
    const eta2 = (await getTimestamp()) + eta_delay_s

    const initiateData = utils.defaultAbiCoder.encode(
      // parameters to initate the GovernorBravoDelegate contract
      ['bytes'],
      [[]]
    )

    const initiateTx = await Timelock.queueTransaction(
      GovernorBravoDelegator.address,
      0,
      '_initiate()',
      initiateData,
      eta2
    )

    await initiateTx.wait()
    // Execute the transaction that will set the admin of Timelock to the GovernorBravoDelegator contract
    await moveTimeForward(5000)
    await Timelock.executeTransaction(
      Timelock.address,
      0,
      'setPendingAdmin(address)', // the function to be called
      setPendingAdminData,
      eta1
    )

    await Timelock.executeTransaction(
      GovernorBravoDelegator.address,
      0,
      '_initiate()',
      initiateData,
      eta2
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

    L2Boba = new Contract(
      env.addressesBOBA.TOKENS.BOBA.L2,
      L2BobaJson.abi,
      env.l2Wallet
    )

    xBoba = new Contract(
      env.addressesBOBA.TOKENS.xBOBA.L2,
      xBobaJson.abi,
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

    if ((await L2LiquidityPool.DAO()) !== env.l2Wallet.address) {
      // do not deploy Timelock
      const timeLockAddress = await L2LiquidityPool.DAO()
      await deployDAO(timeLockAddress)
    } else {
      // this is the first time - deploy Timelock
      await deployDAO()
      // and set Dao in L2LP
      await L2LiquidityPool.transferDAORole(Timelock.address)
    }

    Governor = new Contract(
      GovernorBravoDelegator.address,
      GovernorBravoDelegateJson.abi,
      env.l2Wallet
    )

    // mock the voting period and voting delay time
    await Timelock.setVotingDelayMock(Governor.address, 15)
    await Timelock.setVotingPeriodMock(Governor.address, 15)

    const L2Balance = await L2Boba.balanceOf(env.l2Wallet.address)

    quorumVotesPlus = (await Governor.quorumVotes()).add(
      utils.parseEther('100000')
    )

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

  describe('Get xBOBA', async () => {
    before(async () => {
      const depositAmount = utils.parseEther('110000')

      const prexBobaAmount = await xBoba.balanceOf(env.l2Wallet.address)

      const approveL2BobaTX = await L2Boba.approve(
        L2LiquidityPool.address,
        depositAmount
      )
      await approveL2BobaTX.wait()

      const addLiquidityTX = await L2LiquidityPool.addLiquidity(
        depositAmount,
        L2Boba.address
      )
      await addLiquidityTX.wait()

      const postBobaAmount = await xBoba.balanceOf(env.l2Wallet.address)
      expect(prexBobaAmount).to.deep.equal(postBobaAmount.sub(depositAmount))
    })

    it('{tag:other} should delegate voting rights', async () => {
      const delegateTx = await xBoba.delegate(env.l2Wallet.address)
      await delegateTx.wait()
      const updatedDelegate = await xBoba.delegates(env.l2Wallet.address)
      expect(updatedDelegate).to.eq(env.l2Wallet.address)
      const xBobaBalance = await xBoba.balanceOf(env.l2Wallet.address)
      const currentVotes = await xBoba.getCurrentVotes(env.l2Wallet.address)
      expect(currentVotes).to.eq(xBobaBalance)
    })
  })

  describe('Config fee L2 LP', async () => {
    before(async () => {
      // get the initial fee config
      initialL2LPUserRewardMinFeeRate =
        await L2LiquidityPool.userRewardMinFeeRate()
      initialL2LPUserRewardMaxFeeRate =
        await L2LiquidityPool.userRewardMaxFeeRate()
      initialL2LPOwnerRewardFeeRate = await L2LiquidityPool.ownerRewardFeeRate()
    })

    it('{tag:other} should delegate voting rights', async () => {
      const delegateTx = await L2Boba.delegate(env.l2Wallet.address)
      await delegateTx.wait()
      const updatedDelegate = await L2Boba.delegates(env.l2Wallet.address)
      expect(updatedDelegate).to.eq(env.l2Wallet.address)
      const L2BobaBalance = await L2Boba.balanceOf(env.l2Wallet.address)
      const currentVotes = await L2Boba.getCurrentVotes(env.l2Wallet.address)
      expect(currentVotes).to.eq(L2BobaBalance)
    })

    it('{tag:other} should create a new proposal to configure fee', async () => {
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
        const updatedUserRewardMinFeeRate =
          initialL2LPUserRewardMinFeeRate.toNumber() + 1
        const updatedUserRewardMaxFeeRate =
          initialL2LPUserRewardMaxFeeRate.toNumber() + 1
        const updatedOwnerRewardFeeRate =
          initialL2LPOwnerRewardFeeRate.toNumber() + 1

        const calldatas = [
          ethers.utils.defaultAbiCoder.encode(
            // the parameter for the above function
            ['uint256', 'uint256', 'uint256'],
            [
              updatedUserRewardMinFeeRate,
              updatedUserRewardMaxFeeRate,
              updatedOwnerRewardFeeRate,
            ]
          ),
        ]

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

    it('{tag:other} should cast vote to the proposal and wait for voting period to end', async () => {
      try {
        // get current voting delay from contract
        const votingDelay = (await Governor.votingDelay()).toNumber()
        console.log('\twaiting for voting period to start...')
        // mock timestmap
        // convert to milliseconds
        await moveTimeForward((votingDelay + 1) * 1000)

        const proposalID = (await Governor.proposalCount())._hex

        await Governor.castVote(proposalID, 1)

        // const proposal = await Governor.proposals(proposalID)
        // console.log(`Proposal End Block:`, proposal.endBlock.toString())

        const stateAfterVote = await Governor.state(proposalID)
        expect(proposalStates[stateAfterVote]).to.deep.eq('Active')

        // wait till voting period ends
        console.log('\twaiting for voting period to end...')

        const votingPeriod = (await Governor.votingPeriod()).toNumber()
        // mock timestamp
        await moveTimeForward((votingPeriod + 1) * 1000)

        const stateAfterVotingPeriod = await Governor.state(proposalID)
        expect(proposalStates[stateAfterVotingPeriod]).to.deep.eq('Succeeded')
      } catch (error) {
        console.log(error)
        // cancel the current proposal if there's a problem to avoid errors on rerun
        const proposalID = (await Governor.proposalCount())._hex
        const cancelTx = await Governor.cancel(proposalID)
        await cancelTx.wait()
      }
    })

    it('{tag:other} should queue the proposal successfully', async () => {
      const proposalID = (await Governor.proposalCount())._hex
      const queueTx = await Governor.queue(proposalID)
      await queueTx.wait()

      const state = await Governor.state(proposalID)
      expect(proposalStates[state]).to.deep.eq('Queued')
    })

    it('{tag:other} should execute the proposal successfully', async () => {
      const proposalID = (await Governor.proposalCount())._hex
      const executeTx = await Governor.execute(proposalID)
      await executeTx.wait()

      const state = await Governor.state(proposalID)
      expect(proposalStates[state]).to.deep.eq('Executed')

      const userRewardMinFeeRate = await L2LiquidityPool.userRewardMinFeeRate()
      const userRewardMaxFeeRate = await L2LiquidityPool.userRewardMaxFeeRate()
      expect(userRewardMinFeeRate).to.deep.eq(
        initialL2LPUserRewardMinFeeRate.add(1)
      )
      expect(userRewardMaxFeeRate).to.deep.eq(
        initialL2LPUserRewardMaxFeeRate.add(1)
      )
      const ownerRewardFeeRate = await L2LiquidityPool.ownerRewardFeeRate()
      expect(ownerRewardFeeRate).to.deep.eq(
        initialL2LPOwnerRewardFeeRate.add(1)
      )
    })
  })

  // test configFee for fast-exits
  describe('Config fee L1 LP', async () => {
    before(async () => {
      // get the initial fee config
      initialL1LPUserRewardMinFeeRate =
        await L1LiquidityPool.userRewardMinFeeRate()
      initialL1LPUserRewardMaxFeeRate =
        await L1LiquidityPool.userRewardMaxFeeRate()
      initialL1LPOwnerRewardFeeRate = await L1LiquidityPool.ownerRewardFeeRate()
    })

    it('{tag:other} should create a new proposal to configure fee', async () => {
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
        const updatedUserRewardMinFeeRate =
          initialL1LPUserRewardMinFeeRate.toNumber() + 1
        const updatedUserRewardMaxFeeRate =
          initialL1LPUserRewardMaxFeeRate.toNumber()
        const updatedOwnerRewardFeeRate =
          initialL1LPOwnerRewardFeeRate.toNumber() + 1

        const calldatas = [
          ethers.utils.defaultAbiCoder.encode(
            // the parameter for the above function
            ['uint256', 'uint256', 'uint256'],
            [
              updatedUserRewardMinFeeRate,
              updatedUserRewardMaxFeeRate,
              updatedOwnerRewardFeeRate,
            ]
          ),
        ]

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

    it('{tag:other} should cast vote to the proposal and wait for voting period to end', async () => {
      try {
        // get current voting delay from contract
        const votingDelay = (await Governor.votingDelay()).toNumber()
        console.log('\twaiting for voting period to start...')
        // mock timestamp
        await moveTimeForward((votingDelay + 1) * 1000)

        const proposalID = (await Governor.proposalCount())._hex

        await Governor.castVote(proposalID, 1)

        // const proposal = await Governor.proposals(proposalID)
        // console.log(`Proposal End Block:`, proposal.endBlock.toString())

        const stateAfterVote = await Governor.state(proposalID)
        expect(proposalStates[stateAfterVote]).to.deep.eq('Active')

        // wait till voting period ends
        console.log('\twaiting for voting period to end...')

        const votingPeriod = (await Governor.votingPeriod()).toNumber()
        // mock timestamp
        await moveTimeForward((votingPeriod + 1) * 1000)

        const stateAfterVotingPeriod = await Governor.state(proposalID)
        expect(proposalStates[stateAfterVotingPeriod]).to.deep.eq('Succeeded')
      } catch (error) {
        console.log(error)
        // cancel the current proposal if there's a problem to avoid errors on rerun
        const proposalID = (await Governor.proposalCount())._hex
        const cancelTx = await Governor.cancel(proposalID)
        await cancelTx.wait()
      }
    })

    it('{tag:other} should queue the proposal successfully', async () => {
      const proposalID = (await Governor.proposalCount())._hex
      const queueTx = await Governor.queue(proposalID)
      await queueTx.wait()

      const state = await Governor.state(proposalID)
      expect(proposalStates[state]).to.deep.eq('Queued')
    })

    it('{tag:other} should execute the proposal successfully', async () => {
      const proposalID = (await Governor.proposalCount())._hex
      const executeTx = await Governor.execute(proposalID)
      await executeTx.wait()

      const state = await Governor.state(proposalID)
      expect(proposalStates[state]).to.deep.eq('Executed')

      // involves xDomain message, wait for xdomain relay
      await env.waitForXDomainTransactionFast(executeTx, Direction.L2ToL1)

      const userRewardMinFeeRate = await L1LiquidityPool.userRewardMinFeeRate()
      const userRewardMaxFeeRate = await L1LiquidityPool.userRewardMaxFeeRate()
      expect(userRewardMinFeeRate).to.deep.eq(
        initialL1LPUserRewardMinFeeRate.add(1)
      )
      expect(userRewardMaxFeeRate).to.deep.eq(initialL1LPUserRewardMaxFeeRate)
      const ownerRewardFeeRate = await L1LiquidityPool.ownerRewardFeeRate()
      expect(ownerRewardFeeRate).to.deep.eq(
        initialL1LPOwnerRewardFeeRate.add(1)
      )
    })
  })
})
