import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'
import { registerBobaAddress } from './1-deploy-helper'

const deployFn: DeployFunction = async (hre) => {
  // use the sig verifying address
  const verifyingSignerAddress = (hre as any).deployConfig.deployer_l2.address
  console.log(`Verifying Signer is: ${verifyingSignerAddress}`)

  const entryPoint = await hre.deployments.getOrNull('EntryPoint')
  console.log(`EntryPoint is located at: ${entryPoint.address}`)
  const bobaDepositPaymaster = await hre.deployments.getOrNull('BobaDepositPaymaster')
  console.log(`BobaDepositPaymaster is located at: ${bobaDepositPaymaster.address}`)
  const bobaToken = await (hre as any).deployConfig.addressManager.getAddress('TK_L2BOBA')
  console.log(`Boba is located at: ${bobaToken}`)
  const entryPointFromAM = await (hre as any).deployConfig.addressManager.getAddress('Boba_EntryPoint')
  if (entryPoint.address == entryPointFromAM) {
    const BobaVerifyingPaymaster = await hre.deployments.deploy(
        'BobaVerifyingPaymaster', {
          from: (hre as any).deployConfig.deployer_l2.address,
          args: [entryPoint.address, verifyingSignerAddress, bobaDepositPaymaster.address, bobaToken],
          gasLimit: 4e6,
          deterministicDeployment: false,
          log: true
        })

    await registerBobaAddress( (hre as any).deployConfig.addressManager, 'BobaVerifyingPaymaster', BobaVerifyingPaymaster.address )
  }
}

export default deployFn
deployFn.tags = ['BobaVerifyingPaymaster']
