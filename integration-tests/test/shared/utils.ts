/* Imports: External */
import * as request from 'request-promise-native'
import {
  Contract,
  Wallet,
  providers,
  BigNumber,
  utils,
  constants,
} from 'ethers'
import {
  getContractFactory,
  getContractInterface,
  predeploys,
} from '@eth-optimism/contracts'
import { remove0x } from '@eth-optimism/core-utils'
import {
  CrossChainMessenger,
  NumberLike,
  asL2Provider,
} from '@eth-optimism/sdk'
import { cleanEnv, str, num, bool, makeValidator } from 'envalid'
import dotenv from 'dotenv'
import { expectEvent } from '@openzeppelin/test-helpers'
dotenv.config()

/* Imports: Internal */
import { OptimismEnv } from './env'

export const isLiveNetwork = () => {
  return process.env.IS_LIVE_NETWORK === 'true'
}

export const HARDHAT_CHAIN_ID = 31337
export const DEFAULT_TEST_GAS_L1 = 330_000
export const DEFAULT_TEST_GAS_L2 = 1_300_000
export const ON_CHAIN_GAS_PRICE = 'onchain'
export const GWEI = BigNumber.from(1e9)
export const OVM_ETH_ADDRESS = predeploys.OVM_ETH

const gasPriceValidator = makeValidator((gasPrice) => {
  if (gasPrice === 'onchain') {
    return gasPrice
  }

  return num()._parse(gasPrice).toString()
})

const env = cleanEnv(process.env, {
  L1_GAS_PRICE: gasPriceValidator({
    default: '0',
  }),
  L1_URL: str({ default: 'http://localhost:9545' }),
  L1_POLLING_INTERVAL: num({ default: 10 }),

  L2_CHAINID: num({ default: 31338 }),
  L2_GAS_PRICE: gasPriceValidator({
    default: 'onchain',
  }),
  L2_URL: str({ default: 'http://localhost:8545' }),
  L2_POLLING_INTERVAL: num({ default: 10 }),
  L2_WALLET_MIN_BALANCE_ETH: num({
    default: 2,
  }),
  L2_WALLET_TOP_UP_AMOUNT_ETH: num({
    default: 3,
  }),

  REPLICA_URL: str({ default: 'http://localhost:8549' }),
  REPLICA_POLLING_INTERVAL: num({ default: 10 }),

  VERIFIER_URL: str({ default: 'http://localhost:8547' }),
  VERIFIER_POLLING_INTERVAL: num({ default: 10 }),

  PRIVATE_KEY: str({
    default:
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  }),
  //0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199
  GAS_PRICE_ORACLE_PRIVATE_KEY: str({
    default:
      '0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e',
  }),
  PRIVATE_KEY_2: str({
    default:
      '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
  }),
  PRIVATE_KEY_3: str({
    default:
      '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e',
  }),
  PRIVATE_KEY_4: str({
    default:
      '0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e',
  }),

  IS_LIVE_NETWORK: bool({ default: false }),
  OVMCONTEXT_SPEC_NUM_TXS: num({
    default: 5,
  }),
  DTL_ENQUEUE_CONFIRMATIONS: num({
    default: 0,
  }),
  RUN_WITHDRAWAL_TESTS: bool({
    default: true,
  }),
  RUN_DEBUG_TRACE_TESTS: bool({
    default: true,
  }),
  RUN_STRESS_TESTS: bool({
    default: true,
  }),
  RUN_VERIFIER_TESTS: bool({
    default: true,
  }),
  RUN_SYSTEM_ADDRESS_TESTS: bool({
    default: false,
  }),
  RUN_REPLICA_TESTS: bool({
    default: true,
  }),
  MOCHA_TIMEOUT: num({
    default: 120_000,
  }),
  MOCHA_BAIL: bool({
    default: false,
  }),
  BATCH_SUBMITTER_SEQUENCER_BATCH_TYPE: str({
    default: 'zlib',
  }),
})

