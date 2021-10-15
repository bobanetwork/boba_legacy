require('dotenv').config();

const env = process.env;
const mnemonicPhrase = env.mnemonic
const HDWalletProvider = require('@truffle/hdwallet-provider')

const pk_0 = env.pk_0
const pk_1 = env.pk_1
const pk_2 = env.pk_2

module.exports = {
  contracts_build_directory: './build',
  networks: {
    rinkeby_l2: {
      provider: function () {
        return new HDWalletProvider({
          privateKeys: [ pk_0, pk_1, pk_2 ],
          providerOrUrl: 'https://rinkeby-v2.boba.network',
        })
      },
      network_id: 420,
      host: 'https://rinkeby-v2.boba.network',
      //gasPrice: 15000000,
      //gas: 803900000,
    },
    local: {
      provider: function () {
        return new HDWalletProvider({
          privateKeys: [ pk_0, pk_1, pk_2 ],
          providerOrUrl: 'http://localhost:8545',
        })
      },
      network_id: 31338,
      host: 'http://localhost:8545',
      //gas: 10000000
      //gasPrice: 15000000,
      //gas: 803900000,
    },
    local_g: {
      provider: function () {
        return new HDWalletProvider({
          privateKeys: [ pk_0, pk_1, pk_2 ],
          providerOrUrl: 'http://localhost:8545',
        })
      },
      network_id: 1234,
      host: 'http://localhost:8545',
      //gas: 803900000
      //gasPrice: 15000000,
      //gas: 803900000,
    }
  },
  compilers: {
    solc: {
      version: "^0.5.16",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    }
  }
}
