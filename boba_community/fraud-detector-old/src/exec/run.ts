import { Wallet, providers } from 'ethers'
import { FraudProverService } from '../service'
import { Bcfg } from '@eth-optimism/core-utils'
import * as dotenv from 'dotenv'
import Config from 'bcfg'

dotenv.config()

const main = async () => {
  
  const config: Bcfg = new Config('fraud-detector')
  
  config.load({
    env: true,
    argv: true,
  })

  const env = process.env

  const L1_NODE_WEB3_URL = config.str(
    'l1-node-web3-url',
     env.L1_NODE_WEB3_URL)

  const VERIFIER_WEB3_URL = config.str(
    'verifier-web3-url',
     env.VERIFIER_WEB3_URL)
  
  const ADDRESS_MANAGER_ADDRESS = config.str(
    'address-manager-address',
     env.ADDRESS_MANAGER_ADDRESS)

  const POLLING_INTERVAL = config.uint(
    'polling-interval',
    5000)
  
  const GET_LOGS_INTERVAL = config.uint(
    'get-logs-interval',
    500)
  
  const L1_START_OFFSET = config.uint(
    'l1-start-offset',
    parseInt(env.L1_MAINNET_DEPLOYMENT_BLOCK  || '1', 10))

  const L1_BLOCK_FINALITY = config.uint(
    'l1-block-finality',
    0)

  if (!ADDRESS_MANAGER_ADDRESS) {
    throw new Error('Must pass ADDRESS_MANAGER_ADDRESS')
  }
  if (!L1_NODE_WEB3_URL) {
    throw new Error('Must pass L1_NODE_WEB3_URL')
  }
  if (!VERIFIER_WEB3_URL) {
    throw new Error('Must pass VERIFIER_WEB3_URL')
  }

  const l2Provider = new providers.StaticJsonRpcProvider(VERIFIER_WEB3_URL)  
  const l1Provider  = new providers.StaticJsonRpcProvider(L1_NODE_WEB3_URL)

  const service = new FraudProverService({
    l1RpcProvider: l1Provider,
    l2RpcProvider: l2Provider,
    addressManagerAddress: ADDRESS_MANAGER_ADDRESS,
    pollingInterval: POLLING_INTERVAL,
    getLogsInterval: GET_LOGS_INTERVAL,
    l1StartOffset: L1_START_OFFSET,
    l1BlockFinality: L1_BLOCK_FINALITY,
  })

  await service.start()
}

export default main
