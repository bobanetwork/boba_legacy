import { HardhatUserConfig } from 'hardhat/types'
import '@nomiclabs/hardhat-ethers'
import * as dotenv from "dotenv";

import "@nomicfoundation/hardhat-foundry";

dotenv.config();

const config: HardhatUserConfig = {
  mocha: {
    timeout: 300000,
  },
  networks: {
    boba_local: {
      url: 'http://localhost:8545',
      accounts: ['0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97', '0xde9be858da4a475276426320d5e9262ecfc3ba460bfac56360bfa6c4c28b4ee0', '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', '0xc526ee95bf44d8fc405a158bb884d9d1238d99f0612e9f33d006bb0789009aaa'],
    },
    boba_goerli: {
      url: 'https://replica.goerli.boba.network',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    boba_bnb_testnet: {
      url: 'https://boba-bnb-testnet.gateway.tenderly.co/1clfZoq7qEGyF4SQvF8gvI',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    boba_mainnet: {
      url: 'https://boba-ethereum.gateway.tenderly.co/1clfZoq7qEGyF4SQvF8gvI',
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
