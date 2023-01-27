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
    moonbeam: {
      url: 'https://rpc.api.moonbeam.network',
    },
    bobabeam: {
      url: 'https://bobabeam.boba.network',
    },
    bobabase: {
      url: 'https://bobabase.boba.network',
    },
    snowtrace: {
      url: 'https://api.avax.network/ext/bc/C/rpc',
    },
    bobaavax: {
      url: 'https://avax.boba.network',
    },
    bobaavaxTestnet: {
      url: 'https://testnet.avax.boba.network',
    },
    bnb: {
      url: 'https://bscrpc.com',
    },
    bobabnb: {
      url: 'https://bnb.boba.network',
    },
    bobabnbTestnet: {
      url: 'https://testnet.bnb.boba.network',
    },
    fantom: {
      url: 'https://rpc.fantom.network',
    },
    bobaopera: {
      url: 'https://bobaopera.boba.network',
    },
    bobaoperaTestnet: {
      url: 'https://testnet.bobaopera.boba.network',
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
      moonbeam: process.env.MOONBEAM_KEY,
      bobabeam: 'DEFAULT_KEY',
      bobabase: 'DEFAULT_KEY',
      snowtrace: process.env.SNOWTRACE_KEY,
      bnb: process.env.BSCSCAN_KEY,
      bobabnb: 'DEFAULT_KEY',
      bobabnbTestnet: 'DEFAULT_KEY',
      bobaavax: 'DEFAULT_KEY',
      bobaavaxTestnet: 'DEFAULT_KEY',
      fantom: process.env.FTMSCAN_KEY,
      bobaopera: 'DEFAULT_KEY',
      bobaoperaTestnet: 'DEFAULT_KEY',
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
      {
        network: 'moonbeam',
        chainId: 1284,
        urls: {
          apiURL: 'https://api-moonbeam.moonscan.io/api',
          browserURL: 'https://moonscan.io/',
        },
      },
      {
        network: 'bobabeam',
        chainId: 1294,
        urls: {
          apiURL: 'https://blockexplorer.bobabeam.boba.network/api',
          browserURL: 'https://blockexplorer.bobabeam.boba.network',
        },
      },
      {
        network: 'bobabase',
        chainId: 1297,
        urls: {
          apiURL: 'https://blockexplorer.bobabase.boba.network/api',
          browserURL: 'https://blockexplorer.bobabase.boba.network',
        },
      },
      {
        network: 'snowtrace',
        chainId: 43114,
        urls: {
          apiURL: 'https://api.snowtrace.io/api',
          browserURL: 'https://snowtrace.io',
        },
      },
      {
        network: 'bobaavax',
        chainId: 43288,
        urls: {
          apiURL: 'https://blockexplorer.avax.boba.network/api',
          browserURL: 'https://blockexplorer.avax.boba.network',
        },
      },
      {
        network: 'bobaavaxTestnet',
        chainId: 4328,
        urls: {
          apiURL: 'https://blockexplorer.testnet.avax.boba.network/api',
          browserURL: 'https://blockexplorer.testnet.avax.boba.network',
        },
      },
      {
        network: 'bnb',
        chainId: 56,
        urls: {
          apiURL: 'https://api.bscscan.com/api',
          browserURL: 'https://bscscan.com/',
        },
      },
      {
        network: 'bobabnb',
        chainId: 56288,
        urls: {
          apiURL: 'https://blockexplorer.bnb.boba.network/api',
          browserURL: 'https://blockexplorer.bnb.boba.network',
        },
      },
      {
        network: 'bobabnbTestnet',
        chainId: 9728,
        urls: {
          apiURL: 'https://blockexplorer.testnet.bnb.boba.network/api',
          browserURL: 'https://blockexplorer.testnet.bnb.boba.network',
        },
      },
      {
        network: 'fantom',
        chainId: 250,
        urls: {
          apiURL: 'https://api.ftmscan.com/api',
          browserURL: 'https://ftmscan.com',
        },
      },
      {
        network: 'bobaopera',
        chainId: 301,
        urls: {
          apiURL: 'https://blockexplorer.bobaopera.boba.network/api',
          browserURL: 'https://blockexplorer.bobaopera.boba.network/',
        },
      },
      {
        network: 'bobaoperaTestnet',
        chainId: 4051,
        urls: {
          apiURL: 'https://blockexplorer.testnet.bobaopera.boba.network/api',
          browserURL: 'https://blockexplorer.testnet.bobaopera.boba.network/',
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
