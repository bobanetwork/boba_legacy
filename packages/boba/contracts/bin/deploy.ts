import { Wallet, providers } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'

/* eslint-disable */
require('dotenv').config()

import hre from 'hardhat'

const main = async () => {
  console.log('Starting BOBA core contracts deployment...')

  const network = process.env.NETWORK || 'local'

  const l1Provider = new providers.JsonRpcProvider(process.env.L1_NODE_WEB3_URL)
  const l2Provider = new providers.JsonRpcProvider(process.env.L2_NODE_WEB3_URL)

  const deployer_l1 = new Wallet(process.env.DEPLOYER_PRIVATE_KEY, l1Provider)
  const deployer_l2 = new Wallet(process.env.DEPLOYER_PRIVATE_KEY, l2Provider)

  const relayer = new Wallet(process.env.RELAYER_PRIVATE_KEY, l1Provider)
  const relayerAddress = relayer.address

  const fastRelayer = new Wallet(
    process.env.FAST_RELAYER_PRIVATE_KEY,
    l1Provider
  )
  const fastRelayerAddress = fastRelayer.address

  const getAddressManager = (provider: any, addressManagerAddress: any) => {
    return getContractFactory('Lib_AddressManager')
      .connect(provider)
      .attach(addressManagerAddress) as any
  }

  console.log(
    `ADDRESS_MANAGER_ADDRESS was set to ${process.env.ADDRESS_MANAGER_ADDRESS}`
  )
  const addressManager = getAddressManager(
    deployer_l1,
    process.env.ADDRESS_MANAGER_ADDRESS
  )

  const l1MessengerAddress = await addressManager.getAddress(
    'Proxy__L1CrossDomainMessenger'
  )
  const l2MessengerAddress = await addressManager.getAddress(
    'L2CrossDomainMessenger'
  )

  const L1StandardBridgeAddress = await addressManager.getAddress(
    'Proxy__L1StandardBridge'
  )
  const L1StandardBridge = getContractFactory('L1StandardBridge')
    .connect(deployer_l1)
    .attach(L1StandardBridgeAddress)

  const L2StandardBridgeAddress = await L1StandardBridge.l2TokenBridge()

  const BobaTuringCreditAddress = await addressManager.getAddress(
    'Proxy__BobaTuringCredit'
  )

  const BobaTuringHelperAddress = await addressManager.getAddress(
    'BobaTuringHelper'
  )

  await hre.run('deploy', {
    l1MessengerAddress,
    l2MessengerAddress,
    L1StandardBridgeAddress,
    L2StandardBridgeAddress,
    l1Provider,
    l2Provider,
    deployer_l1,
    deployer_l2,
    addressManager,
    network,
    relayerAddress,
    fastRelayerAddress,
    BobaTuringCreditAddress,
    BobaTuringHelperAddress,
    noCompile: process.env.NO_COMPILE ? true : false,
  })
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(
      JSON.stringify({ error: error.message, stack: error.stack }, null, 2)
    )
    process.exit(1)
  })
