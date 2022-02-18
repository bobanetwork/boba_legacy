/* Imports: External */
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { registerBobaAddress } from './000-Messenger.deploy'

import FeedRegistryJson from '../artifacts/contracts/oracle/FeedRegistry.sol/FeedRegistry.json'

let Factory__FeedRegistry: ContractFactory
let FeedRegistry: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  Factory__FeedRegistry = new ContractFactory(
    FeedRegistryJson.abi,
    FeedRegistryJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  FeedRegistry = await Factory__FeedRegistry.deploy()
  await FeedRegistry.deployTransaction.wait()
  const FeedRegistryDeploymentSubmission: DeploymentSubmission = {
    ...FeedRegistry,
    receipt: FeedRegistry.receipt,
    address: FeedRegistry.address,
    abi: FeedRegistryJson.abi,
  }
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
