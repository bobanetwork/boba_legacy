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
