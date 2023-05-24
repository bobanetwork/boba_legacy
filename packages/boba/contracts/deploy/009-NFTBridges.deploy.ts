/* Imports: External */
import { Contract } from 'ethers'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { getContractFactory } from '@eth-optimism/contracts'
import {
  deployBobaContract,
  getDeploymentSubmission,
  registerBobaAddress,
} from '../src/hardhat-deploy-ethers'

let L1NFTBridge: Contract
let L2NFTBridge: Contract

const deployFn: DeployFunction = async (hre) => {
  const isLocalAltL1 = (hre as any).deployConfig.isLocalAltL1
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  console.log('Deploying...')

  // Deploy L1 NFT Bridge
  L1NFTBridge = await deployBobaContract(
    hre,
    'L1NFTBridge',
    [],
    (hre as any).deployConfig.deployer_l1
  )
  const L1NFTBridgeDeploymentSubmission = getDeploymentSubmission(L1NFTBridge)
  await registerBobaAddress(addressManager, 'L1NFTBridge', L1NFTBridge.address)
  await hre.deployments.save('L1NFTBridge', L1NFTBridgeDeploymentSubmission)
  console.log(`L1NFTBridge deployed to: ${L1NFTBridge.address}`)

  L2NFTBridge = await deployBobaContract(
    hre,
    isLocalAltL1 ? 'L2NFTBridgeAltL1' : 'L2NFTBridge',
    [],
    (hre as any).deployConfig.deployer_l2
  )
  const L2NFTBridgeDeploymentSubmission = getDeploymentSubmission(L2NFTBridge)
  await registerBobaAddress(addressManager, 'L2NFTBridge', L2NFTBridge.address)
  await hre.deployments.save('L2NFTBridge', L2NFTBridgeDeploymentSubmission)
  console.log(`L2NFTBridge deployed to: ${L2NFTBridge.address}`)
}

deployFn.tags = ['L1NFTBridge', 'L2NFTBridge', 'required']
export default deployFn
