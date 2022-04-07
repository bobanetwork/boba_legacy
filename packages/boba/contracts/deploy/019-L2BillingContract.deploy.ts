/* Imports: External */
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory, ethers } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { registerBobaAddress } from './000-Messenger.deploy'

import ProxyJson from '../artifacts/contracts/libraries/Lib_ResolvedDelegateProxy.sol/Lib_ResolvedDelegateProxy.json'
import L2LiquidityPoolJson from '../artifacts/contracts/LP/L2LiquidityPool.sol/L2LiquidityPool.json'
import L2BillingContractJson from '../artifacts/contracts/L2BillingContract.sol/L2BillingContract.json'
import DiscretionaryExitFeeJson from '../artifacts/contracts/DiscretionaryExitFee.sol/DiscretionaryExitFee.json'
import L2NFTBridgeJson from '../artifacts/contracts/bridges/L2NFTBridge.sol/L2NFTBridge.json'

let Factory__Proxy__L2BillingContract: ContractFactory
let Factory__L2BillingContract: ContractFactory

let Proxy__L2LiquidityPool: Contract
let Proxy__L2BillingContract: Contract
let L2BillingContract: Contract
let DiscretionaryExitFee: Contract
let L2NFTBridgeContract: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  Factory__Proxy__L2BillingContract = new ContractFactory(
    ProxyJson.abi,
    ProxyJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  Factory__L2BillingContract = new ContractFactory(
    L2BillingContractJson.abi,
    L2BillingContractJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  console.log(`'Deploying L2 billing contract...`)

  const Proxy__L2LiquidityPoolDeployment = await hre.deployments.getOrNull(
    'Proxy__L2LiquidityPool'
  )
  Proxy__L2LiquidityPool = new Contract(
    Proxy__L2LiquidityPoolDeployment.address,
    L2LiquidityPoolJson.abi,
    (hre as any).deployConfig.deployer_l2
  )

  L2BillingContract = await Factory__L2BillingContract.deploy()
  await L2BillingContract.deployTransaction.wait()
  const L2BillingContractDeploymentSubmission: DeploymentSubmission = {
    ...L2BillingContract,
    receipt: L2BillingContract.receipt,
    address: L2BillingContract.address,
    abi: L2BillingContract.abi,
  }
  await hre.deployments.save(
    'BobaBillingContract',
    L2BillingContractDeploymentSubmission
  )
  console.log(`BobaBillingContract deployed to: ${L2BillingContract.address}`)

  Proxy__L2BillingContract = await Factory__Proxy__L2BillingContract.deploy(
    L2BillingContract.address
  )
  await Proxy__L2BillingContract.deployTransaction.wait()
  const Proxy__L2BillingContractDeploymentSubmission: DeploymentSubmission = {
    ...Proxy__L2BillingContract,
    receipt: Proxy__L2BillingContract.receipt,
    address: Proxy__L2BillingContract.address,
    abi: Proxy__L2BillingContract.abi,
  }
  await hre.deployments.save(
    'Proxy__BobaBillingContract',
    Proxy__L2BillingContractDeploymentSubmission
  )
  console.log(
    `Proxy__BobaBillingContract deployed to: ${Proxy__L2BillingContract.address}`
  )

  // Initialize the billing contract
  const L2BOBA = await hre.deployments.getOrNull('TK_L2BOBA')
  Proxy__L2BillingContract = new Contract(
    Proxy__L2BillingContract.address,
    L2BillingContractJson.abi,
    (hre as any).deployConfig.deployer_l2
  )
  await Proxy__L2BillingContract.initialize(
    L2BOBA.address,
    (hre as any).deployConfig.deployer_l2.address,
    ethers.utils.parseEther('10')
  )
  await L2BillingContract.initialize(
    L2BOBA.address,
    (hre as any).deployConfig.deployer_l2.address,
    ethers.utils.parseEther('10')
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
  DiscretionaryExitFee = new Contract(
    DiscretionaryExitFeeSubmission.address,
    DiscretionaryExitFeeJson.abi,
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
  L2NFTBridgeContract  = new Contract(
    Proxy__L2NFTBridgeSubmission.address,
    L2NFTBridgeJson.abi,
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
