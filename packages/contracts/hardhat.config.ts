import { HardhatUserConfig } from 'hardhat/types'
import 'solidity-coverage'
import * as dotenv from 'dotenv'

import {
  DEFAULT_ACCOUNTS_HARDHAT,
  RUN_OVM_TEST_GAS,
} from './test/helpers/constants'

// Hardhat plugins
// Hardhat plugins
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-etherscan'
import 'hardhat-deploy'
import '@typechain/hardhat'
import './tasks/deploy'
import './tasks/l2-gasprice'
import './tasks/set-owner'
import './tasks/validate-address-dictator'
import './tasks/validate-chugsplash-dictator'
import './tasks/whitelist'
import './tasks/withdraw-fees'
import 'hardhat-gas-reporter'
//import '@primitivefi/hardhat-dodoc'
import 'hardhat-output-validator'

// Load environment variables from .env
dotenv.config()

const enableGasReport = !!process.env.ENABLE_GAS_REPORT
const privateKey =
  process.env.PRIVATE_KEY ||
  '0x0000000000000000000000000000000000000000000000000000000000000000' // this is to avoid hardhat error

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      accounts: DEFAULT_ACCOUNTS_HARDHAT,
      blockGasLimit: RUN_OVM_TEST_GAS * 2,
      live: false,
      saveDeployments: false,
      tags: ['local'],
      hardfork: 'istanbul',
    },
    optimism: {
      url: 'http://127.0.0.1:8545',
      saveDeployments: false,
    },
    'optimism-kovan': {
      chainId: 69,
      url: 'https://kovan.optimism.io',
      accounts: [privateKey],
    },
    'optimism-mainnet': {
      chainId: 10,
      url: 'https://mainnet.optimism.io',
      accounts: [privateKey],
    },
    mainnet: {
      url: process.env.L1_NODE_WEB3_URL || '',
    },
    'boba-mainnet': {
      url: 'https://mainnet.boba.network',
    },
    goerli: {
      url: process.env.L1_NODE_WEB3_URL || '',
    },
  },
  mocha: {
    timeout: 50000,
  },
  solidity: {
    compilers: [
      {
        version: '0.8.9',
        settings: {
          optimizer: { enabled: true, runs: 10_000 },
          metadata: {
            bytecodeHash: 'none',
          },
          outputSelection: {
            '*': {
              '*': ['storageLayout'],
            },
          },
        },
      },
      {
        version: '0.5.17', // Required for WETH9
        settings: {
          optimizer: { enabled: true, runs: 10_000 },
          outputSelection: {
            '*': {
              '*': ['storageLayout'],
            },
          },
        },
      },
    ],
  },
  typechain: {
    outDir: 'dist/types',
    target: 'ethers-v5',
  },
  paths: {
    deploy: './deploy',
    deployments: './deployments',
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  gasReporter: {
    enabled: enableGasReport,
    currency: 'USD',
    gasPrice: 100,
    outputFile: process.env.CI ? 'gas-report.txt' : undefined,
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_KEY,
      'boba-mainnet': process.env.BOBA_MAINNET_KEY,
      goerli: process.env.ETHERSCAN_GOERLI_KEY,
    },
    customChains: [
      {
        network: 'boba-mainnet',
        chainId: 288,
        urls: {
          apiURL: 'https://api.bobascan.com/api',
          browserURL: 'https://bobascan.com',
        },
      },
    ],
  },
}

if (
  process.env.CONTRACTS_TARGET_NETWORK &&
  process.env.CONTRACTS_DEPLOYER_KEY &&
  process.env.CONTRACTS_RPC_URL
) {
  config.networks[process.env.CONTRACTS_TARGET_NETWORK] = {
    accounts: [process.env.CONTRACTS_DEPLOYER_KEY],
    url: process.env.CONTRACTS_RPC_URL,
    live: true,
    saveDeployments: true,
    tags: [process.env.CONTRACTS_TARGET_NETWORK],
  }
}

export default config
