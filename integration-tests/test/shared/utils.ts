import { expect } from 'chai'

/* Imports: External */
import * as request from 'request-promise-native'
import {
  Contract,
  Wallet,
  constants,
  providers,
  BigNumberish,
  BigNumber,
  utils,
} from 'ethers'
import {
  getContractFactory,
  getContractInterface,
  predeploys,
} from '@eth-optimism/contracts'
import { injectL2Context, remove0x, Watcher } from '@eth-optimism/core-utils'
import { cleanEnv, str, num, bool } from 'envalid'
import dotenv from 'dotenv'
import { expectEvent } from '@openzeppelin/test-helpers'
/* Imports: Internal */
import { Direction, waitForXDomainTransaction } from './watcher-utils'

export const GWEI = BigNumber.from(1e9)

if (process.env.IS_LIVE_NETWORK === 'true') {
  dotenv.config()
}

const env = cleanEnv(process.env, {
  L1_URL: str({ default: 'http://localhost:9545' }),
  L2_URL: str({ default: 'http://localhost:8545' }),
  VERIFIER_URL: str({ default: 'http://localhost:8547' }),
  REPLICA_URL: str({ default: 'http://localhost:8549' }),
  L1_POLLING_INTERVAL: num({ default: 10 }),
  L2_POLLING_INTERVAL: num({ default: 10 }),
  VERIFIER_POLLING_INTERVAL: num({ default: 10 }),
  REPLICA_POLLING_INTERVAL: num({ default: 10 }),
  PRIVATE_KEY: str({
    default:
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  }),
  PRIVATE_KEY_2: str({
    default:
      '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
  }),
  PRIVATE_KEY_3: str({
    default:
      '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e',
  }),
  ADDRESS_MANAGER: str({
    default: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  }),
  L2_CHAINID: num({ default: 31338 }),
  IS_LIVE_NETWORK: bool({ default: false }),
})

// The hardhat instance
export const l1Provider = new providers.JsonRpcProvider(env.L1_URL)
l1Provider.pollingInterval = env.L1_POLLING_INTERVAL

export const l2Provider = new providers.JsonRpcProvider(env.L2_URL)
l2Provider.pollingInterval = env.L2_POLLING_INTERVAL

export const verifierProvider = new providers.JsonRpcProvider(env.VERIFIER_URL)
verifierProvider.pollingInterval = env.VERIFIER_POLLING_INTERVAL

export const replicaProvider = new providers.JsonRpcProvider(env.REPLICA_URL)
replicaProvider.pollingInterval = env.REPLICA_POLLING_INTERVAL

// The sequencer private key which is funded on L1
export const l1Wallet = new Wallet(env.PRIVATE_KEY, l1Provider)
export const l1Wallet_2 = new Wallet(env.PRIVATE_KEY_2, l1Provider)
export const l1Wallet_3 = new Wallet(env.PRIVATE_KEY_3, l1Provider)

// A random private key which should always be funded with deposits from L1 -> L2
// if it's using non-0 gas price
export const l2Wallet = l1Wallet.connect(l2Provider)
export const l2Wallet_2 = l1Wallet_2.connect(l2Provider)
export const l2Wallet_3 = l1Wallet_3.connect(l2Provider)

// Predeploys
export const PROXY_SEQUENCER_ENTRYPOINT_ADDRESS =
  '0x4200000000000000000000000000000000000004'
export const OVM_ETH_ADDRESS = predeploys.OVM_ETH

export const L2_CHAINID = env.L2_CHAINID
export const IS_LIVE_NETWORK = env.IS_LIVE_NETWORK

export const getAddressManager = (provider: any) => {
  return getContractFactory('Lib_AddressManager')
    .connect(provider)
    .attach(env.ADDRESS_MANAGER)
}

if (!process.env.BOBA_URL) {
  console.log(`!!You did not set process.env.BOBA_URL!!`)
  console.log(
    `Setting to default value of http://127.0.0.1:8078/addresses.json`
  )
} else {
  console.log(`process.env.BOBA_URL set to:`, process.env.BOBA_URL)
}

export const BOBA_URL =
  process.env.BOBA_URL || 'http://127.0.0.1:8078/addresses.json'

// Gets the bridge contract
export const getL1Bridge = async (wallet: Wallet, AddressManager: Contract) => {
  const l1BridgeInterface = getContractInterface('L1StandardBridge')
  const ProxyBridgeAddress = await AddressManager.getAddress(
    'Proxy__L1StandardBridge'
  )

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

export const getL2Bridge = async (wallet: Wallet) => {
  const L2BridgeInterface = getContractInterface('L2StandardBridge')

  const L2StandardBridge = new Contract(
    predeploys.L2StandardBridge,
    L2BridgeInterface,
    wallet
  )
  return L2StandardBridge
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
  watcher: Watcher,
  bridge: Contract,
  amount: BigNumberish,
  recipient?: string
) => {
  const value = BigNumber.from(amount)
  const tx = recipient
    ? bridge.depositETHTo(recipient, 1_300_000, '0x', { value })
    : bridge.depositETH(1_300_000, '0x', { value })

  await waitForXDomainTransaction(watcher, tx, Direction.L1ToL2)
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

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

export const isLiveNetwork = () => {
  return process.env.IS_LIVE_NETWORK === 'true'
}

// eslint-disable-next-line @typescript-eslint/no-shadow
export const gasPriceForL2 = async () => {
  if (await isMainnet()) {
    return l2Wallet.getGasPrice()
  }

  if (isLiveNetwork()) {
    return Promise.resolve(BigNumber.from(10000))
  }

  return Promise.resolve(BigNumber.from(0))
}

export const waitForL2Geth = async (
  provider: providers.JsonRpcProvider
): Promise<providers.JsonRpcProvider> => {
  let ready: boolean = false
  while (!ready) {
    try {
      await provider.getNetwork()
      ready = true
    } catch (error) {
      await sleep(1000)
    }
  }
  return injectL2Context(provider)
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

// eslint-disable-next-line @typescript-eslint/no-shadow
export const isMainnet = async () => {
  const chainId = await l1Wallet.getChainId()
  return chainId === 1
}
