import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'
import { registerBobaAddress } from './1-deploy-helper'

const deployFn: DeployFunction = async (hre) => {
  const entryPoint = await hre.deployments.getOrNull('EntryPoint')
  console.log(`EntryPoint is located at: ${entryPoint.address}`)
  const ethPriceOracle = await (hre as any).deployConfig.addressManager.getAddress('FeedRegistry')
  console.log(`Eth Price Oracle is located at: ${ethPriceOracle}`)
  const entryPointFromAM = await (hre as any).deployConfig.addressManager.getAddress('Boba_EntryPoint')
  if (entryPoint.address == entryPointFromAM) {
    const BobaDepositPaymaster = await hre.deployments.deploy(
        'BobaDepositPaymaster', {
          from: (hre as any).deployConfig.deployer_l2.address,
          args: [entryPoint.address, ethPriceOracle],
          gasLimit: 4e6,
          deterministicDeployment: false,
          log: true
        })

    await registerBobaAddress( (hre as any).deployConfig.addressManager, 'BobaDepositPaymaster', BobaDepositPaymaster.address )
  }
}

export default deployFn
deployFn.tags = ['BobaDepositPaymaster']
