import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'
import { registerBobaAddress } from './1-deploy-helper'

// const UNSTAKE_DELAY_SEC = 100
// const PAYMASTER_STAKE = ethers.utils.parseEther('1')

// deploy entrypoint - but only on debug network..
const deployFn: DeployFunction = async (hre) => {
  // first verify if already deployed:
  try {
    await hre.deployments.deploy(
      'EntryPoint', {
        from: ethers.constants.AddressZero,
        args: [],
        deterministicDeployment: true,
        log: true
      })

    // already deployed. do nothing.
    return
  } catch (e) {
  }

  const EntryPoint = await hre.deployments.deploy(
    'EntryPoint', {
      from: (hre as any).deployConfig.deployer_l2.address,
      args: [],
      gasLimit: 4e6,
      deterministicDeployment: true,
      log: true
    })

  await registerBobaAddress( (hre as any).deployConfig.addressManager, 'Boba_EntryPoint', EntryPoint.address )
}

export default deployFn
deployFn.tags = ['EntryPoint']
