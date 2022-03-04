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
    eta_delay_s = 0
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

  // currently fails with
  // "error": "ERROR processing /opt/optimism/packages/boba/contracts/deploy/013-BobaDao.deploy.ts:\n
  // Error: transaction failed (transactionHash=\"0xc34a9170256522952a71549aea8f1d642e9c39f05b35d3ec6959f00b359a5067\", 
  // transaction={\"nonce\":63,\"gasPrice\":{\"type\":\"BigNumber\",\"hex\":\"0x3b9aca00\"},\"gasLimit\":
  // {\"type\":\"BigNumber\",\"hex\":\"0xda50\"},\"to\":\"0xFD471836031dc5108809D173A067e8486B9047A3\",\"value\":{\"type\":\"
  // BigNumber\",\"hex\":\"0x00\"},\"
  // data\":\"0x3a66f9010000000000000000000000001429859428c0abc9c2c47c8ee9fbaf82cfa0f20f000000000000000000000000000000000000000000000000000000000000000000000000000000
  // 000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000
  // 00000000062217180000000000000000000000000000000000000000000000000000000000000000b5f696e69746961746528290000000000000000000000000000000000000000000000000000000000
  //000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000
  // 00000000000000\",\"chainId\":31338,\"v\":62711,\"r\":\"0x02d0abd9819598fd9c92fab284a4868860b81ba1fa2703e25049dc74a635d045\",\"s\":\"0x619490b70938c47195a48af2cfd
  // 79c27265914c4e97cc69e90329e0b3b8d56d5\",\"from\":\"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266\",\"hash\":\"0xc34a9170256522952a71549aea8f1d642e9c39f05b35d3ec6959
  // f00b359a5067\",\"type\":null,\"confirmations\":0}, receipt={\"to\":\"0xFD471836031dc5108809D173A067e8486B9047A3\",\"from\":\"0xf39Fd6e51aad88F6F4ce6aB8827279cffF
  // b92266\",\"contractAddress\":null,\"transactionIndex\":0,\"gasUsed\":

  // const initiateTx = await Timelock.queueTransaction(
  //   GovernorBravoDelegator.address,
  //   0,
  //   '_initiate()',
  //   initiateData,
  //   eta2
  // )

  // await initiateTx.wait()

  // console.log('Queued Initiate!')
  // console.log(`Time transaction was made: ${await getTimestamp(hre)}`)
  // console.log(`Time at which transaction can be executed: ${eta2}`)

  // // if it's local/rinkeby attempt to execute transactions
  // if (process.env.NETWORK !== 'mainnet') {
  //   console.log('Execute setPendingAdmin...')
  //   // Execute the transaction that will set the admin of Timelock to the GovernorBravoDelegator contract
  //   await Timelock.executeTransaction(
  //     Timelock.address,
  //     0,
  //     'setPendingAdmin(address)', // the function to be called
  //     setPendingAdminData,
  //     eta1
  //   )
  //   console.log('Executed setPendingAdmin!')

  //   console.log('Execute initiate...')

  //   await Timelock.executeTransaction(
  //     GovernorBravoDelegator.address,
  //     0,
  //     '_initiate()',
  //     initiateData,
  //     eta2
  //   )
  //   console.log('Executed initiate, acceptAdmin() completed')
  // } else {
  //   // TODO - replace with a script that can be called on ETA instead
  //   console.log(
  //     '\nPlease copy these values and call executeTransaction() on Timelock twice'
  //   )
  //   console.log(
  //     'from the deployer account in the following sequence with the below parameters'
  //   )
  //   console.log('when the ETA is reached')
  //   console.log('---------------------------')
  //   console.log('target :', Timelock.address)
  //   console.log('value :', 0)
  //   console.log('signature : setPendingAdmin(address)')
  //   console.log('data :', setPendingAdminData)
  //   console.log('eta :', eta1)
  //   console.log('---------------------------')
  //   console.log('target :', GovernorBravoDelegator.address)
  //   console.log('value :', 0)
  //   console.log('signature : _initiate()')
  //   console.log('data :', initiateData)
  //   console.log('eta :', eta2)
  // }
}

deployFn.tags = ['DAO', 'BOBA']

export default deployFn
