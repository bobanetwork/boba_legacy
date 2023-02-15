import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'
import { Contract, ContractFactory } from 'ethers'
import { registerBobaAddress } from './1-deploy-helper'
import EntryPointJson from '../artifacts/contracts/core/EntryPoint.sol/EntryPoint.json'
import { DeterministicDeployer } from '@account-abstraction/sdk/src/DeterministicDeployer'

let Factory__EntryPoint: ContractFactory

const deployFn: DeployFunction = async (hre) => {
  Factory__EntryPoint = new ContractFactory(
    EntryPointJson.abi,
    EntryPointJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )
  const dep = new DeterministicDeployer((hre as any).deployConfig.l2Provider, (hre as any).deployConfig.deployer_l2, 'local')
  const EntryPointAddress = await dep.deterministicDeploy(Factory__EntryPoint.bytecode)
  console.log('Deployed EntryPoint at', EntryPointAddress)

  const EntryPointDeploymentSubmission: DeploymentSubmission = {
    address: EntryPointAddress,
    abi: EntryPointJson.abi
  }
  await hre.deployments.save('EntryPoint', EntryPointDeploymentSubmission)
  await registerBobaAddress( (hre as any).deployConfig.addressManager, 'Boba_EntryPoint', EntryPointAddress )
}

export default deployFn
deployFn.tags = ['EntryPoint']
