/* Imports: External */
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory, ethers } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { registerBobaAddress } from './000-Messenger.deploy'

import ProxyJson from '../artifacts/contracts/libraries/Lib_ResolvedDelegateProxy.sol/Lib_ResolvedDelegateProxy.json'
import TeleportationJson from '../artifacts/contracts/Teleportation.sol/Teleportation.json'

let Factory__Proxy__Teleportation: ContractFactory
let Factory__Teleportation: ContractFactory

let Proxy__Teleportation: Contract
let Teleportation: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  Factory__Proxy__Teleportation = new ContractFactory(
    ProxyJson.abi,
    ProxyJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  Factory__Teleportation = new ContractFactory(
    TeleportationJson.abi,
    TeleportationJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  console.log(`'Deploying Teleportation contract...`)

  const Proxy__L2LiquidityPoolDeployment = await hre.deployments.getOrNull(
    'Proxy__L2LiquidityPool'
  )

  Teleportation = await Factory__Teleportation.deploy()
  await Teleportation.deployTransaction.wait()
  const TeleportationDeploymentSubmission: DeploymentSubmission = {
    ...Teleportation,
    receipt: Teleportation.receipt,
    address: Teleportation.address,
    abi: Teleportation.abi,
  }
  await hre.deployments.save('Teleportation', TeleportationDeploymentSubmission)
  console.log(`Teleportation deployed to: ${Teleportation.address}`)

  Proxy__Teleportation = await Factory__Proxy__Teleportation.deploy(
    Teleportation.address
  )
  await Proxy__Teleportation.deployTransaction.wait()
  const Proxy__TeleportationDeploymentSubmission: DeploymentSubmission = {
    ...Proxy__Teleportation,
    receipt: Proxy__Teleportation.receipt,
    address: Proxy__Teleportation.address,
    abi: Proxy__Teleportation.abi,
  }
  await hre.deployments.save(
    'Proxy__Teleportation',
    Proxy__TeleportationDeploymentSubmission
  )
  console.log(
    `Proxy__Teleportation deployed to: ${Proxy__Teleportation.address}`
  )

  // Initialize the Proxy__Teleportation contract
  const L2BOBA = await hre.deployments.getOrNull('TK_L2BOBA')
  Proxy__Teleportation = new Contract(
    Proxy__Teleportation.address,
    TeleportationJson.abi,
    (hre as any).deployConfig.deployer_l2
  )
  await Proxy__Teleportation.initialize(
    L2BOBA.address,
    ethers.utils.parseEther('1'),
    ethers.utils.parseEther('100')
  )
  await Teleportation.initialize(
    L2BOBA.address,
    ethers.utils.parseEther('1'),
    ethers.utils.parseEther('100')
  )
  console.log(`Proxy__Teleportation initialized`)

  await registerBobaAddress(
    addressManager,
    'Proxy__Teleportation',
    Proxy__Teleportation.address
  )
  await registerBobaAddress(
    addressManager,
    'Teleportation',
    Teleportation.address
  )
}

deployFn.tags = ['Proxy__Teleportation', 'Teleportation', 'required']

export default deployFn
