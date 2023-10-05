/* Imports: External */
import { Contract } from 'ethers'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { getContractFactory } from '@bobanetwork/core_contracts'
import {
  deployBobaContract,
  getDeploymentSubmission,
  registerBobaAddress,
  getBobaContractAt,
} from '../src/hardhat-deploy-ethers'

let Proxy__L1ERC1155Bridge: Contract
let Proxy__L2ERC1155Bridge: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  // Deploy proxy contracts
  console.log(`'Deploying LP Proxy...`)

  const L1ERC1155Bridge = await (hre as any).deployments.get('L1ERC1155Bridge')
  const L2ERC1155Bridge = await (hre as any).deployments.get('L2ERC1155Bridge')

  Proxy__L1ERC1155Bridge = await deployBobaContract(
    hre,
    'Lib_ResolvedDelegateProxy',
    [L1ERC1155Bridge.address],
    (hre as any).deployConfig.deployer_l1
  )
  const Proxy__L1ERC1155BridgeDeploymentSubmission = getDeploymentSubmission(
    Proxy__L1ERC1155Bridge
  )

  console.log(
    `Proxy__L1ERC1155Bridge deployed to: ${Proxy__L1ERC1155Bridge.address}`
  )

  Proxy__L2ERC1155Bridge = await deployBobaContract(
    hre,
    'Lib_ResolvedDelegateProxy',
    [L2ERC1155Bridge.address],
    (hre as any).deployConfig.deployer_l2
  )
  const Proxy__L2ERC1155BridgeDeploymentSubmission = getDeploymentSubmission(
    Proxy__L2ERC1155Bridge
  )
  console.log(
    `Proxy__L2ERC1155Bridge deployed to: ${Proxy__L2ERC1155Bridge.address}`
  )

  Proxy__L1ERC1155Bridge = await getBobaContractAt(
    'L1ERC1155Bridge',
    Proxy__L1ERC1155Bridge.address,
    (hre as any).deployConfig.deployer_l1
  )

  const initL1BridgeTX = await Proxy__L1ERC1155Bridge.initialize(
    (hre as any).deployConfig.l1MessengerAddress,
    Proxy__L2ERC1155Bridge.address
  )
  await initL1BridgeTX.wait()
  console.log(`Proxy__L1ERC1155Bridge initialized: ${initL1BridgeTX.hash}`)

  Proxy__L2ERC1155Bridge = await getBobaContractAt(
    'L2ERC1155Bridge',
    Proxy__L2ERC1155Bridge.address,
    (hre as any).deployConfig.deployer_l2
  )

  const initL2BridgeTX = await Proxy__L2ERC1155Bridge.initialize(
    (hre as any).deployConfig.l2MessengerAddress,
    Proxy__L1ERC1155Bridge.address
  )
  await initL2BridgeTX.wait()
  console.log(`Proxy__L2ERC1155Bridge initialized: ${initL2BridgeTX.hash}`)

  const Proxy__BobaBillingContractDeployment = await hre.deployments.getOrNull(
    'Proxy__BobaBillingContract'
  )

  const configureBillingAddrTx =
    await Proxy__L2ERC1155Bridge.configureBillingContractAddress(
      Proxy__BobaBillingContractDeployment.address
    )
  await configureBillingAddrTx.wait()
  console.log(
    `Proxy__L2ERC1155Bridge configured the billing address: ${configureBillingAddrTx.hash}`
  )

  await hre.deployments.save(
    'Proxy__L1ERC1155Bridge',
    Proxy__L1ERC1155BridgeDeploymentSubmission
  )
  await hre.deployments.save(
    'Proxy__L2ERC1155Bridge',
    Proxy__L2ERC1155BridgeDeploymentSubmission
  )
  await registerBobaAddress(
    addressManager,
    'Proxy__L1ERC1155Bridge',
    Proxy__L1ERC1155Bridge.address
  )
  await registerBobaAddress(
    addressManager,
    'Proxy__L2ERC1155Bridge',
    Proxy__L2ERC1155Bridge.address
  )
}

deployFn.tags = ['Proxy__L1ERC1155Bridge', 'Proxy__L2ERC1155Bridge', 'required']

export default deployFn
