import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'
import { Contract, ContractFactory } from 'ethers'
import { registerBobaAddress } from './1-deploy-helper'
import BobaVerifyingPaymasterJson from '../artifacts/contracts/samples/BobaVerifyingPaymaster.sol/BobaVerifyingPaymaster.json'
import { DeterministicDeployer } from '../src/DeterministicDeployer'

let Factory__BobaVerifyingPaymaster: ContractFactory

const deployFn: DeployFunction = async (hre) => {
  Factory__BobaVerifyingPaymaster = new ContractFactory(
    BobaVerifyingPaymasterJson.abi,
    BobaVerifyingPaymasterJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )
  // use the sig verifying address
  const verifyingSignerAddress = (hre as any).deployConfig.deployer_l2.address
  console.log(`Verifying Signer is: ${verifyingSignerAddress}`)

  const entryPoint = await hre.deployments.getOrNull('EntryPoint')
  console.log(`EntryPoint is located at: ${entryPoint.address}`)
  const bobaDepositPaymaster = await hre.deployments.getOrNull('BobaDepositPaymaster')
  console.log(`BobaDepositPaymaster is located at: ${bobaDepositPaymaster.address}`)
  const bobaToken = await (hre as any).deployConfig.addressManager.getAddress('TK_L2BOBA')
  console.log(`Boba is located at: ${bobaToken}`)
  const entryPointFromAM = await (hre as any).deployConfig.addressManager.getAddress('L2_Boba_EntryPoint')
  if (entryPoint.address.toLowerCase() === entryPointFromAM.toLowerCase()) {
    const bobaVerifyingPaymasterConstructorArgs = ethers.utils.defaultAbiCoder.encode(
      ["address", "address","address", "address"],
      [entryPoint.address, verifyingSignerAddress, bobaDepositPaymaster.address, bobaToken]
    )
    const bobaVerifyingPaymasterCreationCode = ethers.utils.solidityPack(
      ["bytes", "bytes"],
      [Factory__BobaVerifyingPaymaster.bytecode, bobaVerifyingPaymasterConstructorArgs]
    )
    const dep = new DeterministicDeployer((hre as any).deployConfig.l2Provider, (hre as any).deployConfig.deployer_l2, 'local')

    const BobaVerifyingPaymasterAddress = await dep.deterministicDeploy(bobaVerifyingPaymasterCreationCode)
    console.log('Boba Verifying Paymaster at', BobaVerifyingPaymasterAddress)

    const BobaVerifyingPaymasterDeploymentSubmission: DeploymentSubmission = {
      address: BobaVerifyingPaymasterAddress,
      abi: BobaVerifyingPaymasterJson.abi
    }
    await hre.deployments.save('BobaVerifyingPaymaster', BobaVerifyingPaymasterDeploymentSubmission)

    await registerBobaAddress( (hre as any).deployConfig.addressManager, 'L2_BobaVerifyingPaymaster', BobaVerifyingPaymasterAddress )
  }
}

export default deployFn
deployFn.tags = ['BobaVerifyingPaymaster']
