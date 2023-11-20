/* Imports: External */
import { Contract } from 'ethers'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { getContractFactory } from '@bobanetwork/core_contracts'
import {
  deployBobaContract,
  getDeploymentSubmission,
  registerBobaAddress,
} from '../src/hardhat-deploy-ethers'

let L1Message: Contract
let L2Message: Contract

const deployFn: DeployFunction = async (hre) => {
  if ((hre as any).deployConfig.isLightMode) {
    console.log('Skipping deployment function as in light mode..')
    return;
  }

  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  const L1CrossDomainMessengerFastAddress = await (
    hre as any
  ).deployConfig.addressManager.getAddress('Proxy__L1CrossDomainMessengerFast')

  L1Message = await deployBobaContract(
    hre,
    'L1Message',
    [
      (hre as any).deployConfig.l1MessengerAddress,
      L1CrossDomainMessengerFastAddress,
    ],
    (hre as any).deployConfig.deployer_l1
  )

  const L1MessageDeploymentSubmission = getDeploymentSubmission(L1Message)
  await hre.deployments.save('L1Message', L1MessageDeploymentSubmission)
  console.log(`L1 Message deployed to: ${L1Message.address}`)
  await registerBobaAddress(addressManager, 'L1Message', L1Message.address)

  L2Message = await deployBobaContract(
    hre,
    'L2Message',
    [(hre as any).deployConfig.l2MessengerAddress],
    (hre as any).deployConfig.deployer_l2
  )
  const L2MessageDeploymentSubmission = getDeploymentSubmission(L2Message)
  await hre.deployments.save('L2Message', L2MessageDeploymentSubmission)
  console.log(`L2 Message deployed to: ${L2Message.address}`)
  await registerBobaAddress(addressManager, 'L2Message', L2Message.address)

  // Initialize L1 message
  const L1MessageTX = await L1Message.init(L2Message.address)
  await L1MessageTX.wait()
  console.log(`L1 Message initialized: ${L1MessageTX.hash}`)

  // Initialize L2 message
  const L2MessageTX = await L2Message.init(L1Message.address)
  await L2MessageTX.wait()
  console.log(`L2 Message initialized: ${L2MessageTX.hash}`)
}

deployFn.tags = ['L1Message', 'L2Message', 'required']
export default deployFn
