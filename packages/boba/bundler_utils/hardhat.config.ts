// import '@nomiclabs/hardhat-ethers'
import '@nomicfoundation/hardhat-toolbox'
import '@typechain/hardhat'
import { HardhatUserConfig } from 'hardhat/config'

const config: HardhatUserConfig = {
  typechain: {
    outDir: 'dist/src/types',
    target: 'ethers-v5'
  },
  solidity: {
    version: '0.8.15',
    settings: {
      optimizer: { enabled: true }
    }
  }
}

export default config
