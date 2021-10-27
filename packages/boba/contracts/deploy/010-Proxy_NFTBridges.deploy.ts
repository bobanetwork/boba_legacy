/* Imports: External */
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory, ethers } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { registerBobaAddress } from './000-Messenger.deploy'

import ProxyJson from '../artifacts/contracts/libraries/Lib_ResolvedDelegateProxy.sol/Lib_ResolvedDelegateProxy.json'
import L1NFTBridgeJson from '../artifacts/contracts/bridges/L1NFTBridge.sol/L1NFTBridge.json'
import L2NFTBridgeJson from '../artifacts/contracts/bridges/L2NFTBridge.sol/L2NFTBridge.json'

let Factory__Proxy__L1NFTBridge: ContractFactory
let Factory__Proxy__L2NFTBridge: ContractFactory

let Proxy__L1NFTBridge: Contract
let Proxy__L2NFTBridge: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  Factory__Proxy__L1NFTBridge = new ContractFactory(
    ProxyJson.abi,
    ProxyJson.bytecode,
    (hre as any).deployConfig.deployer_l1
  )

  Factory__Proxy__L2NFTBridge = new ContractFactory(
    ProxyJson.abi,
    ProxyJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  // Deploy proxy contracts
  console.log(`Deploying NFT Bridge Proxys...`)

  const L1NFTBridge = await (hre as any).deployments.get('L1NFTBridge')
  const L2NFTBridge = await (hre as any).deployments.get('L2NFTBridge')

  Proxy__L1NFTBridge = await Factory__Proxy__L1NFTBridge.deploy(
    L1NFTBridge.address
  )
  await Proxy__L1NFTBridge.deployTransaction.wait()
  const Proxy__L1NFTBridgeDeploymentSubmission: DeploymentSubmission = {
    ...Proxy__L1NFTBridge,
    receipt: Proxy__L1NFTBridge.receipt,
    address: Proxy__L1NFTBridge.address,
    abi: Proxy__L1NFTBridge.abi,
  }

  await registerBobaAddress(
    addressManager,
    'Proxy__L1NFTBridge',
    Proxy__L1NFTBridge.address
  )
  await hre.deployments.save(
    'Proxy__L1NFTBridge',
    Proxy__L1NFTBridgeDeploymentSubmission
  )
  console.log(`Proxy__L1NFTBridge deployed to: ${Proxy__L1NFTBridge.address}`)

  Proxy__L2NFTBridge = await Factory__Proxy__L2NFTBridge.deploy(
    L2NFTBridge.address
  )
  await Proxy__L2NFTBridge.deployTransaction.wait()
  const Proxy__L2NFTBridgeDeploymentSubmission: DeploymentSubmission = {
    ...Proxy__L2NFTBridge,
    receipt: Proxy__L2NFTBridge.receipt,
    address: Proxy__L2NFTBridge.address,
    abi: Proxy__L2NFTBridge.abi,
  }

  await registerBobaAddress(
    addressManager,
    'Proxy__L2NFTBridge',
    Proxy__L2NFTBridge.address
  )
  await hre.deployments.save(
    'Proxy__L2NFTBridge',
    Proxy__L2NFTBridgeDeploymentSubmission
  )
  console.log(`Proxy__L2NFTBridge deployed to: ${Proxy__L2NFTBridge.address}`)

  Proxy__L1NFTBridge = new ethers.Contract(
    Proxy__L1NFTBridge.address,
    L1NFTBridgeJson.abi,
    (hre as any).deployConfig.deployer_l1
  )

  const initL1NFTBridgeTX = await Proxy__L1NFTBridge.initialize(
    (hre as any).deployConfig.l1MessengerAddress,
    Proxy__L2NFTBridge.address
  )
  await initL1NFTBridgeTX.wait()
  console.log(`Proxy__L1NFTBridge initialized: ${initL1NFTBridgeTX.hash}`)

  Proxy__L2NFTBridge = new ethers.Contract(
    Proxy__L2NFTBridge.address,
    L2NFTBridgeJson.abi,
    (hre as any).deployConfig.deployer_l2
  )

  const initL2NFTBridgeTX = await Proxy__L2NFTBridge.initialize(
    (hre as any).deployConfig.l2MessengerAddress,
    Proxy__L1NFTBridge.address
  )
  await initL2NFTBridgeTX.wait()
  console.log(`Proxy__L2NFTBridge initialized: ${initL2NFTBridgeTX.hash}`)
}

deployFn.tags = ['Proxy__L1NFTBridge', 'Proxy__L2NFTBridge', 'required']
export default deployFn
