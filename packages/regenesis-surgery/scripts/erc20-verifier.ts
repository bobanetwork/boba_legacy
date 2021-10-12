import { ethers } from 'ethers'
import dotenv from 'dotenv'
import * as fs from 'fs'
import { getContractFactory } from '@eth-optimism/contracts'

// load token details
import contractList from '../deployment/mainnet/addresses.json'

dotenv.config()

const env = process.env
const L1_NODE_WEB3_URL = env.L1_NODE_WEB3_URL
const L2_NODE_WEB3_URL = env.L2_NODE_WEB3_URL

const L1Web3 = new ethers.providers.JsonRpcProvider(L1_NODE_WEB3_URL)
const L2Web3 = new ethers.providers.JsonRpcProvider(L2_NODE_WEB3_URL)

const L2StandardERC20 = getContractFactory('L2StandardERC20')

;(async () => {
  console.log('Verifying ERC20s')

  for (const eachToken of Object.keys(contractList.TOKENS)) {
    console.log(`Verfying L2 ${eachToken}`)

    const L2ERC20 = L2StandardERC20.attach(
      contractList.TOKENS[eachToken].L2
    ).connect(L2Web3)
    const L1ERC20 = L2StandardERC20.attach(
      contractList.TOKENS[eachToken].L1
    ).connect(L1Web3)

    try {
      const L2ERC20Decimal = await L2ERC20.decimals()
      const L1ERC20Decimal = await L1ERC20.decimals()
      if (L2ERC20Decimal === L1ERC20Decimal) {
        console.log(`L2 ${eachToken} decimal check passed`)
      } else {
        console.log(`L2 ${eachToken} decimal check failed - error UNEQUAL`)
        console.log(
          `L2 ${eachToken} ${L2ERC20Decimal} L1 ${eachToken} ${L1ERC20Decimal}`
        )
      }
    } catch (error) {
      console.log(`L2 ${eachToken} decimal check failed - error ${error}`)
    }

    try {
      const L2ERC20Symbol = await L2ERC20.symbol()
      const L1ERC20Symbol = await L1ERC20.symbol()
      if (L2ERC20Symbol === L1ERC20Symbol) {
        console.log(`L2 ${eachToken} symbol check passed`)
      } else {
        console.log(`L2 ${eachToken} symbol check failed - error UNEQUAL`)
      }
    } catch (error) {
      console.log(`L2 ${eachToken} symbol check failed - error ${error}`)
    }

    try {
      const L2ERC20Name = await L2ERC20.name()
      const L1ERC20Name = await L1ERC20.name()
      if (L2ERC20Name === L1ERC20Name) {
        console.log(`L2 ${eachToken} name check passed`)
      } else {
        console.log(`L2 ${eachToken} name check failed - error UNEQUAL`)
      }
    } catch (error) {
      console.log(`L2 ${eachToken} name check failed - error ${error}`)
    }

    try {
      const L2ERC20L1Token = await L2ERC20.l1Token()
      if (L2ERC20L1Token.toLowerCase() === L1ERC20.address.toLowerCase()) {
        console.log(`L2 ${eachToken} l1Token check passed`)
      } else {
        console.log(`L2 ${eachToken} l1Token check failed - error WRONG`)
      }
    } catch (error) {
      console.log(`L2 ${eachToken} l1Token check failed - error ${error}`)
    }
  }
})().catch((err) => {
  console.log(err)
  process.exit(1)
})
