/* Imports: External */
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { registerBobaAddress } from './000-Messenger.deploy'

import L1NFTBridgeJson from '../artifacts/contracts/bridges/L1NFTBridge.sol/L1NFTBridge.json'
import L2NFTBridgeJson from '../artifacts/contracts/bridges/L2NFTBridge.sol/L2NFTBridge.json'

let Factory__L1NFTBridge: ContractFactory
let Factory__L2NFTBridge: ContractFactory

let L1NFTBridge: Contract
let L2NFTBridge: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  Factory__L1NFTBridge = new ContractFactory(
    L1NFTBridgeJson.abi,
    L1NFTBridgeJson.bytecode,
    (hre as any).deployConfig.deployer_l1
  )

  Factory__L2NFTBridge = new ContractFactory(
    L2NFTBridgeJson.abi,
    L2NFTBridgeJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  console.log('Deploying...')

  // Deploy L1 NFT Bridge
  L1NFTBridge = await Factory__L1NFTBridge.deploy()
  await L1NFTBridge.deployTransaction.wait()
  const L1NFTBridgeDeploymentSubmission: DeploymentSubmission = {
    ...L1NFTBridge,
    receipt: L1NFTBridge.receipt,
    address: L1NFTBridge.address,
    abi: L1NFTBridgeJson.abi,
  }

  await registerBobaAddress(addressManager, 'L1NFTBridge', L1NFTBridge.address)
  await hre.deployments.save('L1NFTBridge', L1NFTBridgeDeploymentSubmission)
  console.log(`L1NFTBridge deployed to: ${L1NFTBridge.address}`)

  L2NFTBridge = await Factory__L2NFTBridge.deploy()
  await L2NFTBridge.deployTransaction.wait()
  const L2NFTBridgeDeploymentSubmission: DeploymentSubmission = {
    ...L2NFTBridge,
    receipt: L2NFTBridge.receipt,
    address: L2NFTBridge.address,
    abi: L2NFTBridgeJson.abi,
  }
  await registerBobaAddress(addressManager, 'L2NFTBridge', L2NFTBridge.address)
  await hre.deployments.save('L2NFTBridge', L2NFTBridgeDeploymentSubmission)
  console.log(`L2NFTBridge deployed to: ${L2NFTBridge.address}`)
}

deployFn.tags = ['L1NFTBridge', 'L2NFTBridge', 'required']
export default deployFn
