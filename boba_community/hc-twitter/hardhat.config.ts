import { HardhatUserConfig } from 'hardhat/types'
import '@nomiclabs/hardhat-ethers'
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  mocha: {
    timeout: 300000,
  },
  networks: {
    boba_local: {
      url: 'http://localhost:8545',
      accounts: process.env.LOCAL_PRIVATE_KEY !== undefined ? [process.env.LOCAL_PRIVATE_KEY] : [],
    },
    boba_goerli: {
      url: 'https://goerli.boba.network',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    boba_bnb_testnet: {
      url: 'https://testnet.bnb.boba.network',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    boba_avax_testnet: {
      url: 'https://testnet.avax.boba.network/',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    boba_rinkeby: {
      url: 'https://rinkeby.boba.network',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    } as any,
    boba_mainnet: {
      url: 'http://mainnet.boba.network',
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
