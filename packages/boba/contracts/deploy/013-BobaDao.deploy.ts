/* Imports: External */
import { getContractFactory } from '@eth-optimism/contracts'
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory, utils, BigNumber } from 'ethers'
import { registerBobaAddress } from './000-Messenger.deploy'

// import CompJson from '../artifacts/contracts/DAO/Comp.sol/Comp.json'
import GovernorBravoDelegateJson from '../artifacts/contracts/DAO/governance/GovernorBravoDelegate.sol/GovernorBravoDelegate.json'
import GovernorBravoDelegatorJson from '../artifacts/contracts/DAO/governance/GovernorBravoDelegator.sol/GovernorBravoDelegator.json'
import TimelockJson from '../artifacts/contracts/DAO/governance/Timelock.sol/Timelock.json'
import L2LiquidityPoolJson from '../artifacts/contracts/LP/L2LiquidityPool.sol/L2LiquidityPool.json'

// let Factory__Comp: ContractFactory
// let Comp: Contract

let Factory__GovernorBravoDelegate: ContractFactory
let GovernorBravoDelegate: Contract

let Factory__GovernorBravoDelegator: ContractFactory
let GovernorBravoDelegator: Contract

let Factory__Timelock: ContractFactory
let Timelock: Contract

let Proxy__L2LiquidityPool: Contract

const getTimestamp = async (hre) => {
  const blockNumber = await (
    hre as any
  ).deployConfig.l2Provider.getBlockNumber()
  const block = await (hre as any).deployConfig.l2Provider.getBlock(blockNumber)
  return block.timestamp
}

const deployFn: DeployFunction = async (hre) => {
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

  Factory__Timelock = new ContractFactory(
    TimelockJson.abi,
    TimelockJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  Timelock = await Factory__Timelock.deploy(
    (hre as any).deployConfig.deployer_l2.address,
    delay_before_execute_s
  )
  await Timelock.deployTransaction.wait()
  console.log(`Timelock deployed to: ${Timelock.address}`)

  const TimelockDeploymentSubmission: DeploymentSubmission = {
    ...Timelock,
    receipt: Timelock.receipt,
    address: Timelock.address,
    abi: Timelock.abi,
  }

  await hre.deployments.save('Timelock', TimelockDeploymentSubmission)
  await registerBobaAddress(addressManager, 'Timelock', Timelock.address)

  // deploy governorDelegate
  Factory__GovernorBravoDelegate = new ContractFactory(
    GovernorBravoDelegateJson.abi,
    GovernorBravoDelegateJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  GovernorBravoDelegate = await Factory__GovernorBravoDelegate.deploy()
  await GovernorBravoDelegate.deployTransaction.wait()
  console.log(
    `GovernorBravoDelegate deployed to: ${GovernorBravoDelegate.address}`
  )

  const GovernorBravoDelegateDeploymentSubmission: DeploymentSubmission = {
    ...GovernorBravoDelegate,
    receipt: GovernorBravoDelegate.receipt,
    address: GovernorBravoDelegate.address,
    abi: GovernorBravoDelegate.abi,
  }

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
  Factory__GovernorBravoDelegator = new ContractFactory(
    GovernorBravoDelegatorJson.abi,
    GovernorBravoDelegatorJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  GovernorBravoDelegator = await Factory__GovernorBravoDelegator.deploy(
    Timelock.address,
    BobaL2.address,
    xBobaL2.address,
    Timelock.address,
    GovernorBravoDelegate.address,
    governor_voting_period, // VOTING PERIOD - duration of the voting period in seconds
    governor_voting_delay, // VOTING DELAY - time between when a proposal is proposed and when the voting period starts, in seconds
    governor_proposal_threshold // the votes necessary to propose
  )
  await GovernorBravoDelegator.deployTransaction.wait()
  console.log(
    `GovernorBravoDelegator deployed to: ${GovernorBravoDelegator.address}`
  )

  const GovernorBravoDelegatorDeploymentSubmission: DeploymentSubmission = {
    ...GovernorBravoDelegator,
    receipt: GovernorBravoDelegator.receipt,
    address: GovernorBravoDelegator.address,
    abi: GovernorBravoDelegator.abi,
  }

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

deployFn.tags = ['DAO', 'BOBA']

export default deployFn
