/* Imports: External */
import { Contract } from 'ethers'
import { getContractFactory } from '@bobanetwork/core_contracts'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import {
  deployBobaContract,
  getDeploymentSubmission,
  registerBobaAddress,
} from '../src/hardhat-deploy-ethers'

let L1LiquidityPool: Contract
let L2LiquidityPool: Contract

const deployFn: DeployFunction = async (hre) => {
  if ((hre as any).deployConfig.isLightMode) {
    console.log('Skipping deployment function as in light mode..')
    return;
  }

  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  console.log(`Deploying L2LP...`)
  L2LiquidityPool = await deployBobaContract(
    hre,
    (hre as any).deployConfig.isLocalAltL1
      ? 'L2LiquidityPoolAltL1'
      : 'L2LiquidityPool',
    [],
    (hre as any).deployConfig.deployer_l2
  )

  const L2LiquidityPoolDeploymentSubmission =
    getDeploymentSubmission(L2LiquidityPool)

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
  L1LiquidityPool = await deployBobaContract(
    hre,
    (hre as any).deployConfig.isLocalAltL1
      ? 'L1LiquidityPoolAltL1'
      : 'L1LiquidityPool',
    [],
    (hre as any).deployConfig.deployer_l1
  )

  const L1LiquidityPoolDeploymentSubmission =
    getDeploymentSubmission(L1LiquidityPool)

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
