/* Imports: External */
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { registerBobaAddress } from './000-Messenger.deploy'

import L1ERC1155BridgeJson from '../artifacts/contracts/ERC1155Bridges/L1ERC1155Bridge.sol/L1ERC1155Bridge.json'
import L2ERC1155BridgeJson from '../artifacts/contracts/ERC1155Bridges/L2ERC1155Bridge.sol/L2ERC1155Bridge.json'

let Factory__L1ERC1155Bridge: ContractFactory
let Factory__L2ERC1155Bridge: ContractFactory

let L1ERC1155Bridge: Contract
let L2ERC1155Bridge: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  Factory__L1ERC1155Bridge = new ContractFactory(
    L1ERC1155BridgeJson.abi,
    L1ERC1155BridgeJson.bytecode,
    (hre as any).deployConfig.deployer_l1
  )

  Factory__L2ERC1155Bridge = new ContractFactory(
    L2ERC1155BridgeJson.abi,
    L2ERC1155BridgeJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  console.log('Deploying...')

  // Deploy L1 token Bridge
  L1ERC1155Bridge = await Factory__L1ERC1155Bridge.deploy()
  await L1ERC1155Bridge.deployTransaction.wait()
  const L1ERC1155BridgeDeploymentSubmission: DeploymentSubmission = {
    ...L1ERC1155Bridge,
    receipt: L1ERC1155Bridge.receipt,
    address: L1ERC1155Bridge.address,
    abi: L1ERC1155Bridge.abi,
  }

  await registerBobaAddress(
    addressManager,
    'L1ERC1155Bridge',
    L1ERC1155Bridge.address
  )
  await hre.deployments.save(
    'L1ERC1155Bridge',
    L1ERC1155BridgeDeploymentSubmission
  )
  console.log(`L1ERC1155Bridge deployed to: ${L1ERC1155Bridge.address}`)

  L2ERC1155Bridge = await Factory__L2ERC1155Bridge.deploy()
  await L2ERC1155Bridge.deployTransaction.wait()
  const L2ERC1155BridgeDeploymentSubmission: DeploymentSubmission = {
    ...L2ERC1155Bridge,
    receipt: L2ERC1155Bridge.receipt,
    address: L2ERC1155Bridge.address,
    abi: L2ERC1155Bridge.abi,
  }
  await registerBobaAddress(
    addressManager,
    'L2ERC1155Bridge',
    L2ERC1155Bridge.address
  )
  await hre.deployments.save(
    'L2ERC1155Bridge',
    L2ERC1155BridgeDeploymentSubmission
  )
  console.log(`L2ERC1155Bridge deployed to: ${L2ERC1155Bridge.address}`)
}

deployFn.tags = ['L1ERC1155Bridge', 'L2ERC1155Bridge', 'required']
export default deployFn
