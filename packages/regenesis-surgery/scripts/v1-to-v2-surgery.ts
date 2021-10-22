import { ethers } from 'ethers'
import dotenv from 'dotenv'
import * as fs from 'fs'

// load token details
import contractList from '../deployment/mainnet/addresses.json'

// load v2 token bytecode with decimal
import v2PredeployedContractBtyecode from '../v2PredeployedContractBtyecode.json'

// load state-dump
import stateDumpLatest from '../state-dump/state-dump.latest.json'
import stateDumpProd from '../state-dump/state-dump.prod.json'

// load contracts
import Proxy__L2LiquidityPoolJson from '../deployment/artifacts-boba/contracts/libraries/Lib_ResolvedDelegateProxy.sol/Lib_ResolvedDelegateProxy.json'
import L2LiquidityPoolJson from '../deployment/artifacts-boba/contracts/LP/L2LiquidityPool.sol/L2LiquidityPool.json'
import ERC2470Json from '../deployment/artifacts-boba/contracts/ERC2470.sol/SingletonFactory.json'

dotenv.config()

/*****************************************************************/
/* The steps of creating the state-dump.latest.json for mainnet
 *
 * 1. We copy the clean state-dump.latest.json from ./contracts/dist/dump/ to
 * state-dump folder
 *
 * 2. Add storage for oETH
 *
 * 3. Add tokens' bytecode and addresses
 *
 * 4. Add LP contracts
 *
 * 5. Add nonce and balance for all addresses
 */
/*****************************************************************/

const env = process.env
const STATE_DUMP_OUTPUT_PATH =
  env.STATE_DUMP_OUTPUT_PATH || './state-dump/state-dump.latest-ready.json'
const OETH_ADDRESS =
  env.OETH_ADDRESS || '0x4200000000000000000000000000000000000006'
// DON'T TOUCH
const balance = ''
const ERC2470 = '0xce0042B868300000d44A59004Da54A005ffdcf9f'

;(async () => {
  console.log('Ready to patch state dump')

  const allocLatest = stateDumpLatest['alloc']
  const accountsProd = stateDumpProd['accounts']

  console.log('Adding storage for oETH')
  allocLatest[OETH_ADDRESS].storage = accountsProd[OETH_ADDRESS].storage

  // Fix oETH storage
  delete allocLatest[OETH_ADDRESS].storage[
    '0x0000000000000000000000000000000000000000000000000000000000000005'
  ]

  // Fix oETH bytecode
  allocLatest[OETH_ADDRESS].code = v2PredeployedContractBtyecode['oETH']

  for (const eachToken of Object.keys(contractList['TOKENS'])) {
    console.log(`Adding token - ${eachToken}`)
    const tokenL2Address = contractList['TOKENS'][eachToken]['L2']
    const tokenStorage = accountsProd[tokenL2Address.toLowerCase()].storage
    // Fix ERC20s storage
    tokenStorage[
      '0x0000000000000000000000000000000000000000000000000000000000000005'
    ] = contractList['TOKENS'][eachToken]['L1']
    let tokenBytecode
    if (eachToken === 'USDT' || eachToken === 'USDC') {
      tokenBytecode = v2PredeployedContractBtyecode['decimal_6']
    } else if (eachToken === 'WBTC') {
      tokenBytecode = v2PredeployedContractBtyecode['decimal_8']
    } else {
      tokenBytecode = v2PredeployedContractBtyecode['decimal_18']
    }
    allocLatest[tokenL2Address] = {
      storage: tokenStorage,
      code: tokenBytecode,
      nonce: ethers.utils.hexlify(
        accountsProd[tokenL2Address.toLowerCase()].nonce
      ),
      balance,
    }
  }

  console.log(`Adding L2 liquidity pool`)
  const Proxy__L2LiquidityPoolAddress = contractList['Proxy__L2LiquidityPool']
  const L2LiquidityPoolAddress = contractList['L2LiquidityPool']
  const Proxy__L2LiquidityPoolAddressBytecode =
    Proxy__L2LiquidityPoolJson.deployedBytecode
  const Proxy__L2LiquidityPoolAddressStorage =
    accountsProd[Proxy__L2LiquidityPoolAddress.toLowerCase()].storage
  const L2LiquidityPoolAddressBytecode = L2LiquidityPoolJson.deployedBytecode
  const L2LiquidityPoolAddressStorage =
    accountsProd[L2LiquidityPoolAddress.toLowerCase()].storage
  allocLatest[Proxy__L2LiquidityPoolAddress] = {
    storage: Proxy__L2LiquidityPoolAddressStorage,
    code: Proxy__L2LiquidityPoolAddressBytecode,
    balance,
    nonce: ethers.utils.hexlify(
      accountsProd[Proxy__L2LiquidityPoolAddress.toLowerCase()].nonce
    ),
  }
  allocLatest[L2LiquidityPoolAddress] = {
    storage: L2LiquidityPoolAddressStorage,
    code: L2LiquidityPoolAddressBytecode,
    balance,
    nonce: ethers.utils.hexlify(
      accountsProd[L2LiquidityPoolAddress.toLowerCase()].nonce
    ),
  }

  console.log(`Adding nonce and balance`)
  for (const eachAddress of Object.keys(accountsProd)) {
    // only update EOA account
    if (
      accountsProd[eachAddress].code === v2PredeployedContractBtyecode['EOA'] ||
      Object.keys(allocLatest).includes(eachAddress)
    ) {
      const nonce = accountsProd[eachAddress].nonce
      allocLatest[eachAddress] = {
        ...allocLatest[eachAddress],
        balance,
        nonce: ethers.utils.hexlify(nonce),
      }
    }
  }

  console.log(`Adding ERC-2470`)
  allocLatest[ERC2470] = {
    code: ERC2470Json.deployedBytecode,
    balance,
    nonce: ethers.utils.hexlify(0),
  }

  console.log(`exporting state-dump.latest.json`)
  const genesis = {
    ...stateDumpLatest,
    alloc: allocLatest,
  }

  fs.writeFileSync(STATE_DUMP_OUTPUT_PATH, JSON.stringify(genesis, null, 4))
})().catch((err) => {
  console.log(err)
  process.exit(1)
})
