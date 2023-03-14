/* Imports: External */
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory, ethers } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { registerBobaAddress } from './000-Messenger.deploy'

import ProxyJson from '../artifacts/contracts/libraries/Lib_ResolvedDelegateProxy.sol/Lib_ResolvedDelegateProxy.json'
import L1LiquidityPoolJson from '../artifacts/contracts/LP/L1LiquidityPool.sol/L1LiquidityPool.json'
import L2LiquidityPoolJson from '../artifacts/contracts/LP/L2LiquidityPool.sol/L2LiquidityPool.json'

let Factory__Proxy__L1LiquidityPool: ContractFactory
let Factory__Proxy__L2LiquidityPool: ContractFactory

let Proxy__L1LiquidityPool: Contract
let Proxy__L2LiquidityPool: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  Factory__Proxy__L1LiquidityPool = new ContractFactory(
    ProxyJson.abi,
    ProxyJson.bytecode,
    (hre as any).deployConfig.deployer_l1
  )

  Factory__Proxy__L2LiquidityPool = new ContractFactory(
    ProxyJson.abi,
    ProxyJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  // Deploy proxy contracts
  console.log(`'Deploying LP Proxy...`)

  const L1LiquidityPool = await (hre as any).deployments.get('L1LiquidityPool')
  const L2LiquidityPool = await (hre as any).deployments.get('L2LiquidityPool')
  const L1CrossDomainMessengerFastAddress = await (
    hre as any
  ).deployConfig.addressManager.getAddress('Proxy__L1CrossDomainMessengerFast')

  Proxy__L1LiquidityPool = await Factory__Proxy__L1LiquidityPool.deploy(
    L1LiquidityPool.address
  )
  await Proxy__L1LiquidityPool.deployTransaction.wait()
  const Proxy__L1LiquidityPoolDeploymentSubmission: DeploymentSubmission = {
    ...Proxy__L1LiquidityPool,
    receipt: Proxy__L1LiquidityPool.receipt,
    address: Proxy__L1LiquidityPool.address,
    abi: Proxy__L1LiquidityPool.abi,
  }

  console.log(
    `Proxy__L1LiquidityPool deployed to: ${Proxy__L1LiquidityPool.address}`
  )

  Proxy__L2LiquidityPool = await Factory__Proxy__L2LiquidityPool.deploy(
    L2LiquidityPool.address
  )
  await Proxy__L2LiquidityPool.deployTransaction.wait()
  const Proxy__L2LiquidityPoolDeploymentSubmission: DeploymentSubmission = {
    ...Proxy__L2LiquidityPool,
    receipt: Proxy__L2LiquidityPool.receipt,
    address: Proxy__L2LiquidityPool.address,
    abi: Proxy__L2LiquidityPool.abi,
  }
  console.log(
    `Proxy__L2LiquidityPool deployed to: ${Proxy__L2LiquidityPool.address}`
  )

  Proxy__L1LiquidityPool = new ethers.Contract(
    Proxy__L1LiquidityPool.address,
    L1LiquidityPoolJson.abi,
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

  Proxy__L2LiquidityPool = new ethers.Contract(
    Proxy__L2LiquidityPool.address,
    L2LiquidityPoolJson.abi,
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
    '0x4200000000000000000000000000000000000006'
  )
  await registerL1LPETHTX.wait()
  console.log(`Proxy__L1LiquidityPool registered: ${registerL1LPETHTX.hash}`)

  const registerL2LPETHTX = await Proxy__L2LiquidityPool.registerPool(
    '0x0000000000000000000000000000000000000000',
    '0x4200000000000000000000000000000000000006'
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
