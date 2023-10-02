/* Imports: External */
import { Contract } from 'ethers'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { getContractFactory } from '@bobanetwork/core_contracts'
import {
  deployBobaContract,
  getDeploymentSubmission,
  registerBobaAddress,
} from '../src/hardhat-deploy-ethers'

let FeedRegistry: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  FeedRegistry = await deployBobaContract(
    hre,
    'FeedRegistry',
    [],
    (hre as any).deployConfig.deployer_l2
  )
  const FeedRegistryDeploymentSubmission = getDeploymentSubmission(FeedRegistry)
  await hre.deployments.save('FeedRegistry', FeedRegistryDeploymentSubmission)
  await registerBobaAddress(
    addressManager,
    'FeedRegistry',
    FeedRegistry.address
  )
  console.log(`FeedRegistry deployed to: ${FeedRegistry.address}`)
}

deployFn.tags = ['FeedRegistry', 'required']
export default deployFn
