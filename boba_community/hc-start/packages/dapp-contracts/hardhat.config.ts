import { HardhatUserConfig } from 'hardhat/types'
import '@nomiclabs/hardhat-ethers'
import * as dotenv from "dotenv";
import '@openzeppelin/hardhat-upgrades';

dotenv.config();

const config: HardhatUserConfig = {
  mocha: {
    timeout: 300000,
  },
  networks: {
    boba_local: {
      url: 'http://localhost:8545',
      accounts: [
        process.env.LOCAL_PRIVATE_KEY,
        process.env.LOCAL_PRIVATE_KEY_2,
      ],
    },
    boba_goerli: {
      url: 'https://goerli.boba.network',
      accounts: [process.env.PRIVATE_KEY, process.env.PRIVATE_KEY_2],
    },
    boba_mainnet: {
      url: 'https://mainnet.boba.network',
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
