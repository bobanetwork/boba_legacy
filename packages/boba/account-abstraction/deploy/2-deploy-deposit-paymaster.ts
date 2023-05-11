import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'
import { Contract, ContractFactory } from 'ethers'
import { registerBobaAddress } from './1-deploy_entrypoint'
import BobaDepositPaymasterJson from '../artifacts/contracts/samples/BobaDepositPaymaster.sol/BobaDepositPaymaster.json'
import { DeterministicDeployer } from '../src/DeterministicDeployer'

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
  const entryPointFromAM = await (hre as any).deployConfig.addressManager.getAddress('L2_Boba_EntryPoint')
  if (entryPoint.address.toLowerCase() === entryPointFromAM.toLowerCase()) {
    BobaDepositPaymaster = await Factory__BobaDepositPaymaster.deploy(entryPoint.address, ethPriceOracle)
    await BobaDepositPaymaster.deployTransaction.wait()

    console.log('Boba Deposit Paymaster at', BobaDepositPaymaster.address)

    const BobaDepositPaymasterDeploymentSubmission: DeploymentSubmission = {
      address: BobaDepositPaymaster.address,
      abi: BobaDepositPaymasterJson.abi
    }
    await hre.deployments.save('BobaDepositPaymaster', BobaDepositPaymasterDeploymentSubmission)

    await registerBobaAddress( (hre as any).deployConfig.addressManager, 'L2_BobaDepositPaymaster', BobaDepositPaymaster.address )
  }
}

export default deployFn
deployFn.tags = ['BobaDepositPaymaster']
