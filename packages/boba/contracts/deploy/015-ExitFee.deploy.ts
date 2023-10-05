/* Imports: External */
import { Contract } from 'ethers'
import { getContractFactory } from '@bobanetwork/core_contracts'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import {
  deployBobaContract,
  getDeploymentSubmission,
  registerBobaAddress,
} from '../src/hardhat-deploy-ethers'

let DiscretionaryExitFee: Contract

const deployFn: DeployFunction = async (hre) => {
  const isLocalAltL1 = (hre as any).deployConfig.isLocalAltL1
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  DiscretionaryExitFee = await deployBobaContract(
    hre,
    isLocalAltL1 ? 'DiscretionaryExitFeeAltL1' : 'DiscretionaryExitFee',
    [(hre as any).deployConfig.L2StandardBridgeAddress],
    (hre as any).deployConfig.deployer_l2
  )
  console.log(
    `DiscretionaryExitFee deployed to: ${DiscretionaryExitFee.address}`
  )

  const DiscretionaryExitFeeSubmission =
    getDeploymentSubmission(DiscretionaryExitFee)

  await hre.deployments.save(
    'DiscretionaryExitFee',
    DiscretionaryExitFeeSubmission
  )
  await registerBobaAddress(
    addressManager,
    'DiscretionaryExitFee',
    DiscretionaryExitFee.address
  )
}

deployFn.tags = ['ExitBurn']

export default deployFn
