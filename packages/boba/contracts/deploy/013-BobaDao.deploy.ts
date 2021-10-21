/* Imports: External */
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory, utils, BigNumber } from 'ethers'
import chalk from 'chalk'

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
    const blockNumber = await (hre as any).deployConfig.l2Provider.getBlockNumber()
    const block = await (hre as any).deployConfig.l2Provider.getBlock(blockNumber);
    return block.timestamp
}

const deployFn: DeployFunction = async (hre) => {

  let delay_before_execute_s
  let eta_delay_s
  let governor_voting_period_s
  let governor_voting_delay_s
  let governor_proposal_threshold

  if (process.env.NETWORK === 'mainnet') {
    // set config for mainnet
    delay_before_execute_s = 172800 // 2 days
    eta_delay_s = 182800
    governor_voting_period_s = 3 * 24 * 60 * 60 // 3 days
    governor_voting_delay_s = 2 * 24 * 60 * 60 // 2 days
    governor_proposal_threshold = utils.parseEther('50000')
  } else {
    // set config for local/rinkeby
    delay_before_execute_s = 0
    eta_delay_s = 0
    governor_voting_period_s = 1000
    governor_voting_delay_s = 1
    governor_proposal_threshold = utils.parseEther('50000')
  }

// get deployed BOBA L2

  const BobaL2 = await hre.deployments.getOrNull('TK_L2BOBA')


  // Factory__Comp = new ContractFactory(
  //   CompJson.abi,
  //   CompJson.bytecode,
  //   (hre as any).deployConfig.deployer_l2
  // )

  // Comp = await Factory__Comp.deploy(
  //   (hre as any).deployConfig.deployer_l2.address
  // )
  // await Comp.deployTransaction.wait()
  console.log(
    ` 🌕 ${chalk.red('BobaL2 is located at:')} ${chalk.green(
      BobaL2.address
    )}`
  )

  // const CompDeploymentSubmission: DeploymentSubmission = {
  //   ...Comp,
  //   receipt: Comp.receipt,
  //   address: Comp.address,
  //   abi: Comp.abi,
  // }

  // await hre.deployments.save('Comp', CompDeploymentSubmission)

  // deploy Timelock

  // let delay_before_execute_s = 0 //seconds - normally set to 172800 aka 2 days, for example
  // if (process.env.NETWORK === 'mainnet') {
  //   delay_before_execute_s = 172800
  // }

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
  console.log(
    ` 🌕 ${chalk.red('Timelock deployed to:')} ${chalk.green(
        Timelock.address
    )}`
  )

  const TimelockDeploymentSubmission: DeploymentSubmission = {
    ...Timelock,
    receipt: Timelock.receipt,
    address: Timelock.address,
    abi: Timelock.abi,
  }

  await hre.deployments.save('Timelock', TimelockDeploymentSubmission)

  // deploy governorDelegate

  Factory__GovernorBravoDelegate = new ContractFactory(
    GovernorBravoDelegateJson.abi,
    GovernorBravoDelegateJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  GovernorBravoDelegate = await Factory__GovernorBravoDelegate.deploy()
  await GovernorBravoDelegate.deployTransaction.wait()
  console.log(
    ` 🌕 ${chalk.red('GovernorBravoDelegate deployed to:')} ${chalk.green(
      GovernorBravoDelegate.address
    )}`
  )

  const GovernorBravoDelegateDeploymentSubmission: DeploymentSubmission = {
    ...GovernorBravoDelegate,
    receipt: GovernorBravoDelegate.receipt,
    address: GovernorBravoDelegate.address,
    abi: GovernorBravoDelegate.abi,
  }

  await hre.deployments.save('GovernorBravoDelegate', GovernorBravoDelegateDeploymentSubmission)

  // deploy GovernorBravoDelegator

  Factory__GovernorBravoDelegator = new ContractFactory(
    GovernorBravoDelegatorJson.abi,
    GovernorBravoDelegatorJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  GovernorBravoDelegator = await Factory__GovernorBravoDelegator.deploy(
    Timelock.address,
    BobaL2.address,
    Timelock.address,
    GovernorBravoDelegate.address,
    governor_voting_period_s, // VOTING PERIOD - duration of the voting period in seconds
    governor_voting_delay_s, // VOTING DELAY - time between when a proposal is proposed and when the voting period starts, in seconds
    governor_proposal_threshold // the votes necessary to propose
  )
  await GovernorBravoDelegator.deployTransaction.wait()
  console.log(
    ` 🌕 ${chalk.red('GovernorBravoDelegator deployed to:')} ${chalk.green(
      GovernorBravoDelegator.address
    )}`
  )

  const GovernorBravoDelegatorDeploymentSubmission: DeploymentSubmission = {
    ...GovernorBravoDelegator,
    receipt: GovernorBravoDelegator.receipt,
    address: GovernorBravoDelegator.address,
    abi: GovernorBravoDelegator.abi,
  }

  await hre.deployments.save('GovernorBravoDelegator', GovernorBravoDelegatorDeploymentSubmission)

  // set Dao in LP

  const Proxy__L2LiquidityPoolDeployment = await hre.deployments.getOrNull(
    'Proxy__L2LiquidityPool'
  )

  Proxy__L2LiquidityPool = new Contract(
    Proxy__L2LiquidityPoolDeployment.address,
    L2LiquidityPoolJson.abi,
    (hre as any).deployConfig.deployer_l2
  )

  await Proxy__L2LiquidityPool.transferDAORole(Timelock.address)
  console.log(` ⭐️ ${chalk.blue('LP Dao role transferred to Timelock')}`)

  // set admin Timelock

  console.log('Queue setPendingAdmin...')

  // set eta to be the current timestamp for local and rinkeby
  const eta1 = (await getTimestamp(hre)) + eta_delay_s
  // if (process.env.NETWORK === 'mainnet') {
  //   eta = (await getTimestamp(hre)) + eta_delay_s
  // }
  const setPendingAdminData = utils.defaultAbiCoder.encode( // the parameters for the setPendingAdmin function
    ['address'],
    [GovernorBravoDelegator.address]
  )

//   const governorBravo = await GovernorBravoDelegate.at(
//     GovernorBravoDelegator.address
//   )

  await Timelock.queueTransaction(
    Timelock.address,
    0, //is the amount of ETH you want to send with an execution to the Timelock
    'setPendingAdmin(address)', // the function to be called
    setPendingAdminData,
    eta1 // end of timelock in unix time
  )

  console.log('Queued setPendingAdmin!')
  console.log(`Time transaction was made: ${await getTimestamp(hre)}`)
  console.log(`Time at which transaction may be executed: ${eta1}`)


  console.log('Queue Initiate...')
  // call initiate() to complete setAdmin
  // set eta to be the current timestamp for local and rinkeby
  const eta2 = (await getTimestamp(hre)) + eta_delay_s
  // if (process.env.NETWORK === 'mainnet') {
  //   eta = (await getTimestamp(hre)) + eta_delay_s
  // }

  const initiateData = utils.defaultAbiCoder.encode(
    // parameters to initate the GovernorBravoDelegate contract
    ['bytes'],
    [[]]
  )

  await Timelock.queueTransaction(
    GovernorBravoDelegator.address,
    0,
    '_initiate()',
    initiateData,
    eta2
  )

  console.log('Queued Initiate!')
  console.log(`Time transaction was made: ${await getTimestamp(hre)}`)
  console.log(`Time at which transaction can be executed: ${eta2}`)

  // if it's local/rinkeby attempt to execute transactions
  if (process.env.NETWORK !== 'mainnet') {
    console.log('Execute setPendingAdmin...')
    // Execute the transaction that will set the admin of Timelock to the GovernorBravoDelegator contract
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
  console.log('Executed initiate, acceptAdmin() completed');
  } else {
    // TODO - replace with a script that can be called on ETA instead
    console.log('\nPlease copy these values and call executeTransaction() on Timelock twice')
    console.log('from the deployer account in the following sequence with the below parameters')
    console.log('when the ETA is reached')
    console.log('---------------------------')
    console.log('target :', Timelock.address)
    console.log('value :', 0)
    console.log('signature : setPendingAdmin(address)')
    console.log('data :',setPendingAdminData)
    console.log('eta :',eta1)
    console.log('---------------------------')
    console.log('target :', GovernorBravoDelegator.address)
    console.log('value :', 0)
    console.log('signature : _initiate()')
    console.log('data :',initiateData)
    console.log('eta :',eta2)
  }
}

deployFn.tags = ['DAO', 'BOBA']

export default deployFn
