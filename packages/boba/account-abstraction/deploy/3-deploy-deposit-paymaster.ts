import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'
import { Contract, ContractFactory } from 'ethers'
import { registerBobaAddress } from './1-deploy-helper'
import BobaDepositPaymasterJson from '../artifacts/contracts/samples/BobaDepositPaymaster.sol/BobaDepositPaymaster.json'
import { DeterministicDeployer } from '../src/DeterministicDeployer'

let Factory__BobaDepositPaymaster: ContractFactory

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
  const entryPointFromAM = await (hre as any).deployConfig.addressManager.getAddress('L2_Boba_EntryPoint')
  if (entryPoint.address.toLowerCase() === entryPointFromAM.toLowerCase()) {
    const bobaDepositPaymasterConstructorArgs = ethers.utils.defaultAbiCoder.encode(
      ["address", "address"],
      [entryPoint.address, ethPriceOracle]
    )
    const bobaDepositPaymasterCreationCode = ethers.utils.solidityPack(
      ["bytes", "bytes"],
      [Factory__BobaDepositPaymaster.bytecode, bobaDepositPaymasterConstructorArgs]
    )
    const dep = new DeterministicDeployer((hre as any).deployConfig.l2Provider, (hre as any).deployConfig.deployer_l2, 'local')
    const dep = new DeterministicDeployer((hre as any).deployConfig.l2Provider)
    const BobaDepositPaymasterAddress = await dep.deterministicDeploy(bobaDepositPaymasterCreationCode)
    console.log('Boba Deposit Paymaster at', BobaDepositPaymasterAddress)

    const BobaDepositPaymasterDeploymentSubmission: DeploymentSubmission = {
      address: BobaDepositPaymasterAddress,
      abi: BobaDepositPaymasterJson.abi
    }
    await hre.deployments.save('BobaDepositPaymaster', BobaDepositPaymasterDeploymentSubmission)

    await registerBobaAddress( (hre as any).deployConfig.addressManager, 'L2_BobaDepositPaymaster', BobaDepositPaymasterAddress )
  }
}

export default deployFn
deployFn.tags = ['BobaDepositPaymaster']
