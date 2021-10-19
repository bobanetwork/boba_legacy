/* Imports: External */
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory } from 'ethers'
import chalk from 'chalk'

import AtomicSwapJson from '../artifacts/contracts/AtomicSwap.sol/AtomicSwap.json'

let Factory__AtomicSwap: ContractFactory

let AtomicSwap: Contract

const deployFn: DeployFunction = async (hre) => {
  Factory__AtomicSwap = new ContractFactory(
    AtomicSwapJson.abi,
    AtomicSwapJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  AtomicSwap = await Factory__AtomicSwap.deploy()
  await AtomicSwap.deployTransaction.wait()
  const AtomicSwapDeploymentSubmission: DeploymentSubmission = {
    ...AtomicSwap,
    receipt: AtomicSwap.receipt,
    address: AtomicSwap.address,
    abi: AtomicSwapJson.abi,
  }
  await hre.deployments.save('AtomicSwap', AtomicSwapDeploymentSubmission)
  console.log(
    `🌕 ${chalk.red('AtomicSwap deployed to:')} ${chalk.green(
      AtomicSwap.address
    )}`
  )
}

deployFn.tags = ['AtomicSwap', 'required']

export default deployFn
