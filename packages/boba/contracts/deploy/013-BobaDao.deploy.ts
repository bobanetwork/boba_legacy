/* Imports: External */
import { Contract, utils } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import {
  deployBobaContract,
  getDeploymentSubmission,
  registerBobaAddress,
} from '../src/hardhat-deploy-ethers'

// let Factory__Comp: ContractFactory
// let Comp: Contract

let GovernorBravoDelegate: Contract
let GovernorBravoDelegator: Contract
let Timelock: Contract

const getTimestamp = async (hre) => {
  const blockNumber = await (
    hre as any
  ).deployConfig.l2Provider.getBlockNumber()
  const block = await (hre as any).deployConfig.l2Provider.getBlock(blockNumber)
  return block.timestamp
}

const deployFn: DeployFunction = async (hre) => {
  if ((hre as any).deployConfig.isLocalAltL1) {
    return
  }
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  let delay_before_execute_s
  let eta_delay_s
  let governor_voting_period
  let governor_voting_delay
  let governor_proposal_threshold

  if (process.env.NETWORK === 'mainnet') {
    // set config for mainnet
    delay_before_execute_s = 172800 // 2 days
    eta_delay_s = 182800
    governor_voting_period = 259200 // 3 days
    governor_voting_delay = 172800 // 2 days
    governor_proposal_threshold = utils.parseEther('100000')
  } else {
    // set config for local/rinkeby
    delay_before_execute_s = 0
    eta_delay_s = 5
    governor_voting_period = 259200 // 3 days in seconds
    governor_voting_delay = 172800 // 2 days in seconds
    governor_proposal_threshold = utils.parseEther('50000')
  }

  // get deployed BOBA L2

  const BobaL2 = await hre.deployments.getOrNull('TK_L2BOBA')
  const xBobaL2 = await hre.deployments.getOrNull('TK_L2xBOBA')
  console.log(`L2_BOBA is located at: ${BobaL2.address}`)
  console.log(`L2_xBOBA is located at: ${xBobaL2.address}`)

  Timelock = await deployBobaContract(
    hre,
    'Timelock',
    [(hre as any).deployConfig.deployer_l2.address, delay_before_execute_s],
    (hre as any).deployConfig.deployer_l2
  )
  console.log(`Timelock deployed to: ${Timelock.address}`)

  const TimelockDeploymentSubmission = getDeploymentSubmission(Timelock)
  await hre.deployments.save('Timelock', TimelockDeploymentSubmission)
  await registerBobaAddress(addressManager, 'Timelock', Timelock.address)

  // deploy governorDelegate
  GovernorBravoDelegate = await deployBobaContract(
    hre,
    'GovernorBravoDelegate',
    [],
    (hre as any).deployConfig.deployer_l2
  )
  console.log(
    `GovernorBravoDelegate deployed to: ${GovernorBravoDelegate.address}`
  )

  const GovernorBravoDelegateDeploymentSubmission = getDeploymentSubmission(
    GovernorBravoDelegate
  )
  await hre.deployments.save(
    'GovernorBravoDelegate',
    GovernorBravoDelegateDeploymentSubmission
  )
  await registerBobaAddress(
    addressManager,
    'GovernorBravoDelegate',
    GovernorBravoDelegate.address
  )

  // deploy GovernorBravoDelegator
  GovernorBravoDelegator = await deployBobaContract(
    hre,
    'GovernorBravoDelegator',
    [
      Timelock.address,
      BobaL2.address,
      xBobaL2.address,
      Timelock.address,
      GovernorBravoDelegate.address,
      governor_voting_period, // VOTING PERIOD - duration of the voting period in seconds
      governor_voting_delay, // VOTING DELAY - time between when a proposal is proposed and when the voting period starts, in seconds
      governor_proposal_threshold, // the votes necessary to propose
    ],
    (hre as any).deployConfig.deployer_l2
  )
  console.log(
    `GovernorBravoDelegator deployed to: ${GovernorBravoDelegator.address}`
  )

  const GovernorBravoDelegatorDeploymentSubmission = getDeploymentSubmission(
    GovernorBravoDelegator
  )
  await hre.deployments.save(
    'GovernorBravoDelegator',
    GovernorBravoDelegatorDeploymentSubmission
  )
  await registerBobaAddress(
    addressManager,
    'GovernorBravoDelegator',
    GovernorBravoDelegator.address
  )

  // set Dao in L2LP
  // const Proxy__L2LiquidityPoolDeployment = await hre.deployments.getOrNull(
  //   'Proxy__L2LiquidityPool'
  // )

  // Proxy__L2LiquidityPool = new Contract(
  //   Proxy__L2LiquidityPoolDeployment.address,
  //   L2LiquidityPoolJson.abi,
  //   (hre as any).deployConfig.deployer_l2
  // )

  // await Proxy__L2LiquidityPool.transferDAORole(Timelock.address)
  // console.log(`LP Dao role transferred to Timelock`)

  // set admin Timelock
  console.log('Queue setPendingAdmin...')

  let eta1
  let setPendingAdminData
  try {
    ;[eta1, setPendingAdminData] = await setPendingAdmin(hre, eta_delay_s)
  } catch (error) {
    console.log(`setPendingAdmin failed because of : ${error}`)
    ;[eta1, setPendingAdminData] = await setPendingAdmin(hre, eta_delay_s)
  }

  console.log('Queued setPendingAdmin!')
  console.log(`Time transaction was made: ${await getTimestamp(hre)}`)
  console.log(`Time at which transaction may be executed: ${eta1}`)

  console.log('Queue Initiate...')
  // call initiate() to complete setAdmin
  // set eta to be the current timestamp for local and rinkeby
  const eta2 = (await getTimestamp(hre)) + eta_delay_s

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

  console.log('Queued Initiate!')
  console.log(`Time transaction was made: ${await getTimestamp(hre)}`)
  console.log(`Time at which transaction can be executed: ${eta2}`)

  // if it's local/rinkeby attempt to execute transactions
  if (process.env.NETWORK !== 'mainnet') {
    console.log('Execute setPendingAdmin...')
    // Execute the transaction that will set the admin of Timelock to the GovernorBravoDelegator contract
    await new Promise((r) => setTimeout(r, 5000))
    // since this is local submit random tx - (can be made better)
    await (hre as any).deployConfig.deployer_l2.sendTransaction({
      to: (hre as any).deployConfig.deployer_l2.address,
      value: utils.parseEther('0.01'),
    })

    await Timelock.executeTransaction(
      Timelock.address,
      0,
      'setPendingAdmin(address)', // the function to be called
      setPendingAdminData,
      eta1
    )
    console.log('Executed setPendingAdmin!')

    console.log('Execute initiate...')

    await Timelock.executeTransaction(
      GovernorBravoDelegator.address,
      0,
      '_initiate()',
      initiateData,
      eta2
    )
    console.log('Executed initiate, acceptAdmin() completed')
  } else {
    // TODO - replace with a script that can be called on ETA instead
    console.log(
      '\nPlease copy these values and call executeTransaction() on Timelock twice'
    )
    console.log(
      'from the deployer account in the following sequence with the below parameters'
    )
    console.log('when the ETA is reached')
    console.log('---------------------------')
    console.log('target :', Timelock.address)
    console.log('value :', 0)
    console.log('signature : setPendingAdmin(address)')
    console.log('data :', setPendingAdminData)
    console.log('eta :', eta1)
    console.log('---------------------------')
    console.log('target :', GovernorBravoDelegator.address)
    console.log('value :', 0)
    console.log('signature : _initiate()')
    console.log('data :', initiateData)
    console.log('eta :', eta2)
  }
}

const setPendingAdmin = async (hre, eta_delay_s) => {
  // set eta to be the current timestamp for local and rinkeby
  const eta1 = (await getTimestamp(hre)) + eta_delay_s

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
  return [eta1, setPendingAdminData]
}

deployFn.tags = ['DAO', 'BOBA']

export default deployFn