export const envConfig = env

export const L2_CHAINID = env.L2_CHAINID

// The hardhat instance
export const l1Provider = new providers.JsonRpcProvider(env.L1_URL)
l1Provider.pollingInterval = env.L1_POLLING_INTERVAL

export const l2Provider = asL2Provider(
  new providers.JsonRpcProvider(env.L2_URL)
)
l2Provider.pollingInterval = env.L2_POLLING_INTERVAL

export const replicaProvider = asL2Provider(
  new providers.JsonRpcProvider(env.REPLICA_URL)
)
replicaProvider.pollingInterval = env.REPLICA_POLLING_INTERVAL

export const verifierProvider = asL2Provider(
  new providers.JsonRpcProvider(env.VERIFIER_URL)
)
verifierProvider.pollingInterval = env.L2_POLLING_INTERVAL

// The sequencer private key which is funded on L1
export const l1Wallet = new Wallet(env.PRIVATE_KEY, l1Provider)
export const l1Wallet_2 = new Wallet(env.PRIVATE_KEY_2, l1Provider)
export const l1Wallet_3 = new Wallet(env.PRIVATE_KEY_3, l1Provider)
export const l1Wallet_4 = new Wallet(env.PRIVATE_KEY_4, l1Provider)

// A random private key which should always be funded with deposits from L1 -> L2
// if it's using non-0 gas price
export const l2Wallet = l1Wallet.connect(l2Provider)
export const l2Wallet_2 = l1Wallet_2.connect(l2Provider)
export const l2Wallet_3 = l1Wallet_3.connect(l2Provider)
export const l2Wallet_4 = l1Wallet_4.connect(l2Provider)

// The owner of the GasPriceOracle on L2
export const gasPriceOracleWallet = new Wallet(
  env.GAS_PRICE_ORACLE_PRIVATE_KEY,
  l2Provider
)

if (!process.env.BOBA_URL) {
  console.log(`!!You did not set process.env.BOBA_URL!!`)
  console.log(
    `Setting to default value of http://127.0.0.1:8080/boba-addr.json`
  )
} else {
  console.log(`process.env.BOBA_URL set to:`, process.env.BOBA_URL)
}

export const BOBA_URL =
  process.env.BOBA_URL || 'http://127.0.0.1:8080/boba-addr.json'

if (!process.env.BASE_URL) {
  console.log(`!!You did not set process.env.BASE_URL!!`)
  console.log(
    `Setting to default value of http://127.0.0.1:8080/addresses.json`
  )
} else {
  console.log(`process.env.BASE_URL set to:`, process.env.BASE_URL)
}

export const BASE_URL =
  process.env.BASE_URL || 'http://127.0.0.1:8080/addresses.json'

// Gets the bridge contract
export const getL1Bridge = async (wallet: Wallet, bridgeAddress: string) => {
  const l1BridgeInterface = getContractInterface('L1StandardBridge')
  const ProxyBridgeAddress = bridgeAddress

  if (
    !utils.isAddress(ProxyBridgeAddress) ||
    ProxyBridgeAddress === constants.AddressZero
  ) {
    throw new Error('Proxy__L1StandardBridge not found')
  }

  const L1StandardBridge = new Contract(
    ProxyBridgeAddress,
    l1BridgeInterface,
    wallet
  )
  return L1StandardBridge
}

export const getOvmEth = (wallet: Wallet) => {
  const OVM_ETH = new Contract(
    OVM_ETH_ADDRESS,
    getContractInterface('OVM_ETH'),
    wallet
  )

  return OVM_ETH
}

export const fundUser = async (
  messenger: CrossChainMessenger,
  amount: NumberLike,
  recipient?: string
) => {
  await messenger.waitForMessageReceipt(
    await messenger.depositETH(amount, {
      l2GasLimit: DEFAULT_TEST_GAS_L2,
      overrides: {
        gasPrice: DEFAULT_TEST_GAS_L1,
      },
    })
  )

  if (recipient !== undefined) {
    const tx = await messenger.l2Signer.sendTransaction({
      to: recipient,
      value: amount,
    })
    await tx.wait()
  }
}

