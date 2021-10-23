/* Imports: External */
import { getContractFactory } from '@eth-optimism/contracts'
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory } from 'ethers'
import { registerBobaAddress } from './000-Messenger.deploy'

import L1LiquidityPoolJson from '../artifacts/contracts/LP/L1LiquidityPool.sol/L1LiquidityPool.json'
import L2LiquidityPoolJson from '../artifacts/contracts/LP/L2LiquidityPool.sol/L2LiquidityPool.json'

let Factory__L1LiquidityPool: ContractFactory
let Factory__L2LiquidityPool: ContractFactory

let L1LiquidityPool: Contract
let L2LiquidityPool: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  Factory__L1LiquidityPool = new ContractFactory(
    L1LiquidityPoolJson.abi,
    L1LiquidityPoolJson.bytecode,
    (hre as any).deployConfig.deployer_l1
  )

  Factory__L2LiquidityPool = new ContractFactory(
    L2LiquidityPoolJson.abi,
    L2LiquidityPoolJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  console.log(`Deploying L2LP...`)

  L2LiquidityPool = await Factory__L2LiquidityPool.deploy()

  await L2LiquidityPool.deployTransaction.wait()

  const L2LiquidityPoolDeploymentSubmission: DeploymentSubmission = {
    ...L2LiquidityPool,
    receipt: L2LiquidityPool.receipt,
    address: L2LiquidityPool.address,
    abi: L1LiquidityPoolJson.abi,
  }

  await registerBobaAddress(
    addressManager,
    'L2LiquidityPool',
    L2LiquidityPool.address
  )
  await hre.deployments.save(
    'L2LiquidityPool',
    L2LiquidityPoolDeploymentSubmission
  )
  console.log(`L2LiquidityPool deployed to: ${L2LiquidityPool.address}`)

  console.log(`Deploying L1LP...`)
  L1LiquidityPool = await Factory__L1LiquidityPool.deploy()

  await L1LiquidityPool.deployTransaction.wait()

  const L1LiquidityPoolDeploymentSubmission: DeploymentSubmission = {
    ...L1LiquidityPool,
    receipt: L1LiquidityPool.receipt,
    address: L1LiquidityPool.address,
    abi: L2LiquidityPoolJson.abi,
  }

  await registerBobaAddress(
    addressManager,
    'L1LiquidityPool',
    L1LiquidityPool.address
  )
  await hre.deployments.save(
    'L1LiquidityPool',
    L1LiquidityPoolDeploymentSubmission
  )
  console.log(`L1LiquidityPool deployed to: ${L1LiquidityPool.address}`)
}

deployFn.tags = ['L1LiquidityPool', 'L2LiquidityPool', 'required']
export default deployFn
