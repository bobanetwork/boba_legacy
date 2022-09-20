/* Imports: External */
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { registerBobaAddress } from './000-Messenger.deploy'

import WBOBA9Json from '../artifacts/contracts/WBOBA9.sol/WBOBA9.json'

let Factory__WBOBA9: ContractFactory
let WBOBA9: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  Factory__WBOBA9 = new ContractFactory(
    WBOBA9Json.abi,
    WBOBA9Json.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  WBOBA9 = await Factory__WBOBA9.deploy()
  await WBOBA9.deployTransaction.wait()
  const WBOBA9DeploymentSubmission: DeploymentSubmission = {
    ...WBOBA9,
    receipt: WBOBA9.receipt,
    address: WBOBA9.address,
    abi: WBOBA9Json.abi,
  }
  await hre.deployments.save('WBOBA9', WBOBA9DeploymentSubmission)
  await registerBobaAddress(addressManager, 'WBOBA9', WBOBA9.address)
  console.log(`WBOBA9 deployed to: ${WBOBA9.address}`)
}

deployFn.tags = ['WBOBA9', 'required']
export default deployFn
