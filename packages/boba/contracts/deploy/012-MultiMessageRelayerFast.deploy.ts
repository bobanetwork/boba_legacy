import { getContractFactory } from '@eth-optimism/contracts'
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory } from 'ethers'
import { registerBobaAddress } from './000-Messenger.deploy'

/* eslint-disable */
require('dotenv').config()

import L1_MultiMessageRelayerFastJson from '../artifacts/contracts/L1MultiMessageRelayerFast.sol/L1MultiMessageRelayerFast.json'

let Factory__L1_MultiMessageRelayerFast: ContractFactory
let L1_MultiMessageRelayerFast: Contract

const deployFn: DeployFunction = async (hre) => {
  
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  Factory__L1_MultiMessageRelayerFast = new ContractFactory(
    L1_MultiMessageRelayerFastJson.abi,
    L1_MultiMessageRelayerFastJson.bytecode,
    (hre as any).deployConfig.deployer_l1
  )

  L1_MultiMessageRelayerFast = await Factory__L1_MultiMessageRelayerFast.deploy(
    addressManager.address
  )

  await L1_MultiMessageRelayerFast.deployTransaction.wait()

  const L1_MultiMessageRelayerFastDeploymentSubmission: DeploymentSubmission = {
    ...L1_MultiMessageRelayerFast,
    receipt: L1_MultiMessageRelayerFast.receipt, 
    address: L1_MultiMessageRelayerFast.address,
    abi: L1_MultiMessageRelayerFastJson.abi,
  }

  await hre.deployments.save( 'L1MultiMessageRelayerFast', L1_MultiMessageRelayerFastDeploymentSubmission )
  await registerBobaAddress( addressManager, 'L1MultiMessageRelayerFast', L1_MultiMessageRelayerFast.address )
  console.log(`L1MultiMessageRelayerFast deployed to: ${L1_MultiMessageRelayerFast.address}`)

  await registerBobaAddress( addressManager, 'L2BatchFastMessageRelayer', (hre as any).deployConfig.fastRelayerAddress )

}

deployFn.tags = ['MultiMessageRelayerFast', 'required']
export default deployFn
