import { ethers } from 'ethers'
import dotenv from 'dotenv'
import * as fs from 'fs'
import chalk from 'chalk'

// Load state dump from `geth dump` - format should be [{},{},{}]
import rawStateDump from '../deployment/state-dump.raw.json'
// State dump from /packages/contracts
import coreStateDump from '@eth-optimism/contracts/dist/dumps/state-dump.latest.json'

// Load the bytecodes of Boba and xBoba token with the correct OFFSET value
import BobaAndXBobaContract from '../BobaAndXBobaContract.json'

// Get contract list
import deployedContractList from '@boba/register/addresses/addressesRinkeby_0x93A96D6A5beb1F661cf052722A1424CDDA3e9418.json'

dotenv.config()

const env = process.env

;(async () => {
  // Load the state dump
  const initStateDump: [any] = JSON.parse(JSON.stringify(rawStateDump))

  const L2BobaAddress = deployedContractList.TK_L2BOBA
  const L2xBobaAddress = deployedContractList.TK_L2xBOBA

  // Remove root, key and codeHash, hexlify the nonce, replace bytecode
  const updatedStateDump = initStateDump.reduce((acc, cur) => {
    acc[cur.address] = {
      balance: cur.balance,
      nonce: ethers.utils.hexlify(cur.nonce),
    }
    if (cur.code) {
      acc[cur.address].code = cur.code
    }
    if (cur.storage) {
      acc[cur.address].storage = cur.storage
    }
    // Replace bytecode of L2 BOBA
    if (ethers.utils.getAddress(cur.address) === L2BobaAddress) {
      console.log(`🔗 ${chalk.grey(`Replaced the bytecode of L2BOBA`)}`)
      acc[cur.address].code = BobaAndXBobaContract.BOBA
    }
    // Replace bytecode of L2 xBoba
    if (ethers.utils.getAddress(cur.address) === L2xBobaAddress) {
      console.log(`🔗 ${chalk.grey(`Replaced the bytecode of L2xBOBA`)}`)
      acc[cur.address].code = BobaAndXBobaContract.xBOBA
    }
    return acc
  }, {})

  coreStateDump.alloc = updatedStateDump
  fs.writeFileSync(
    './deployment/state-dump.final.json',
    JSON.stringify(coreStateDump)
  )
})().catch((err) => {
  console.log(err)
  process.exit(1)
})
