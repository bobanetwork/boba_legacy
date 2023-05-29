import '@nomiclabs/hardhat-ethers'
import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-deploy'

import fs from 'fs'

import { HardhatUserConfig } from 'hardhat/config'
import { NetworkUserConfig } from 'hardhat/src/types/config'

const mnemonicFileName = process.env.MNEMONIC_FILE
let mnemonic = 'test '.repeat(11) + 'junk'
if (mnemonicFileName != null && fs.existsSync(mnemonicFileName)) {
  mnemonic = fs.readFileSync(mnemonicFileName, 'ascii').trim()
}


const config: HardhatUserConfig = {
  typechain: {
    outDir: 'dist/src/types',
    target: 'ethers-v5'
  },
  networks: {
    localhost: {
      url: 'http://localhost:8545/',
      saveDeployments: false
    },
    goerli: {
      url: 'https://goerli.gateway.tenderly.co',
      accounts: {
        mnemonic
      }
    }
  },
  solidity: {
    version: '0.8.15',
    settings: {
      optimizer: { enabled: true }
    }
  }
}

export default config
