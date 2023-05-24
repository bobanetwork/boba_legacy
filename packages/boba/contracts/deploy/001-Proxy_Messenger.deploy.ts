import { Contract, ContractFactory } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import {
  getDeploymentSubmission,
  registerBobaAddress,
  getBobaContractAt,
} from '../src/hardhat-deploy-ethers'

/* eslint-disable */
require('dotenv').config()

let Factory__Proxy__L1CrossDomainMessengerFast: ContractFactory
let Proxy__L1CrossDomainMessengerFast: Contract

const deployFn: DeployFunction = async (hre) => {

  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  Factory__Proxy__L1CrossDomainMessengerFast = getContractFactory(
    'Lib_ResolvedDelegateProxy',
    (hre as any).deployConfig.deployer_l1
  )
  Proxy__L1CrossDomainMessengerFast = await Factory__Proxy__L1CrossDomainMessengerFast.deploy(
    addressManager.address, 'L1CrossDomainMessengerFast',
  )

  const Proxy__L1CrossDomainMessengerFastDeploymentSubmission = getDeploymentSubmission(Proxy__L1CrossDomainMessengerFast)
  await registerBobaAddress( addressManager, 'Proxy__L1CrossDomainMessengerFast', Proxy__L1CrossDomainMessengerFast.address )
  await hre.deployments.save( 'Proxy__L1CrossDomainMessengerFast', Proxy__L1CrossDomainMessengerFastDeploymentSubmission )
  console.log(`Proxy__L1CrossDomainMessengerFast deployed to: ${Proxy__L1CrossDomainMessengerFast.address}`)

  // initialize with the address of the address_manager
  Proxy__L1CrossDomainMessengerFast = await getBobaContractAt(
    'L1CrossDomainMessengerFast',
    Proxy__L1CrossDomainMessengerFast.address,
    (hre as any).deployConfig.deployer_l1
  )
  const initializeTx = await Proxy__L1CrossDomainMessengerFast.initialize(
    addressManager.address
  )
  await initializeTx.wait()
  console.log(`Proxy__L1CrossDomainMessengerFast initialized: ${initializeTx.hash}`)

}

deployFn.tags = ['Proxy__L1CrossDomainMessengerFast', 'required']
export default deployFn
