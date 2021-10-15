import { ethers } from 'ethers'
import dotenv from 'dotenv'
import * as fs from 'fs'
import { getContractFactory } from '@eth-optimism/contracts'
import chalk from 'chalk'

// load token details
import contractList from '../deployment/mainnet/addresses.json'

// load abi
import L1LiquidityPoolJson from '../deployment/artifacts-boba/contracts/LP/L1LiquidityPool.sol/L1LiquidityPool.json'
import L2LiquidityPoolJson from '../deployment/artifacts-boba/contracts/LP/L2LiquidityPool.sol/L2LiquidityPool.json'
import Lib_ResolvedDelegateProxyJson from '../deployment/artifacts-boba/contracts/libraries/Lib_ResolvedDelegateProxy.sol/Lib_ResolvedDelegateProxy.json'

dotenv.config()

const env = process.env
const L1_NODE_WEB3_URL = env.L1_NODE_WEB3_URL
const L2_NODE_WEB3_URL = env.L2_NODE_WEB3_URL

const L1Web3 = new ethers.providers.JsonRpcProvider(L1_NODE_WEB3_URL)
const L2Web3 = new ethers.providers.JsonRpcProvider(L2_NODE_WEB3_URL)

const L2StandardERC20 = getContractFactory('L2StandardERC20')

