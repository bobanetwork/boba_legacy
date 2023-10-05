/* Imports: External */
import { Contract } from 'ethers'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { getContractFactory } from '@bobanetwork/core_contracts'
import {
  deployBobaContract,
  getDeploymentSubmission,
  registerBobaAddress,
  getBobaContractAt,
} from '../src/hardhat-deploy-ethers'

let Proxy__L1NFTBridge: Contract
let Proxy__L2NFTBridge: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  // Deploy proxy contracts
  console.log(`Deploying NFT Bridge Proxys...`)

  const L1NFTBridge = await (hre as any).deployments.get('L1NFTBridge')
  const L2NFTBridge = await (hre as any).deployments.get('L2NFTBridge')

  Proxy__L1NFTBridge = await deployBobaContract(
    hre,
    'Lib_ResolvedDelegateProxy',
    [L1NFTBridge.address],
    (hre as any).deployConfig.deployer_l1
  )
  const Proxy__L1NFTBridgeDeploymentSubmission =
    getDeploymentSubmission(Proxy__L1NFTBridge)

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

  Proxy__L2NFTBridge = await deployBobaContract(
    hre,
    'Lib_ResolvedDelegateProxy',
    [L2NFTBridge.address],
    (hre as any).deployConfig.deployer_l2
  )
  const Proxy__L2NFTBridgeDeploymentSubmission =
    getDeploymentSubmission(Proxy__L2NFTBridge)

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

  Proxy__L1NFTBridge = await getBobaContractAt(
    'L1NFTBridge',
    Proxy__L1NFTBridge.address,
    (hre as any).deployConfig.deployer_l1
  )

  const initL1NFTBridgeTX = await Proxy__L1NFTBridge.initialize(
    (hre as any).deployConfig.l1MessengerAddress,
    Proxy__L2NFTBridge.address
  )
  await initL1NFTBridgeTX.wait()
  console.log(`Proxy__L1NFTBridge initialized: ${initL1NFTBridgeTX.hash}`)

  Proxy__L2NFTBridge = await getBobaContractAt(
    'L2NFTBridge',
    Proxy__L2NFTBridge.address,
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