export const conditionalTest = (
  condition: (env?: OptimismEnv) => Promise<boolean>,
  name,
  fn,
  message?: string,
  timeout?: number
) => {
  it(name, async function () {
    const shouldRun = await condition()
    if (!shouldRun) {
      console.log(message)
      this.skip()
      return
    }

    await fn()
  }).timeout(timeout || envConfig.MOCHA_TIMEOUT * 2)
}

export const withdrawalTest = (name, fn, timeout?: number) =>
  conditionalTest(
    () => Promise.resolve(env.RUN_WITHDRAWAL_TESTS),
    name,
    fn,
    `Skipping withdrawal test.`,
    timeout
  )

export const hardhatTest = (name, fn) =>
  conditionalTest(
    isHardhat,
    name,
    fn,
    'Skipping test on non-Hardhat environment.'
  )

const abiCoder = new utils.AbiCoder()
export const encodeSolidityRevertMessage = (_reason: string): string => {
  return '0x08c379a0' + remove0x(abiCoder.encode(['string'], [_reason]))
}

export const defaultTransactionFactory = () => {
  return {
    to: '0x' + '1234'.repeat(10),
    gasLimit: 8_000_000,
    gasPrice: BigNumber.from(0),
    data: '0x',
    value: 0,
  }
}

export const gasPriceForL2 = async () => {
  if (env.L2_GAS_PRICE === ON_CHAIN_GAS_PRICE) {
    return l2Wallet.getGasPrice()
  }

  return utils.parseUnits(env.L2_GAS_PRICE, 'wei')
}

export const gasPriceForL1 = async () => {
  if (env.L1_GAS_PRICE === ON_CHAIN_GAS_PRICE) {
    return l1Wallet.getGasPrice()
  }

  return utils.parseUnits(env.L1_GAS_PRICE, 'wei')
}

export const isHardhat = async () => {
  const chainId = await l1Wallet.getChainId()
  return chainId === HARDHAT_CHAIN_ID
}

export const die = (...args) => {
  console.log(...args)
  process.exit(1)
}

export const logStderr = (msg: string) => {
  process.stderr.write(`${msg}\n`)
}

export const getBASEDeployerAddresses = async () => {
  const options = {
    uri: BASE_URL,
  }
  const result = await request.get(options)
  return JSON.parse(result)
}

export const getBOBADeployerAddresses = async () => {
  const options = {
    uri: BOBA_URL,
  }
  const result = await request.get(options)
  return JSON.parse(result)
}

export const expectLogs = async (
  receipt,
  emitterAbi,
  emitterAddress,
  eventName,
  eventArgs = {}
) => {
  let eventABI = emitterAbi.filter(
    (x) => x.type === 'event' && x.name === eventName
  )
  if (eventABI.length === 0) {
    throw new Error(`No ABI entry for event '${eventName}'`)
  } else if (eventABI.length > 1) {
    throw new Error(
      `Multiple ABI entries for event '${eventName}', only uniquely named events are supported`
    )
  }

  eventABI = eventABI[0]
  const eventSignature = `${eventName}(${eventABI.inputs
    .map((input) => input.type)
    .join(',')})`
  const eventTopic = utils.keccak256(utils.toUtf8Bytes(eventSignature))
  const logs = receipt.logs
  const filteredLogs = logs
    .filter(
      (log) =>
        log.topics.length > 0 &&
        log.topics[0] === eventTopic &&
        (!emitterAddress || log.address === emitterAddress)
    )
    .map((log) =>
      abiCoder.decode(eventABI.inputs, log.data, log.topics.slice(1))
    )
    .map((decoded) => ({ event: eventName, args: decoded }))

  return expectEvent.inLogs(filteredLogs, eventName, eventArgs)
}
