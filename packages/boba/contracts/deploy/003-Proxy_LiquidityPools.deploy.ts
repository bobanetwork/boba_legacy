/* Imports: External */
import { Contract } from 'ethers'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { getContractFactory, predeploys } from '@bobanetwork/core_contracts'
import {
  deployBobaContract,
  getDeploymentSubmission,
  registerBobaAddress,
  getBobaContractAt,
} from '../src/hardhat-deploy-ethers'

let Proxy__L1LiquidityPool: Contract
let Proxy__L2LiquidityPool: Contract

const deployFn: DeployFunction = async (hre) => {
  if ((hre as any).deployConfig.isLightMode) {
    console.log('Skipping deployment function as in light mode..')
    return;
  }

  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  // Deploy proxy contracts
  console.log(`'Deploying LP Proxy...`)

  const L1LiquidityPool = await (hre as any).deployments.get('L1LiquidityPool')
  const L2LiquidityPool = await (hre as any).deployments.get('L2LiquidityPool')
  const L1CrossDomainMessengerFastAddress = await (
    hre as any
  ).deployConfig.addressManager.getAddress('Proxy__L1CrossDomainMessengerFast')

  Proxy__L1LiquidityPool = await deployBobaContract(
    hre,
    'Lib_ResolvedDelegateProxy',
    [L1LiquidityPool.address],
    (hre as any).deployConfig.deployer_l1
  )

  const Proxy__L1LiquidityPoolDeploymentSubmission = getDeploymentSubmission(
    Proxy__L1LiquidityPool
  )
  console.log(
    `Proxy__L1LiquidityPool deployed to: ${Proxy__L1LiquidityPool.address}`
  )

  Proxy__L2LiquidityPool = await deployBobaContract(
    hre,
    'Lib_ResolvedDelegateProxy',
    [L2LiquidityPool.address],
    (hre as any).deployConfig.deployer_l2
  )
  const Proxy__L2LiquidityPoolDeploymentSubmission = getDeploymentSubmission(
    Proxy__L2LiquidityPool
  )
  console.log(
    `Proxy__L2LiquidityPool deployed to: ${Proxy__L2LiquidityPool.address}`
  )

  Proxy__L1LiquidityPool = await getBobaContractAt(
    'L1LiquidityPool',
    Proxy__L1LiquidityPool.address,
    (hre as any).deployConfig.deployer_l1
  )

  const initL1LPTX = await Proxy__L1LiquidityPool.initialize(
    (hre as any).deployConfig.l1MessengerAddress,
    L1CrossDomainMessengerFastAddress,
    Proxy__L2LiquidityPool.address,
    (hre as any).deployConfig.L1StandardBridgeAddress
  )
  await initL1LPTX.wait()
  console.log(`Proxy__L1LiquidityPool initialized: ${initL1LPTX.hash}`)

  Proxy__L2LiquidityPool = await getBobaContractAt(
    'L2LiquidityPool',
    Proxy__L2LiquidityPool.address,
    (hre as any).deployConfig.deployer_l2
  )

  const initL2LPTX = await Proxy__L2LiquidityPool.initialize(
    (hre as any).deployConfig.l2MessengerAddress,
    Proxy__L1LiquidityPool.address
  )
  await initL2LPTX.wait()
  console.log(`Proxy__L2LiquidityPool initialized: ${initL2LPTX.hash}`)

  const registerL1LPETHTX = await Proxy__L1LiquidityPool.registerPool(
    '0x0000000000000000000000000000000000000000',
    (hre as any).deployConfig.isLocalAltL1
      ? predeploys.L2_L1NativeToken_ALT_L1
      : '0x4200000000000000000000000000000000000006'
  )
  await registerL1LPETHTX.wait()
  console.log(`Proxy__L1LiquidityPool registered: ${registerL1LPETHTX.hash}`)

  const registerL2LPETHTX = await Proxy__L2LiquidityPool.registerPool(
    '0x0000000000000000000000000000000000000000',
    (hre as any).deployConfig.isLocalAltL1
      ? predeploys.L2_L1NativeToken_ALT_L1
      : '0x4200000000000000000000000000000000000006'
  )
  await registerL2LPETHTX.wait()
  console.log(`Proxy__L2LiquidityPool registered: ${registerL2LPETHTX.hash}`)

  await hre.deployments.save(
    'Proxy__L1LiquidityPool',
    Proxy__L1LiquidityPoolDeploymentSubmission
  )
  await hre.deployments.save(
    'Proxy__L2LiquidityPool',
    Proxy__L2LiquidityPoolDeploymentSubmission
  )
  await registerBobaAddress(
    addressManager,
    'Proxy__L1LiquidityPool',
    Proxy__L1LiquidityPool.address
  )
  await registerBobaAddress(
    addressManager,
    'Proxy__L2LiquidityPool',
    Proxy__L2LiquidityPool.address
  )
}

deployFn.tags = ['Proxy__L1LiquidityPool', 'Proxy__L2LiquidityPool', 'required']

export default deployFn
