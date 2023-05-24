/* Imports: External */
import { Contract } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import {
  deployBobaContract,
  getDeploymentSubmission,
  registerBobaAddress,
} from '../src/hardhat-deploy-ethers'

let BobaFixedSavings: Contract
let Proxy__BobaFixedSavings: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  BobaFixedSavings = await deployBobaContract(
    hre,
    'BobaFixedSavings',
    [],
    (hre as any).deployConfig.deployer_l2
  )
  console.log(`BobaFixedSavings deployed to: ${BobaFixedSavings.address}`)

  const BobaFixedSavingsSubmission = getDeploymentSubmission(BobaFixedSavings)
  await hre.deployments.save('BobaFixedSavings', BobaFixedSavingsSubmission)
  await registerBobaAddress(
    addressManager,
    'BobaFixedSavings',
    BobaFixedSavings.address
  )

  Proxy__BobaFixedSavings = await deployBobaContract(
    hre,
    'Lib_ResolvedDelegateProxy',
    [BobaFixedSavings.address],
    (hre as any).deployConfig.deployer_l2
  )
  console.log(
    `Proxy__BobaFixedSavings deployed to: ${Proxy__BobaFixedSavings.address}`
  )

  const Proxy__BobaFixedSavingsSubmission = getDeploymentSubmission(
    Proxy__BobaFixedSavings
  )
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
