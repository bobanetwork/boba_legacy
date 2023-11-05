/* Imports: External */
import { Contract } from 'ethers'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { getContractFactory } from '@bobanetwork/core_contracts'
import {
  deployBobaContract,
  getDeploymentSubmission,
  registerBobaAddress,
} from '../src/hardhat-deploy-ethers'

let L1ERC1155Bridge: Contract
let L2ERC1155Bridge: Contract

const deployFn: DeployFunction = async (hre) => {
  const isLocalAltL1 = (hre as any).deployConfig.isLocalAltL1
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  console.log('Deploying...')

  // Deploy L1 token Bridge
  L1ERC1155Bridge = await deployBobaContract(
    hre,
    'L1ERC1155Bridge',
    [],
    (hre as any).deployConfig.deployer_l1
  )
  const L1ERC1155BridgeDeploymentSubmission =
    getDeploymentSubmission(L1ERC1155Bridge)
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

  L2ERC1155Bridge = await deployBobaContract(
    hre,
    isLocalAltL1 ? 'L2ERC1155BridgeAltL1' : 'L2ERC1155Bridge',
    [],
    (hre as any).deployConfig.deployer_l2
  )
  const L2ERC1155BridgeDeploymentSubmission =
    getDeploymentSubmission(L2ERC1155Bridge)
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