;(async () => {
  console.log(`🔗 ${chalk.grey(`Verifying ERC20s`)}`)

  for (const eachToken of Object.keys(contractList.TOKENS)) {
    console.log(`🔗 ${chalk.grey(`Verfying L2 ${eachToken}`)}`)

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
        console.log(
          `⭐️ ${chalk.green(`L2 ${eachToken} decimal check passed`)}`
        )
      } else {
        console.log(
          `💊 ${chalk.red(
            `L2 ${eachToken} decimal check failed - error UNEQUAL`
          )}`
        )
        console.log(
          `💊 ${chalk.red(
            `L2 ${eachToken} ${L2ERC20Decimal} L1 ${eachToken} ${L1ERC20Decimal}`
          )}`
        )
      }
    } catch (error) {
      console.log(
        `💊 ${chalk.red(
          `L2 ${eachToken} decimal check failed - error ${error}`
        )}`
      )
    }

    try {
      const L2ERC20Symbol = await L2ERC20.symbol()
      const L1ERC20Symbol = await L1ERC20.symbol()
      if (L2ERC20Symbol === L1ERC20Symbol) {
        console.log(`⭐️ ${chalk.green(`L2 ${eachToken} symbol check passed`)}`)
      } else {
        console.log(
          `💊 ${chalk.red(
            `L2 ${eachToken} symbol check failed - error UNEQUAL`
          )}`
        )
      }
    } catch (error) {
      console.log(
        `💊 ${chalk.red(
          `L2 ${eachToken} symbol check failed - error ${error}`
        )}`
      )
    }

    try {
      const L2ERC20Name = await L2ERC20.name()
      const L1ERC20Name = await L1ERC20.name()
      if (L2ERC20Name === L1ERC20Name) {
        console.log(`⭐️ ${chalk.green(`L2 ${eachToken} name check passed`)}`)
      } else {
        console.log(
          `💊 ${chalk.red(`L2 ${eachToken} name check failed - error UNEQUAL`)}`
        )
      }
    } catch (error) {
      console.log(
        `💊 ${chalk.red(`L2 ${eachToken} name check failed - error ${error}`)}`
      )
    }

    try {
      const L2ERC20L1Token = await L2ERC20.l1Token()
      if (L2ERC20L1Token.toLowerCase() === L1ERC20.address.toLowerCase()) {
        console.log(
          `⭐️ ${chalk.green(`L2 ${eachToken} l1Token check passed`)}`
        )
      } else {
        console.log(
          `💊 ${chalk.red(
            `L2 ${eachToken} l1Token check failed - error WRONG`
          )}`
        )
      }
    } catch (error) {
      console.log(
        `💊 ${chalk.red(
          `L2 ${eachToken} l1Token check failed - error ${error}`
        )}`
      )
    }
  }

  console.log(`🔗 ${chalk.grey(`Verifying L2 LP`)}`)
  const Proxy__L1LPAddress = contractList.Proxy__L1LiquidityPool
  const Proxy__L2LPAddress = contractList.Proxy__L2LiquidityPool
  const L2LPAddress = contractList.L2LiquidityPool

  const L1LPContract = new ethers.Contract(
    Proxy__L1LPAddress,
    L1LiquidityPoolJson.abi,
    L1Web3
  )

  const Proxy__L2LPContract = new ethers.Contract(
    Proxy__L2LPAddress,
    Lib_ResolvedDelegateProxyJson.abi,
    L2Web3
  )

  const L2LPContract = new ethers.Contract(
    Proxy__L2LPAddress,
    L2LiquidityPoolJson.abi,
    L2Web3
  )

  try {
    const proxyTarget = await Proxy__L2LPContract.addressManager('proxyTarget')

    if (proxyTarget === L2LPAddress) {
      console.log(`⭐️ ${chalk.green(`L2 Proxy__LP check passed`)}`)
    } else {
      console.log(`💊 ${chalk.red(`L2 Proxy__LP check failed`)}`)
      console.log(
        `💊 ${chalk.red(`L2 Proxy__LP target address ${proxyTarget}`)}`
      )
    }
  } catch (error) {
    console.log(`💊 ${chalk.red(`L2 Proxy__LP check failed - error ${error}`)}`)
  }

  try {
    const L1LPOwner = await L1LPContract.owner()
    const L2LPOwner = await L2LPContract.owner()

    if (L1LPOwner.toLowerCase() === L2LPOwner.toLowerCase()) {
      console.log(`⭐️ ${chalk.green(`L2 LP owner check passed`)}`)
    } else {
      console.log(`💊 ${chalk.red(`L2 LP owner check failed`)}`)
      console.log(
        `💊 ${chalk.red(
          `L1 LP owner ${L1LPOwner.toLowerCase()} - L2 LP owner ${L2LPOwner.toLowerCase()}`
        )}`
      )
    }
  } catch (error) {
    console.log(`💊 ${chalk.red(`L2 LP owner check failed - error ${error}`)}`)
  }

  try {
    const L2LPTargetL1LPAddress = await L2LPContract.L1LiquidityPoolAddress()

    if (L2LPTargetL1LPAddress === L1LPContract.address) {
      console.log(
        `⭐️ ${chalk.green(`L2 LP L1LiquidityPoolAddress check passed`)}`
      )
    } else {
      console.log(
        `💊 ${chalk.red(`L2 LP L1LiquidityPoolAddress check failed`)}`
      )
      console.log(
        `💊 ${chalk.red(
          `L2 LP L1LiquidityPoolAddress target address ${L2LPTargetL1LPAddress}`
        )}`
      )
    }
  } catch (error) {
    console.log(
      `💊 ${chalk.red(
        `L2 LP L1LiquidityPoolAddress check failed - error ${error}`
      )}`
    )
  }

  try {
    const userRewardFeeRate = await L2LPContract.userRewardFeeRate()
    console.log(
      `⭐️ ${chalk.green(
        `L2 LP userRewardFeeRate ${userRewardFeeRate.toString()}`
      )}`
    )
  } catch (error) {
    console.log(
      `💊 ${chalk.red(`L2 LP userRewardFeeRate check failed - error ${error}`)}`
    )
  }

  try {
    const ownerRewardFeeRate = await L2LPContract.ownerRewardFeeRate()
    console.log(
      `⭐️ ${chalk.green(
        `L2 LP ownerRewardFeeRate ${ownerRewardFeeRate.toString()}`
      )}`
    )
  } catch (error) {
    console.log(
      `💊 ${chalk.red(
        `L2 LP ownerRewardFeeRate check failed - error ${error}`
      )}`
    )
  }

  try {
    const DEFAULT_FINALIZE_WITHDRAWAL_L1_GAS =
      await L2LPContract.DEFAULT_FINALIZE_WITHDRAWAL_L1_GAS()
    console.log(
      `⭐️ ${chalk.green(
        `L2 LP DEFAULT_FINALIZE_WITHDRAWAL_L1_GAS ${DEFAULT_FINALIZE_WITHDRAWAL_L1_GAS.toString()}`
      )}`
    )
  } catch (error) {
    console.log(
      `💊 ${chalk.red(
        `L2 LP DEFAULT_FINALIZE_WITHDRAWAL_L1_GAS check failed - error ${error}`
      )}`
    )
  }

  console.log(`🔗 ${chalk.grey(`Verifying PoolInfo`)}`)
  for (const eachToken of Object.keys(contractList.TOKENS)) {
    const L2ERC20Address = contractList.TOKENS[eachToken].L2
    console.log(`🔗 ${chalk.grey(`Verifying PoolInfo of ERC20 ${eachToken}`)}`)
    try {
      const poolData = await L2LPContract.poolInfo(L2ERC20Address)
      if (
        poolData.startTime !== 0 &&
        poolData.l1TokenAddress.toLowerCase() ===
          contractList.TOKENS[eachToken].L1.toLowerCase() &&
        poolData.l2TokenAddress.toLowerCase() ===
          contractList.TOKENS[eachToken].L2.toLowerCase()
      ) {
        console.log(
          `⭐️ ${chalk.green(`PoolInfo of ERC20 ${eachToken} passed`)}`
        )
      } else {
        console.log(
          `💊 ${chalk.red(
            `PoolInfo of ERC20 ${eachToken} failed - data ${poolData}`
          )}`
        )
      }
    } catch (error) {
      console.log(
        `💊 ${chalk.red(
          `PoolInfo of ERC20 ${eachToken} failed - error ${error}`
        )}`
      )
    }
  }
})().catch((err) => {
  console.log(err)
  process.exit(1)
})
