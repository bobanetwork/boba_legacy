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

let L1_MultiMessageRelayerFast: Contract

const deployFn: DeployFunction = async (hre) => {

  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  L1_MultiMessageRelayerFast = await deployBobaContract(
    hre,
    'L1MultiMessageRelayerFast',
    [addressManager.address],
    (hre as any).deployConfig.deployer_l1
  )
  const L1_MultiMessageRelayerFastDeploymentSubmission = getDeploymentSubmission(L1_MultiMessageRelayerFast)
  await hre.deployments.save( 'L1MultiMessageRelayerFast', L1_MultiMessageRelayerFastDeploymentSubmission )
  await registerBobaAddress( addressManager, 'L1MultiMessageRelayerFast', L1_MultiMessageRelayerFast.address )
  console.log(`L1MultiMessageRelayerFast deployed to: ${L1_MultiMessageRelayerFast.address}`)

  await registerBobaAddress( addressManager, 'L2BatchFastMessageRelayer', (hre as any).deployConfig.fastRelayerAddress )

}

deployFn.tags = ['MultiMessageRelayerFast', 'required']
export default deployFn
