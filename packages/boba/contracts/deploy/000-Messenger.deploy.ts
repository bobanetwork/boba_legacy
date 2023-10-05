import { Contract } from 'ethers'
import { getContractFactory } from '@bobanetwork/core_contracts'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import {
  deployBobaContract,
  getDeploymentSubmission,
  registerBobaAddress,
} from '../src/hardhat-deploy-ethers'

/* eslint-disable */
require('dotenv').config()

let L1CrossDomainMessengerFast: Contract

const deployFn: DeployFunction = async (hre) => {

  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  L1CrossDomainMessengerFast = await deployBobaContract(
    hre,
    'L1CrossDomainMessengerFast',
    [],
    (hre as any).deployConfig.deployer_l1
  )
  const L1CrossDomainMessengerFastDeploymentSubmission = getDeploymentSubmission(L1CrossDomainMessengerFast)
  await registerBobaAddress(addressManager, 'L1CrossDomainMessengerFast', L1CrossDomainMessengerFast.address)
  await hre.deployments.save('L1CrossDomainMessengerFast',L1CrossDomainMessengerFastDeploymentSubmission)
  console.log(`L1CrossDomainMessengerFast deployed to: ${L1CrossDomainMessengerFast.address}`)

  // initialize with address_manager
  const initializeTx = await L1CrossDomainMessengerFast.initialize(
    addressManager.address,
  )
  await initializeTx.wait()
  console.log(`L1CrossDomainMessengerFast initialized: ${initializeTx.hash}`)

}

deployFn.tags = ['FastMessenger', 'required']

export default deployFn
