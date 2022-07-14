/* Imports: External */
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory, providers, ethers, Wallet } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { registerBobaAddress } from './000-Messenger.deploy'

import EthBridgeJson from '../artifacts/contracts/lzTokenBridge/EthBridge.sol/EthBridge.json'
import AltL1BridgeJson from '../artifacts/contracts/lzTokenBridge/AltL1Bridge.sol/AltL1Bridge.json'
import Lib_ResolvedDelegateProxyJson from '../artifacts/contracts/libraries/Lib_ResolvedDelegateProxy.sol/Lib_ResolvedDelegateProxy.json'

let Factory__EthBridge: ContractFactory
let EthBridge: Contract

let Factory__Proxy__EthBridge: ContractFactory
let Proxy__EthBridge: Contract

let Factory__AltL1Bridge: ContractFactory
let AltL1Bridge: Contract

let Factory__Proxy__AltL1Bridge: ContractFactory
let Proxy__AltL1Bridge: Contract

const deployFn: DeployFunction = async (hre) => {
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  const ethProviderEndpoint = ''
  const layerZeroEthEndpoint = ''
  const layerZeroAltL1Endpoint = ''
  const layerZeroEthChainId = '' // 10001 for Rinkeby
  const layerZeroAltL1ChainId = ''

  if (ethProviderEndpoint) {
    const ethProvider = new providers.JsonRpcProvider(ethProviderEndpoint)
    const ethDeployer = new Wallet(
      process.env.DEPLOYER_PRIVATE_KEY,
      ethProvider
    )

    Factory__EthBridge = new ContractFactory(
      EthBridgeJson.abi,
      EthBridgeJson.bytecode,
      ethDeployer
    )
    EthBridge = await Factory__EthBridge.deploy()
    await EthBridge.deployTransaction.wait()
    console.log(`EthBridge deployed to: ${EthBridge.address}`)

    const EthBridgeSubmission: DeploymentSubmission = {
      ...EthBridge,
      receipt: EthBridge.receipt,
      address: EthBridge.address,
      abi: EthBridge.abi,
    }

    await hre.deployments.save('EthBridge', EthBridgeSubmission)
    await registerBobaAddress(addressManager, 'EthBridge', EthBridge.address)

    Factory__Proxy__EthBridge = new ethers.ContractFactory(
      Lib_ResolvedDelegateProxyJson.abi,
      Lib_ResolvedDelegateProxyJson.bytecode,
      ethDeployer
    )

    Proxy__EthBridge = await Factory__Proxy__EthBridge.deploy(EthBridge.address)
    await Proxy__EthBridge.deployTransaction.wait()
    console.log(`Proxy__EthBridge deployed to: ${Proxy__EthBridge.address}`)

    const Proxy__EthBridgeSubmission: DeploymentSubmission = {
      ...Proxy__EthBridge,
      receipt: Proxy__EthBridge.receipt,
      address: Proxy__EthBridge.address,
      abi: Proxy__EthBridge.abi,
    }

    await hre.deployments.save('Proxy__EthBridge', Proxy__EthBridgeSubmission)
    await registerBobaAddress(
      addressManager,
      'Proxy__EthBridge',
      Proxy__EthBridge.address
    )

    Factory__AltL1Bridge = new ContractFactory(
      AltL1BridgeJson.abi,
      AltL1BridgeJson.bytecode,
      (hre as any).deployConfig.deployer_l1
    )
    AltL1Bridge = await Factory__AltL1Bridge.deploy()
    await AltL1Bridge.deployTransaction.wait()
    console.log(`AltL1Bridge deployed to: ${AltL1Bridge.address}`)

    const AltL1BridgeSubmission: DeploymentSubmission = {
      ...AltL1Bridge,
      receipt: AltL1Bridge.receipt,
      address: AltL1Bridge.address,
      abi: AltL1Bridge.abi,
    }

    await hre.deployments.save('AltL1Bridge', AltL1BridgeSubmission)
    await registerBobaAddress(
      addressManager,
      'AltL1Bridge',
      AltL1Bridge.address
    )

    Factory__Proxy__AltL1Bridge = new ethers.ContractFactory(
      Lib_ResolvedDelegateProxyJson.abi,
      Lib_ResolvedDelegateProxyJson.bytecode,
      (hre as any).deployConfig.deployer_l1
    )

    Proxy__AltL1Bridge = await Factory__Proxy__AltL1Bridge.deploy(
      AltL1Bridge.address
    )
    await Proxy__AltL1Bridge.deployTransaction.wait()
    console.log(`Proxy__AltL1Bridge deployed to: ${Proxy__AltL1Bridge.address}`)

    const Proxy__AltL1BridgeSubmission: DeploymentSubmission = {
      ...Proxy__AltL1Bridge,
      receipt: Proxy__AltL1Bridge.receipt,
      address: Proxy__AltL1Bridge.address,
      abi: Proxy__AltL1Bridge.abi,
    }

    await hre.deployments.save(
      'Proxy__AltL1Bridge',
      Proxy__AltL1BridgeSubmission
    )
    await registerBobaAddress(
      addressManager,
      'Proxy__AltL1Bridge',
      Proxy__AltL1Bridge.address
    )

    console.log('Iniitalizing...')
    Proxy__EthBridge = new ethers.Contract(
      Proxy__EthBridge.address,
      EthBridgeJson.abi,
      ethDeployer
    )

    const initEthBridgeTX = await Proxy__EthBridge.initialize(
      layerZeroEthEndpoint, // current chain layerZero endpoint
      layerZeroAltL1ChainId, // destination (layerZero) chainId
      Proxy__AltL1Bridge.address // the other bridge
    )
    await initEthBridgeTX.wait()
    console.log(`Proxy__EthBridge initialized: ${initEthBridgeTX.hash}`)

    Proxy__AltL1Bridge = new ethers.Contract(
      Proxy__AltL1Bridge.address,
      AltL1BridgeJson.abi,
      (hre as any).deployConfig.deployer_l1
    )

    const initAltL1BridgeTX = await Proxy__AltL1Bridge.initialize(
      layerZeroAltL1Endpoint, // current chain layerZero endpoint
      layerZeroEthChainId, // destination (layerZero) chainId
      Proxy__EthBridge.address // the other bridge
    )
    await initAltL1BridgeTX.wait()
    console.log(`Proxy__AltL1Bridge initialized: ${initAltL1BridgeTX.hash}`)

    // check owner
    if (
      (await Proxy__EthBridge.owner()) !==
      (hre as any).deployConfig.deployer_l1.address
    ) {
      throw new Error('Owner mismatch')
    }
    if (
      (await Proxy__AltL1Bridge.owner()) !==
      (hre as any).deployConfig.deployer_l1.address
    ) {
      throw new Error('Owner mismatch')
    }
    // check initialization
    if (
      (await Proxy__EthBridge.dstChainId()).toString() !== layerZeroAltL1ChainId
    ) {
      throw new Error('chainId mismatch')
    }
    if (
      (await Proxy__AltL1Bridge.dstChainId()).toString() !== layerZeroEthChainId
    ) {
      throw new Error('chainId mismatch')
    }
    if (
      (await Proxy__EthBridge.trustedRemoteLookup(layerZeroAltL1ChainId)) !==
      Proxy__AltL1Bridge.address.toLowerCase()
    ) {
      throw new Error('trustedRemote mismatch')
    }
    if (
      (await Proxy__AltL1Bridge.trustedRemoteLookup(layerZeroEthChainId)) !==
      Proxy__EthBridge.address.toLowerCase()
    ) {
      throw new Error('trustedRemote mismatch')
    }
  }
}

deployFn.tags = ['LzBridges']

export default deployFn
