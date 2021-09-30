import { getContractFactory } from '@eth-optimism/contracts'
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory } from 'ethers'
import chalk from 'chalk'

require('dotenv').config()

import L1_MultiMessageRelayerJson from '../artifacts/contracts/L1MultiMessageRelayer.sol/L1MultiMessageRelayer.json'

let Factory__L1_MultiMessageRelayer: ContractFactory

let L1_MultiMessageRelayer: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  Factory__L1_MultiMessageRelayer = new ContractFactory(
    L1_MultiMessageRelayerJson.abi,
    L1_MultiMessageRelayerJson.bytecode,
    (hre as any).deployConfig.deployer_l1
  )

  L1_MultiMessageRelayer = await Factory__L1_MultiMessageRelayer.deploy(
    addressManager.address
  )

  await L1_MultiMessageRelayer.deployTransaction.wait()

  const L1_MultiMessageRelayerDeploymentSubmission: DeploymentSubmission = {
    ...L1_MultiMessageRelayer,
    receipt: L1_MultiMessageRelayer.receipt,
    address: L1_MultiMessageRelayer.address,
    abi: L1_MultiMessageRelayer.abi,
  }
  await hre.deployments.save(
    'L1MultiMessageRelayer',
    L1_MultiMessageRelayerDeploymentSubmission
  )
  console.log(`🌕 ${chalk.red('L1MultiMessageRelayer deployed to:')} ${chalk.green(L1_MultiMessageRelayer.address)}`)

  //this will fail for non deployer account
  const L1MMRTXreg = await addressManager.setAddress(
    'L1MultiMessageRelayer',
    L1_MultiMessageRelayer.address
  )
  await L1MMRTXreg.wait()
  console.log(`⭐️ ${chalk.blue('L1MultiMessageRelayer registered:')} ${chalk.green(L1MMRTXreg.hash)}`)

  //register the batch message relayer too
  const BatchRelayerTXreg = await addressManager.setAddress(
    'L2BatchMessageRelayer',
    (hre as any).deployConfig.relayerAddress
  )
  await BatchRelayerTXreg.wait()
  console.log(`⭐️ ${chalk.blue('L2BatchMessageRelayer Address registered:')} ${chalk.green(BatchRelayerTXreg.hash)}`)
}

deployFn.tags = ['MultiMessageRelayerFast', 'required']

export default deployFn
