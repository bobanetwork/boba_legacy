import { Wallet } from 'ethers'
import path from 'path'
import dirtree from 'directory-tree'
import fs from 'fs'
import * as dotenv from 'dotenv'
dotenv.config()

// Ensures that all relevant environment vars are properly set. These lines *must* come before the
// hardhat import because importing will load the config (which relies on these vars). Necessary
// because CI currently uses different var names than the ones we've chosen here.
// TODO: Update CI so that we don't have to do this anymore.
process.env.HARDHAT_NETWORK = 'rinkeby' // "custom" here is an arbitrary name. only used for CI.
process.env.CONTRACTS_TARGET_NETWORK = 'rinkeby'
process.env.CONTRACTS_DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY
process.env.CONTRACTS_RPC_URL =
  process.env.L1_NODE_WEB3_URL || 'http://127.0.0.1:8545'

import hre from 'hardhat'

const sequencer = process.env.SEQUENCER_ADDRESS
const proposer = process.env.PROPOSER_ADDRESS
const deployer = new Wallet(process.env.DEPLOYER_PRIVATE_KEY)
const relayer = new Wallet(process.env.RELAYER_PRIVATE_KEY)

const parseEnv = () => {
  const ensure = (env, type) => {
    if (typeof process.env[env] === 'undefined') {
      return undefined
    }
    if (type === 'number') {
      return parseInt(process.env[env], 10)
    }
    return process.env[env]
  }

  return {
    l1BlockTimeSeconds: ensure('BLOCK_TIME_SECONDS', 'number'),
    ctcMaxTransactionGasLimit: ensure('MAX_TRANSACTION_GAS_LIMIT', 'number'),
    ctcL2GasDiscountDivisor: ensure('L2_GAS_DISCOUNT_DIVISOR', 'number'),
    ctcEnqueueGasCost: ensure('ENQUEUE_GAS_COST', 'number'),
    sccFraudProofWindow: ensure('FRAUD_PROOF_WINDOW_SECONDS', 'number'),
    sccSequencerPublishWindow: ensure(
      'SEQUENCER_PUBLISH_WINDOW_SECONDS',
      'number'
    ),
  }
}

const main = async () => {
  const config = parseEnv()

  await hre.run('deploy', {
    l1BlockTimeSeconds: config.l1BlockTimeSeconds,
    ctcMaxTransactionGasLimit: config.ctcMaxTransactionGasLimit,
    ctcL2GasDiscountDivisor: config.ctcL2GasDiscountDivisor,
    ctcEnqueueGasCost: config.ctcEnqueueGasCost,
    sccFraudProofWindow: config.sccFraudProofWindow,
    sccSequencerPublishWindow: config.sccFraudProofWindow,
    ovmSequencerAddress: sequencer,
    ovmProposerAddress: proposer,
    ovmRelayerAddress: relayer.address,
    ovmAddressManagerOwner: deployer.address,
    noCompile: process.env.NO_COMPILE ? true : false,
  })

  // Stuff below this line is currently required for CI to work properly. We probably want to
  // update our CI so this is no longer necessary. But I'm adding it for backwards compat so we can
  // get the hardhat-deploy stuff merged. Woot.
  const nicknames = {
    Lib_AddressManager: 'AddressManager',
  }

  const contracts: any = dirtree(
    path.resolve(__dirname, `../deployments/rinkeby`)
  )
    .children.filter((child) => {
      return child.name.endsWith('.json')
    })
    .reduce((contractsAccumulator, child) => {
      const contractName = child.name.replace('.json', '')
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const artifact = require(path.resolve(
        __dirname,
        `../deployments/rinkeby/${child.name}`
      ))
      contractsAccumulator[nicknames[contractName] || contractName] =
        artifact.address
      return contractsAccumulator
    }, {})

  contracts.OVM_Sequencer = sequencer
  contracts.Deployer = await deployer.getAddress()

  const addresses = JSON.stringify(contracts, null, 2)
  const dumpsPath = path.resolve(__dirname, '../dist/dumps')
  if (!fs.existsSync(dumpsPath)) {
    fs.mkdirSync(dumpsPath)
  }
  const addrsPath = path.resolve(dumpsPath, 'addresses.json')
  fs.writeFileSync(addrsPath, addresses)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(
      JSON.stringify({ error: error.message, stack: error.stack }, null, 2)
    )
    process.exit(1)
  })
