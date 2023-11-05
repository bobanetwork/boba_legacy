/* Imports: External */
import { Contract, utils } from 'ethers'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { getContractFactory } from '@bobanetwork/core_contracts'
import {
  deployBobaContract,
  getDeploymentSubmission,
  registerBobaAddress,
  getBobaContractAt,
} from '../src/hardhat-deploy-ethers'

let Proxy__L2LiquidityPool: Contract
let Proxy__L2BillingContract: Contract
let L2BillingContract: Contract
let DiscretionaryExitFee: Contract
let L2NFTBridgeContract: Contract

const deployFn: DeployFunction = async (hre) => {
  const isLocalAltL1 = (hre as any).deployConfig.isLocalAltL1
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  console.log(`'Deploying L2 billing contract...`)

  const Proxy__L2LiquidityPoolDeployment = await hre.deployments.getOrNull(
    'Proxy__L2LiquidityPool'
  )
  Proxy__L2LiquidityPool = await getBobaContractAt(
    'L2LiquidityPool',
    Proxy__L2LiquidityPoolDeployment.address,
    (hre as any).deployConfig.deployer_l2
  )

  L2BillingContract = await deployBobaContract(
    hre,
    isLocalAltL1 ? 'L2BillingContractAltL1' : 'L2BillingContract',
    [],
    (hre as any).deployConfig.deployer_l2
  )

  const L2BillingContractDeploymentSubmission =
    getDeploymentSubmission(L2BillingContract)
  await hre.deployments.save(
    'BobaBillingContract',
    L2BillingContractDeploymentSubmission
  )
  console.log(`BobaBillingContract deployed to: ${L2BillingContract.address}`)

  Proxy__L2BillingContract = await deployBobaContract(
    hre,
    'Lib_ResolvedDelegateProxy',
    [L2BillingContract.address],
    (hre as any).deployConfig.deployer_l2
  )
  const Proxy__L2BillingContractDeploymentSubmission = getDeploymentSubmission(
    Proxy__L2BillingContract
  )
  await hre.deployments.save(
    'Proxy__BobaBillingContract',
    Proxy__L2BillingContractDeploymentSubmission
  )
  console.log(
    `Proxy__BobaBillingContract deployed to: ${Proxy__L2BillingContract.address}`
  )

  // Initialize the billing contract
  const L2BOBA = await hre.deployments.getOrNull('TK_L2BOBA')
  Proxy__L2BillingContract = await getBobaContractAt(
    'L2BillingContract',
    Proxy__L2BillingContract.address,
    (hre as any).deployConfig.deployer_l2
  )
  await Proxy__L2BillingContract.initialize(
    L2BOBA.address,
    (hre as any).deployConfig.deployer_l2.address,
    utils.parseEther('10')
  )
  await L2BillingContract.initialize(
    L2BOBA.address,
    (hre as any).deployConfig.deployer_l2.address,
    utils.parseEther('10')
  )
  console.log(`Proxy__BobaBillingContract initialized`)

  // Register the address of the L2 billing contract
  await Proxy__L2LiquidityPool.configureBillingContractAddress(
    Proxy__L2BillingContract.address
  )
  console.log(`Added BobaBillingContract to Proxy__L2LiquidityPool`)

  // Register the address of the L2 billing contract
  const DiscretionaryExitFeeSubmission = await hre.deployments.getOrNull(
    'DiscretionaryExitFee'
  )
  DiscretionaryExitFee = await getBobaContractAt(
    'DiscretionaryExitFee',
    DiscretionaryExitFeeSubmission.address,
    (hre as any).deployConfig.deployer_l2
  )
  await DiscretionaryExitFee.configureBillingContractAddress(
    Proxy__L2BillingContract.address
  )
  console.log(`Added BobaBillingContract to DiscretionaryExitFee`)

  // Register the address of the L2 NFT bridge
  const Proxy__L2NFTBridgeSubmission = await hre.deployments.getOrNull(
    'Proxy__L2NFTBridge'
  )
  L2NFTBridgeContract = await getBobaContractAt(
    'L2NFTBridge',
    Proxy__L2NFTBridgeSubmission.address,
    (hre as any).deployConfig.deployer_l2
  )
  await L2NFTBridgeContract.configureBillingContractAddress(
    Proxy__L2BillingContract.address
  )
  console.log(`Added BobaBillingContract to Proxy__L2NFTBridgeSubmission`)

  await registerBobaAddress(
    addressManager,
    'Proxy__BobaBillingContract',
    Proxy__L2BillingContract.address
  )
  await registerBobaAddress(
    addressManager,
    'BobaBillingContract',
    L2BillingContract.address
  )
}

deployFn.tags = ['Proxy__L1LiquidityPool', 'Proxy__L2LiquidityPool', 'required']

export default deployFn
