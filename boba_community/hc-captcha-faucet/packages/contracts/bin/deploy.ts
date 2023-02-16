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

  const BobaTuringCreditAddress = await addressManager.getAddress(
    'BobaTuringCredit'
  )

  const L2BOBATokenAddress = await addressManager.getAddress(
    'TK_L2BOBA'
  )

  await hre.run('deploy', {
    l1Provider,
    l2Provider,
    deployer_l1,
    deployer_l2,
    addressManager,
    network,
    BobaTuringCreditAddress,
    L2BOBATokenAddress,
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
