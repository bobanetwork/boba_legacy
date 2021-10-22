import { getContractFactory } from '@eth-optimism/contracts'
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory } from 'ethers'
import chalk from 'chalk'

//import { registerAddress } from '../helpers/hardhat-deploy-ethers'

/* eslint-disable */
require('dotenv').config()

import L1_MessengerJson from '../artifacts/contracts/L1CrossDomainMessengerFast.sol/L1CrossDomainMessengerFast.json'

let Factory__L1_Messenger: ContractFactory
let L1_Messenger: Contract

//import { Contract } from 'ethers'
import { Provider } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { sleep, hexStringEquals } from '@eth-optimism/core-utils'

const waitUntilTrue = async (
  check: () => Promise<boolean>,
  opts: {
    retries?: number
    delay?: number
  } = {}
) => {
  opts.retries = opts.retries || 100
  opts.delay = opts.delay || 5000

  let retries = 0
  while (!(await check())) {
    if (retries > opts.retries) {
      throw new Error(`check failed after ${opts.retries} attempts`)
    }
    retries++
    await sleep(opts.delay)
  }
}

export const registerAddress = async ({
  addressManager,
  name,
  address,
}): Promise<void> => {

  console.log("AddressManager address:",addressManager.address)

  const currentAddress = await addressManager.getAddress(name)
  if (address === currentAddress) {
    console.log(
      `✓ Not registering address for ${name} because it's already been correctly registered`
    )
    return
  }

  console.log(`Registering address for ${name} to ${address}...`)
  await addressManager.setAddress(name, address)

  console.log(`Waiting for registration to reflect on-chain...`)
  await waitUntilTrue(async () => {
    return hexStringEquals(await addressManager.getAddress(name), address)
  })

  console.log(`✓ Registered address for ${name}`)
}

const deployFn: DeployFunction = async (hre) => {

  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  Factory__L1_Messenger = new ContractFactory(
    L1_MessengerJson.abi,
    L1_MessengerJson.bytecode,
    (hre as any).deployConfig.deployer_l1
  )

  L1_Messenger = await Factory__L1_Messenger.deploy()

  await L1_Messenger.deployTransaction.wait()

  const L1_MessengerDeploymentSubmission: DeploymentSubmission = {
    ...L1_Messenger,
    receipt: L1_Messenger.receipt,
    address: L1_Messenger.address,
    abi: L1_MessengerJson.abi,
  }
  await hre.deployments.save(
    'L1CrossDomainMessengerFast',
    L1_MessengerDeploymentSubmission
  )
  console.log(
    `🌕 ${chalk.red('L1CrossDomainMessengerFast deployed to:')} ${chalk.green(
      L1_Messenger.address
    )}`
  )

  const L1_Messenger_Deployed = await Factory__L1_Messenger.attach(
    L1_Messenger.address
  )

  // initialize with address_manager
  const L1MessagerTX = await L1_Messenger_Deployed.initialize(
    addressManager.address
  )
  await L1MessagerTX.wait()
  console.log(
    `⭐️ ${chalk.blue('L1CrossDomainMessengerFast initialized:')} ${chalk.green(
      L1MessagerTX.hash
    )}`
  )

  await registerAddress({
    addressManager,
    name: 'L1CrossDomainMessengerFast',
    address: L1_Messenger.address,
  })

}

deployFn.tags = ['FastMessenger', 'required']

export default deployFn
