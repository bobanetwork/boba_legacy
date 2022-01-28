/* Imports: External */
import { getContractFactory } from '@eth-optimism/contracts'
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory, utils, BigNumber, ethers } from 'ethers'
import { registerBobaAddress } from './000-Messenger.deploy'

import BobaFixedSavingsJson from '../artifacts/contracts/BobaFixedSavings.sol/BobaFixedSavings.json'
import Lib_ResolvedDelegateProxyJson from '../artifacts/contracts/libraries/Lib_ResolvedDelegateProxy.sol/Lib_ResolvedDelegateProxy.json'

let Factory__BobaFixedSavings: ContractFactory
let BobaFixedSavings: Contract

let Factory__Proxy__BobaFixedSavings: ContractFactory
let Proxy__BobaFixedSavings: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  Factory__BobaFixedSavings = new ContractFactory(
    BobaFixedSavingsJson.abi,
    BobaFixedSavingsJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )
  BobaFixedSavings = await Factory__BobaFixedSavings.deploy()
  await BobaFixedSavings.deployTransaction.wait()
  console.log(`BobaFixedSavings deployed to: ${BobaFixedSavings.address}`)

  const BobaFixedSavingsSubmission: DeploymentSubmission = {
    ...BobaFixedSavings,
    receipt: BobaFixedSavings.receipt,
    address: BobaFixedSavings.address,
    abi: BobaFixedSavings.abi,
  }

  await hre.deployments.save('BobaFixedSavings', BobaFixedSavingsSubmission)
  await registerBobaAddress(
    addressManager,
    'BobaFixedSavings',
    BobaFixedSavings.address
  )

  Factory__Proxy__BobaFixedSavings = new ethers.ContractFactory(
    Lib_ResolvedDelegateProxyJson.abi,
    Lib_ResolvedDelegateProxyJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  Proxy__BobaFixedSavings = await Factory__Proxy__BobaFixedSavings.deploy(
    BobaFixedSavings.address
  )
  await Proxy__BobaFixedSavings.deployTransaction.wait()
  console.log(
    `Proxy__BobaFixedSavings deployed to: ${Proxy__BobaFixedSavings.address}`
  )

  const Proxy__BobaFixedSavingsSubmission: DeploymentSubmission = {
    ...Proxy__BobaFixedSavings,
    receipt: Proxy__BobaFixedSavings.receipt,
    address: Proxy__BobaFixedSavings.address,
    abi: Proxy__BobaFixedSavings.abi,
  }

  await hre.deployments.save(
    'Proxy__BobaFixedSavings',
    Proxy__BobaFixedSavingsSubmission
  )
  await registerBobaAddress(
    addressManager,
    'Proxy__BobaFixedSavings',
    Proxy__BobaFixedSavings.address
  )
}

deployFn.tags = ['ExitBurn']

export default deployFn
