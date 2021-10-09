require('@nomiclabs/hardhat-ethers')
require('@nomiclabs/hardhat-etherscan')
require('@nomiclabs/hardhat-waffle')
require('hardhat-deploy')
require('@eth-optimism/hardhat-ovm')

require('dotenv').config()

const env = process.env

const pk_0 = env.pk_0
const pk_1 = env.pk_1
const pk_2 = env.pk_2

const infuraKey = env.INFURA_ID
const etherscanKey = env.ETHERSCAN_ID

module.exports = {
  networks: {
    l1: {
      url: 'http://127.0.0.1:9545',
      accounts: [ pk_0, pk_1, pk_2 ],
      gasPrice: 15000000
    },
    l2: {
      url: 'http://127.0.0.1:8545',
      accounts: [ pk_0, pk_1, pk_2 ],
      gasPrice: 15000000
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${infuraKey}`,
      accounts: [ pk_0, pk_1, pk_2 ],
      network_id: 4,
      //gasPrice: 15000000,
      //gas: 803900000,
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${infuraKey}`,
      accounts: [ pk_0 /*, pk_1, pk_2*/ ],
      network_id: 1,
      gasPrice: 80000000000,
      gas: 'auto',
    },
    // Add this network to your config
    boba_rinkeby: {
      url: 'https://rinkeby.boba.network',
      accounts: [ pk_0, pk_1, pk_2 ],
      network_id: 28,
      gasPrice: 15000000,
      gas: 803900000,
    },
  },
  solidity: {
    version: '0.8.0',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  namedAccounts: {
    deployer: 0
  },
  mocha: {
    timeout: 200000
  },
    etherscan: {
    apiKey: etherscanKey
  },
}