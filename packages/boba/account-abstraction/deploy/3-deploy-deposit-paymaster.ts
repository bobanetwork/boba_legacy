import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'
import { Contract, ContractFactory } from 'ethers'
import { registerBobaAddress } from './1-deploy-helper'
import BobaDepositPaymasterJson from '../artifacts/contracts/samples/BobaDepositPaymaster.sol/BobaDepositPaymaster.json'

let Factory__BobaDepositPaymaster: ContractFactory
let BobaDepositPaymaster: Contract

const deployFn: DeployFunction = async (hre) => {
  Factory__BobaDepositPaymaster = new ContractFactory(
    BobaDepositPaymasterJson.abi,
    BobaDepositPaymasterJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )
  const entryPoint = await hre.deployments.getOrNull('EntryPoint')
  console.log(`EntryPoint is located at: ${entryPoint.address}`)
  const ethPriceOracle = await (hre as any).deployConfig.addressManager.getAddress('FeedRegistry')
  console.log(`Eth Price Oracle is located at: ${ethPriceOracle}`)
  const entryPointFromAM = await (hre as any).deployConfig.addressManager.getAddress('Boba_EntryPoint')
  if (entryPoint.address == entryPointFromAM) {
    BobaDepositPaymaster = await Factory__BobaDepositPaymaster.deploy(entryPoint.address, ethPriceOracle)
    await BobaDepositPaymaster.deployTransaction.wait()

    const BobaDepositPaymasterDeploymentSubmission: DeploymentSubmission = {
      ...BobaDepositPaymaster,
      receipt: BobaDepositPaymaster.receipt,
      address: BobaDepositPaymaster.address,
      abi: BobaDepositPaymasterJson.abi
    }
    await hre.deployments.save('BobaDepositPaymaster', BobaDepositPaymasterDeploymentSubmission)

    await registerBobaAddress( (hre as any).deployConfig.addressManager, 'BobaDepositPaymaster', BobaDepositPaymaster.address )
  }
}

export default deployFn
deployFn.tags = ['BobaDepositPaymaster']
