import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'
import { Contract, ContractFactory } from 'ethers'
import { registerBobaAddress } from './1-deploy-helper'
import BobaVerifyingPaymasterJson from '../artifacts/contracts/samples/BobaVerifyingPaymaster.sol/BobaVerifyingPaymaster.json'

let Factory__BobaVerifyingPaymaster: ContractFactory
let BobaVerifyingPaymaster: Contract

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
  const entryPointFromAM = await (hre as any).deployConfig.addressManager.getAddress('Boba_EntryPoint')
  if (entryPoint.address == entryPointFromAM) {
    BobaVerifyingPaymaster = await Factory__BobaVerifyingPaymaster.deploy(entryPoint.address, verifyingSignerAddress, bobaDepositPaymaster.address, bobaToken)
    await BobaVerifyingPaymaster.deployTransaction.wait()

    const BobaVerifyingPaymasterDeploymentSubmission: DeploymentSubmission = {
      ...BobaVerifyingPaymaster,
      receipt: BobaVerifyingPaymaster.receipt,
      address: BobaVerifyingPaymaster.address,
      abi: BobaVerifyingPaymasterJson.abi
    }
    await hre.deployments.save('BobaVerifyingPaymaster', BobaVerifyingPaymasterDeploymentSubmission)

    await registerBobaAddress( (hre as any).deployConfig.addressManager, 'BobaVerifyingPaymaster', BobaVerifyingPaymaster.address )
  }
}

export default deployFn
deployFn.tags = ['BobaVerifyingPaymaster']
