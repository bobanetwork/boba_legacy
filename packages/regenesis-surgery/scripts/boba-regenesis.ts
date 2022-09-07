import { ethers } from 'ethers'
import * as fs from 'fs'

// Load state dump from `geth dump` - format should be [{},{},{}]
import rawStateDump from '../deployment/state-dump.regenesis.json'
// State dump from /packages/contracts
import coreStateDump from '@eth-optimism/contracts/dist/dumps/state-dump.latest.json'
;(async () => {
  // Load the state dump
  const initStateDump: [any] = JSON.parse(JSON.stringify(rawStateDump))

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
