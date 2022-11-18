import { HardhatUserConfig } from 'hardhat/types'
import '@nomiclabs/hardhat-ethers'
import * as dotenv from "dotenv";
import '@openzeppelin/hardhat-upgrades';
import { providers } from "ethers";

dotenv.config();

const config: HardhatUserConfig = {
  mocha: {
    timeout: 300000,
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://mainnet.boba.network",
      }
    },
    boba_local: {
      url: 'http://localhost:8545',
      url_l1: 'http://localhost:9545',
      accounts: process.env.LOCAL_PRIVATE_KEY !== undefined ? [process.env.LOCAL_PRIVATE_KEY] : [],
    } as any,
    boba_goerli: {
      url: 'https://goerli.boba.network',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    boba_mainnet: {
      url: 'https://mainnet.boba.network',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
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
    ],
  },
}

export default config
