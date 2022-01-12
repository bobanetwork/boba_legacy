import { HardhatUserConfig } from 'hardhat/types'

// Hardhat plugins
import '@nomiclabs/hardhat-ethers'

const config: HardhatUserConfig = {
  mocha: {
    timeout: 300000,
  },
  networks: {
    l1: {
      url: 'http://localhost:9545'
   },
    l2: {
      url: 'http://localhost:8545'
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.7.6'
      },
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
  }
}


export default config
