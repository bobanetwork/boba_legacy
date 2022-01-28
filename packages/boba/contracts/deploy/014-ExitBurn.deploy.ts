/* Imports: External */
import { getContractFactory } from '@eth-optimism/contracts'
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory, utils, BigNumber } from 'ethers'
import { registerBobaAddress } from './000-Messenger.deploy'

import DiscretionaryExitBurnJson from '../artifacts/contracts/DiscretionaryExitBurn.sol/DiscretionaryExitBurn.json'

let Factory__DiscretionaryExitBurn: ContractFactory
let DiscretionaryExitBurn: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  Factory__DiscretionaryExitBurn = new ContractFactory(
    DiscretionaryExitBurnJson.abi,
    DiscretionaryExitBurnJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )
  DiscretionaryExitBurn = await Factory__DiscretionaryExitBurn.deploy(
    (hre as any).deployConfig.L2StandardBridgeAddress
  )
  await DiscretionaryExitBurn.deployTransaction.wait()
  console.log(
    `DiscretionaryExitBurn deployed to: ${DiscretionaryExitBurn.address}`
  )

  const DiscretionaryExitBurnSubmission: DeploymentSubmission = {
    ...DiscretionaryExitBurn,
    receipt: DiscretionaryExitBurn.receipt,
    address: DiscretionaryExitBurn.address,
    abi: DiscretionaryExitBurn.abi,
  }

  await hre.deployments.save(
    'DiscretionaryExitBurn',
    DiscretionaryExitBurnSubmission
  )
  await registerBobaAddress(
    addressManager,
    'DiscretionaryExitBurn',
    DiscretionaryExitBurn.address
  )
}

deployFn.tags = ['ExitBurn']

export default deployFn
