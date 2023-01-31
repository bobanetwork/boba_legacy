import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'
import { Contract, ContractFactory } from 'ethers'
import { registerBobaAddress } from './1-deploy-helper'
import EntryPointJson from '../artifacts/contracts/core/EntryPoint.sol/EntryPoint.json'

let Factory__EntryPoint: ContractFactory
let EntryPoint: Contract

const deployFn: DeployFunction = async (hre) => {
  Factory__EntryPoint = new ContractFactory(
    EntryPointJson.abi,
    EntryPointJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )
  EntryPoint = await Factory__EntryPoint.deploy()
  await EntryPoint.deployTransaction.wait()

  const EntryPointDeploymentSubmission: DeploymentSubmission = {
    ...EntryPoint,
    receipt: EntryPoint.receipt,
    address: EntryPoint.address,
    abi: EntryPointJson.abi
  }
  await hre.deployments.save('EntryPoint', EntryPointDeploymentSubmission)

  await registerBobaAddress( (hre as any).deployConfig.addressManager, 'Boba_EntryPoint', EntryPoint.address )
}

export default deployFn
deployFn.tags = ['EntryPoint']
