const HDWalletProvider = require('@truffle/hdwallet-provider')

require('dotenv').config()
const env = process.env

const pk_1 = env.pk_1
const pk_2 = env.pk_2

module.exports = {
  contracts_build_directory: './build',
  networks: {
    boba_goerli: {
      provider: function () {
        return new HDWalletProvider({
          privateKeys: [pk_1, pk_2],
          providerOrUrl: 'https://goerli.boba.network',
        })
      },
      network_id: 2888,
      host: 'https://goerli.boba.network',
    }
  },
  compilers: {
    solc: {
      version: '0.6.12',
    },
  },
}
