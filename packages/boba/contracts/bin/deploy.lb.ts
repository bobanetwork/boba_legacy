import { Wallet, providers } from 'ethers'
import { getContractFactory } from '@bobanetwork/core_contracts'
import { supportedLocalTestnet } from '@bobanetwork/core_contracts/src/local-network-config'

/* eslint-disable */
require('dotenv').config()

import hre from 'hardhat'

/** @dev Separate deployment file as limited networks or per network deployments for light bridge (e.g. only L2/L1, etc.) not supported with regular deployment config & flow without deploying everyhing else. */
const main = async () => {
  console.log('Starting BOBA core contracts deployment for light bridge...')

  const network = process.env.NETWORK || 'local'

  const l1Provider = new providers.JsonRpcProvider(process.env.L1_NODE_WEB3_URL)
  const l2Provider = new providers.JsonRpcProvider(process.env.L2_NODE_WEB3_URL)

  const deployer_l1 = new Wallet(process.env.DEPLOYER_PRIVATE_KEY, l1Provider)
  const deployer_l2 = new Wallet(process.env.DEPLOYER_PRIVATE_KEY, l2Provider)

  const l1ChainId = (await l1Provider.getNetwork()).chainId
  const isLocalAltL1 = supportedLocalTestnet[l1ChainId]?.isLocalAltL1

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

  await hre.run('deploy', {
    isLocalAltL1,
    l1Provider,
    l2Provider,
    deployer_l1,
    deployer_l2,
    addressManager,
    network,
    // to ensure only independent networks are deployed
    isLightMode: true,
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
