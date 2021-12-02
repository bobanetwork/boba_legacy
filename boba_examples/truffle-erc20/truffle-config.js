const HDWalletProvider = require('@truffle/hdwallet-provider')

require('dotenv').config()
const env = process.env

const pk_1 = env.pk_1
const pk_2 = env.pk_2

module.exports = {
  contracts_build_directory: './build',
  networks: {
    boba_rinkeby: {
      provider: function () {
        return new HDWalletProvider({
          privateKeys: [pk_1, pk_2],
          providerOrUrl: 'https://rinkeby.boba.network',
        })
      },
      network_id: 28,
      host: 'https://rinkeby.boba.network',
    }
  },
  compilers: {
    solc: {
      version: '0.6.12',
    },
  },
}
