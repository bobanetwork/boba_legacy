import { HardhatUserConfig } from 'hardhat/types'
import 'solidity-coverage'
import * as dotenv from 'dotenv'
import { ethers } from 'ethers'

// Hardhat plugins
import '@eth-optimism/hardhat-deploy-config'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-etherscan'
import '@typechain/hardhat'
import 'hardhat-deploy'
import 'hardhat-gas-reporter'
import 'hardhat-output-validator'

// Load environment variables from .env
dotenv.config()

const enableGasReport = !!process.env.ENABLE_GAS_REPORT
const privateKey = process.env.PRIVATE_KEY || '0x' + '11'.repeat(32) // this is to avoid hardhat error
const deploy = process.env.DEPLOY_DIRECTORY || 'deploy'

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      live: false,
      saveDeployments: false,
      tags: ['local'],
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
    'boba-goerli': {
      url: 'https://goerli.boba.network',
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
      url: 'https://rpc.fantom.network'
    }
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
        },
      },
      {
        version: '0.5.17', // Required for WETH9
        settings: {
          optimizer: { enabled: true, runs: 10_000 },
        },
      },
    ],
    settings: {
      metadata: {
        bytecodeHash: 'none',
      },
      outputSelection: {
        '*': {
          '*': ['metadata', 'storageLayout'],
        },
      },
    },
  },
  typechain: {
    outDir: 'dist/types',
    target: 'ethers-v5',
  },
  paths: {
    deploy: './deploy',
    deployments: './deployments',
    deployConfig: './deploy-config',
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
      'boba-goerli': process.env.BOBA_MAINNET_KEY,
      moonbeam: process.env.MOONBEAM_KEY,
      bobabeam: 'DEFAULT_KEY',
      bobabase: 'DEFAULT_KEY',
      bnb: process.env.BSCSCAN_KEY,
      bobabnb: 'DEFAULT_KEY',
      bobabnbTestnet: 'DEFAULT_KEY',
      snowtrace: process.env.SNOWTRACE_KEY,
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
        network: 'boba-goerli',
        chainId: 2888,
        urls: {
          apiURL: 'https://api-testnet.bobascan.com/api',
          browserURL: 'https://testnet.bobascan.com',
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
  outputValidator: {
    runOnCompile: true,
    errorMode: false,
    checks: {
      events: false,
      variables: false,
    },
    exclude: ['contracts/test-helpers', 'contracts/test-libraries'],
  },
  deployConfigSpec: {
    isForkedNetwork: {
      type: 'boolean',
      default: false,
    },
    numDeployConfirmations: {
      type: 'number',
      default: 0,
    },
    gasPrice: {
      type: 'number',
      default: undefined,
    },
    l1BlockTimeSeconds: {
      type: 'number',
    },
    l2BlockGasLimit: {
      type: 'number',
    },
    l2ChainId: {
      type: 'number',
    },
    ctcL2GasDiscountDivisor: {
      type: 'number',
    },
    ctcEnqueueGasCost: {
      type: 'number',
    },
    sccFaultProofWindowSeconds: {
      type: 'number',
    },
    sccSequencerPublishWindowSeconds: {
      type: 'number',
    },
    ovmSequencerAddress: {
      type: 'address',
    },
    ovmProposerAddress: {
      type: 'address',
    },
    ovmBlockSignerAddress: {
      type: 'address',
    },
    ovmFeeWalletAddress: {
      type: 'address',
    },
    ovmAddressManagerOwner: {
      type: 'address',
    },
    ovmGasPriceOracleOwner: {
      type: 'address',
    },
    ovmWhitelistOwner: {
      type: 'address',
      default: ethers.constants.AddressZero,
    },
    gasPriceOracleOverhead: {
      type: 'number',
      default: 2750,
    },
    gasPriceOracleScalar: {
      type: 'number',
      default: 1_500_000,
    },
    gasPriceOracleDecimals: {
      type: 'number',
      default: 6,
    },
    gasPriceOracleL1BaseFee: {
      type: 'number',
      default: 1,
    },
    gasPriceOracleL2GasPrice: {
      type: 'number',
      default: 1,
    },
    hfBerlinBlock: {
      type: 'number',
      default: 0,
    },
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
