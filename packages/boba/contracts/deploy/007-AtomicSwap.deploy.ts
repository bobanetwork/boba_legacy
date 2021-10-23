/* Imports: External */
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { registerBobaAddress } from './000-Messenger.deploy'

import AtomicSwapJson from '../artifacts/contracts/AtomicSwap.sol/AtomicSwap.json'

let Factory__AtomicSwap: ContractFactory
let AtomicSwap: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  Factory__AtomicSwap = new ContractFactory(
    AtomicSwapJson.abi,
    AtomicSwapJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  AtomicSwap = await Factory__AtomicSwap.deploy()
  await AtomicSwap.deployTransaction.wait()
  const AtomicSwapDeploymentSubmission: DeploymentSubmission = {
    ...AtomicSwap,
    receipt: AtomicSwap.receipt,
    address: AtomicSwap.address,
    abi: AtomicSwapJson.abi,
  }
  await hre.deployments.save('AtomicSwap', AtomicSwapDeploymentSubmission)
  await registerBobaAddress(addressManager, 'AtomicSwap', AtomicSwap.address)
  console.log(`AtomicSwap deployed to: ${AtomicSwap.address}`)
}

deployFn.tags = ['AtomicSwap', 'required']
export default deployFn
