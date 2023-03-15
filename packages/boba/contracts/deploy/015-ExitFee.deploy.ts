/* Imports: External */
import { getContractFactory } from '@eth-optimism/contracts'
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory, utils, BigNumber } from 'ethers'
import { registerBobaAddress } from './000-Messenger.deploy'

import DiscretionaryExitFeeJson from '../artifacts/contracts/DiscretionaryExitFee.sol/DiscretionaryExitFee.json'

let Factory__DiscretionaryExitFee: ContractFactory
let DiscretionaryExitFee: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  Factory__DiscretionaryExitFee = new ContractFactory(
    DiscretionaryExitFeeJson.abi,
    DiscretionaryExitFeeJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )
  DiscretionaryExitFee = await Factory__DiscretionaryExitFee.deploy(
    (hre as any).deployConfig.L2StandardBridgeAddress
  )
  await DiscretionaryExitFee.deployTransaction.wait()
  console.log(
    `DiscretionaryExitFee deployed to: ${DiscretionaryExitFee.address}`
  )

  const DiscretionaryExitFeeSubmission: DeploymentSubmission = {
    ...DiscretionaryExitFee,
    receipt: DiscretionaryExitFee.receipt,
    address: DiscretionaryExitFee.address,
    abi: DiscretionaryExitFee.abi,
  }

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
