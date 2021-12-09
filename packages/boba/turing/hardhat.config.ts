import { HardhatUserConfig } from 'hardhat/types'

// Hardhat plugins
import '@nomiclabs/hardhat-ethers'
//import '@eth-optimism/hardhat-ovm'

const config: HardhatUserConfig = {
  mocha: {
    timeout: 300000,
  },
  networks: {
    boba_local: {
      url: 'http://localhost:8545',
      //gas: 6000000,
      //gas: 10000, //Its value should be "auto" or a number. If a number is used, it will be the gas limit used by default in every transaction.
      //gasPrice: 1,//Its value should be "auto" or a number. This parameter behaves like gas. Default value: "auto".
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.8.0",
      },
      {
        version: "0.6.12",
        settings: {},
      },
    ],
  },
}

export default config
