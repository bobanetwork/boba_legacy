/* Imports: External */
import { Contract, utils } from 'ethers'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { getContractFactory } from '@eth-optimism/contracts'
import {
  deployBobaContract,
  getDeploymentSubmission,
  registerBobaAddress,
  getBobaContractAt,
} from '../src/hardhat-deploy-ethers'

let Proxy__Teleportation: Contract
let Teleportation: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  console.log(`'Deploying Teleportation contract...`)

  Teleportation = await deployBobaContract(
    hre,
    'Teleportation',
    [],
    (hre as any).deployConfig.deployer_l2
  )
  const TeleportationDeploymentSubmission =
    getDeploymentSubmission(Teleportation)
  await hre.deployments.save('Teleportation', TeleportationDeploymentSubmission)
  console.log(`Teleportation deployed to: ${Teleportation.address}`)

  Proxy__Teleportation = await deployBobaContract(
    hre,
    'Lib_ResolvedDelegateProxy',
    [Teleportation.address],
    (hre as any).deployConfig.deployer_l2
  )
  const Proxy__TeleportationDeploymentSubmission =
    getDeploymentSubmission(Proxy__Teleportation)
  await hre.deployments.save(
    'Proxy__Teleportation',
    Proxy__TeleportationDeploymentSubmission
  )
  console.log(
    `Proxy__Teleportation deployed to: ${Proxy__Teleportation.address}`
  )

  // Initialize the Proxy__Teleportation contract
  const L2BOBA = await hre.deployments.getOrNull('TK_L2BOBA')
  Proxy__Teleportation = await getBobaContractAt(
    'Teleportation',
    Proxy__Teleportation.address,
    (hre as any).deployConfig.deployer_l2
  )
  await Proxy__Teleportation.initialize(
    L2BOBA.address,
    utils.parseEther('1'),
    utils.parseEther('100')
  )
  await Teleportation.initialize(
    L2BOBA.address,
    utils.parseEther('1'),
    utils.parseEther('100')
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
