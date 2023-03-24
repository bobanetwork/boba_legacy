import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import { HardhatUserConfig } from 'hardhat/config'
import 'hardhat-deploy'
import '@nomiclabs/hardhat-etherscan'
import './tasks/deploy'
import 'solidity-coverage'

import * as dotenv from 'dotenv'

// Load environment variables from .env
dotenv.config()

if (!process.env.L1_NODE_WEB3_URL) {
  process.env.L1_NODE_WEB3_URL = 'http://localhost:9545'
}

const optimizedComilerSettings = {
  version: '0.8.17',
  settings: {
    optimizer: { enabled: true, runs: 10_000 },
    viaIR: true
  }
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5'
  },
  solidity: {
    compilers: [{
      version: '0.8.15',
      settings: {
        optimizer: { enabled: true, runs: 10_000 }
      }
    }],
    overrides: {
      'contracts/core/EntryPoint.sol': optimizedComilerSettings,
      'contracts/samples/SimpleAccount.sol': optimizedComilerSettings
    }
  },
  networks: {
    boba: {
      url: 'http://localhost:8545',
      saveDeployments: false,
    },
    localhost: {
      url: 'http://localhost:9545',
      allowUnlimitedContractSize: true,
      timeout: 1800000,
      accounts: [
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      ],
    },
    mainnet: {
      url: process.env.L1_NODE_WEB3_URL,
    },
    'boba-mainnet': {
      url: 'https://mainnet.boba.network',
    },
    goerli: {
      url: process.env.L1_NODE_WEB3_URL || '',
    },
  },
  mocha: {
    timeout: 300000
  },

  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY,
  },

}

// coverage chokes on the "compilers" settings
if (process.env.COVERAGE != null) {
  // @ts-ignore
  config.solidity = config.solidity.compilers[0]
}

export default config
