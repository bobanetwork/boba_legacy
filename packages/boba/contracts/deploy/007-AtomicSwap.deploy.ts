/* Imports: External */
import { Contract } from 'ethers'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { getContractFactory } from '@bobanetwork/core_contracts'
import {
  deployBobaContract,
  getDeploymentSubmission,
  registerBobaAddress,
} from '../src/hardhat-deploy-ethers'

let AtomicSwap: Contract

const deployFn: DeployFunction = async (hre) => {
  if ((hre as any).deployConfig.isLightMode) {
    console.log('Skipping deployment function as in light mode..')
    return;
  }

  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  AtomicSwap = await deployBobaContract(
    hre,
    'AtomicSwap',
    [],
    (hre as any).deployConfig.deployer_l2
  )
  const AtomicSwapDeploymentSubmission = getDeploymentSubmission(AtomicSwap)
  await hre.deployments.save('AtomicSwap', AtomicSwapDeploymentSubmission)
  await registerBobaAddress(addressManager, 'AtomicSwap', AtomicSwap.address)
  console.log(`AtomicSwap deployed to: ${AtomicSwap.address}`)
}

deployFn.tags = ['AtomicSwap', 'required']
export default deployFn
