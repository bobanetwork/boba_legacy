/* Imports: External */
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory, ethers } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { registerBobaAddress } from './000-Messenger.deploy'

import ProxyJson from '../artifacts/contracts/libraries/Lib_ResolvedDelegateProxy.sol/Lib_ResolvedDelegateProxy.json'
import L1ERC1155BridgeJson from '../artifacts/contracts/ERC1155Bridges/L1ERC1155Bridge.sol/L1ERC1155Bridge.json'
import L2ERC1155BridgeJson from '../artifacts/contracts/ERC1155Bridges/L2ERC1155Bridge.sol/L2ERC1155Bridge.json'

let Factory__Proxy__L1ERC1155Bridge: ContractFactory
let Factory__Proxy__L2ERC1155Bridge: ContractFactory

let Proxy__L1ERC1155Bridge: Contract
let Proxy__L2ERC1155Bridge: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  Factory__Proxy__L1ERC1155Bridge = new ContractFactory(
    ProxyJson.abi,
    ProxyJson.bytecode,
    (hre as any).deployConfig.deployer_l1
  )

  Factory__Proxy__L2ERC1155Bridge = new ContractFactory(
    ProxyJson.abi,
    ProxyJson.bytecode,
    (hre as any).deployConfig.deployer_l2
  )

  // Deploy proxy contracts
  console.log(`'Deploying LP Proxy...`)

  const L1ERC1155Bridge = await (hre as any).deployments.get('L1ERC1155Bridge')
  const L2ERC1155Bridge = await (hre as any).deployments.get('L2ERC1155Bridge')
  const L1CrossDomainMessengerFastAddress = await (
    hre as any
  ).deployConfig.addressManager.getAddress('Proxy__L1CrossDomainMessengerFast')

  Proxy__L1ERC1155Bridge = await Factory__Proxy__L1ERC1155Bridge.deploy(
    L1ERC1155Bridge.address
  )
  await Proxy__L1ERC1155Bridge.deployTransaction.wait()
  const Proxy__L1ERC1155BridgeDeploymentSubmission: DeploymentSubmission = {
    ...Proxy__L1ERC1155Bridge,
    receipt: Proxy__L1ERC1155Bridge.receipt,
    address: Proxy__L1ERC1155Bridge.address,
    abi: Proxy__L1ERC1155Bridge.abi,
  }

  console.log(
    `Proxy__L1ERC1155Bridge deployed to: ${Proxy__L1ERC1155Bridge.address}`
  )

  Proxy__L2ERC1155Bridge = await Factory__Proxy__L2ERC1155Bridge.deploy(
    L2ERC1155Bridge.address
  )
  await Proxy__L2ERC1155Bridge.deployTransaction.wait()
  const Proxy__L2ERC1155BridgeDeploymentSubmission: DeploymentSubmission = {
    ...Proxy__L2ERC1155Bridge,
    receipt: Proxy__L2ERC1155Bridge.receipt,
    address: Proxy__L2ERC1155Bridge.address,
    abi: Proxy__L2ERC1155Bridge.abi,
  }
  console.log(
    `Proxy__L2ERC1155Bridge deployed to: ${Proxy__L2ERC1155Bridge.address}`
  )

  Proxy__L1ERC1155Bridge = new ethers.Contract(
    Proxy__L1ERC1155Bridge.address,
    L1ERC1155BridgeJson.abi,
    (hre as any).deployConfig.deployer_l1
  )

  const initL1BridgeTX = await Proxy__L1ERC1155Bridge.initialize(
    (hre as any).deployConfig.l1MessengerAddress,
    Proxy__L2ERC1155Bridge.address
  )
  await initL1BridgeTX.wait()
  console.log(`Proxy__L1ERC1155Bridge initialized: ${initL1BridgeTX.hash}`)

  Proxy__L2ERC1155Bridge = new ethers.Contract(
    Proxy__L2ERC1155Bridge.address,
    L2ERC1155BridgeJson.abi,
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
