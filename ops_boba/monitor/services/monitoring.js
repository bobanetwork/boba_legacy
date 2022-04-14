const axios = require('axios')
const _ = require('lodash')
const web3 = require('web3')
const ethers = require('ethers')
const fluxAggregatorJson = require('@boba/contracts/artifacts/contracts/oracle/FluxAggregator.sol/FluxAggregator.json')
const addressManagerJSON = require('@eth-optimism/contracts/artifacts/contracts/libraries/resolver/Lib_AddressManager.sol/Lib_AddressManager.json')
const addressesMainnet = require('@boba/register/addresses/addressesMainnet_0x8376ac6C3f73a25Dd994E0b0669ca7ee0C02F089')
const L2ERC20Json = require('@eth-optimism/contracts/artifacts/contracts/standards/L2StandardERC20.sol/L2StandardERC20.json')
const L2LPJson = require('@boba/contracts/artifacts/contracts/LP/L2LiquidityPool.sol/L2LiquidityPool.json')
const { logger } = require('./utilities/logger')
const configs = require('./utilities/configs')
const { sleep } = require('@eth-optimism/core-utils')

const supportedTokens = [
  'USDT',
  'DAI',
  'USDC',
  'WBTC',
  'REP',
  'BAT',
  'ZRX',
  'SUSHI',
  'LINK',
  'UNI',
  'BOBA',
  'OMG',
  'FRAX',
  'FXS',
  'DODO',
  'UST',
  'BUSD',
  'BNB',
  'FTM',
  'MATIC',
  'UMA',
  'DOM',
]

let l1PoolBalance
let l1BlockNumber
let l1GasPrice
let l2PoolBalance
let l2BlockNumber
let l2GasPrice
const oracleAddresses = []
const l1Provider = new ethers.providers.StaticJsonRpcProvider(configs.l1Url)
const l2Provider = new ethers.providers.StaticJsonRpcProvider(configs.l2Url)
const addressManager = new ethers.Contract(
  configs.addressManagerAddress,
  addressManagerJSON.abi,
  l1Provider
)
const bobaDecimal = (1e18).toString()

const L2_ETH_Address = '0x4200000000000000000000000000000000000006'
const allTokenAddresses = {}

for (const key of supportedTokens) {
  if (addressesMainnet['TK_L2' + key]) {
    allTokenAddresses[key] = addressesMainnet['TK_L2' + key]
  }
}

const l2TestContract = new ethers.Contract(
  allTokenAddresses['BOBA'],
  L2ERC20Json.abi,
  l2Provider
)
const L2LPContract = new ethers.Contract(
  addressesMainnet.Proxy__L2LiquidityPool,
  L2LPJson.abi,
  l2Provider
)

const convertWeiToEther = (wei) => {
  return parseFloat(web3.utils.fromWei(wei.toString(), 'ether'))
}

const logError = (message, key, extra = {}) => {
  return (err) => {
    logger.error(message, {
      key,
      ...extra,
      error: err.message,
    })
  }
}

const getOracleAmouts = () => {
  const result = {}
  for (const address of oracleAddresses) {
    if (address.amount > -1) {
      result[address.key] = address.amount
    }
  }
  return result
}

const getL2LPInfoPromise = async (tokenAddress) => {
  let tokenBalance
  let tokenSymbol
  let tokenName
  let decimals

  if (tokenAddress === L2_ETH_Address) {
    tokenBalance = (
      await l2Provider.getBalance(addressesMainnet.Proxy__L2LiquidityPool)
    ).toString()
    tokenSymbol = 'ETH'
    tokenName = 'Ethereum'
    decimals = 18
  } else {
    const contract = l2TestContract.attach(tokenAddress)
    tokenBalance = (
      await contract.balanceOf(addressesMainnet.Proxy__L2LiquidityPool)
    ).toString()
    tokenSymbol = await contract.symbol()
    tokenName = await contract.name()
    decimals = await contract.decimals()
  }

  const poolTokenInfo = await L2LPContract.poolInfo(tokenAddress)

  return {
    tokenAddress,
    tokenBalance,
    tokenSymbol,
    tokenName,
    poolTokenInfo,
    decimals,
  }
}

const logL2Pool = async (blockNumber) => {
  const l2LPInfoPromise = []
  Object.keys(allTokenAddresses).forEach((key) => {
    l2LPInfoPromise.push(getL2LPInfoPromise(allTokenAddresses[key]))
  })
  const prices = await axios.get(
    `https://api.coingecko.com/api/v3/simple/price?ids=${supportedTokens.join()}&vs_currencies=usd`,
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }
  )
  const l2LPInfos = await Promise.all(l2LPInfoPromise)
  l2LPInfos.forEach((token) => {
    const userIn = Number(token.poolTokenInfo.userDepositAmount.toString())
    const rewards = Number(token.poolTokenInfo.accUserReward.toString())
    const duration =
      new Date().getTime() - Number(token.poolTokenInfo.startTime) * 1000
    const durationDays = duration / (60 * 60 * 24 * 1000)
    const annualRewardEstimate = (365 * rewards) / durationDays

    let annualYieldEstimate = (100 * annualRewardEstimate) / userIn
    if (!annualYieldEstimate) {
      annualYieldEstimate = 0
    }

    const tokenData = {
      blockNumber,
      symbol: token.tokenSymbol,
      name: token.tokenName,
      decimals: token.decimals,
      l1TokenAddress: token.poolTokenInfo.l1TokenAddress.toLowerCase(),
      l2TokenAddress: token.poolTokenInfo.l2TokenAddress.toLowerCase(),
      accUserReward: parseFloat(
        ethers.utils.formatUnits(
          token.poolTokenInfo.accUserReward,
          token.decimals
        )
      ),
      accUserRewardPerShare: parseFloat(
        ethers.utils.formatUnits(
          token.poolTokenInfo.accUserRewardPerShare,
          token.decimals
        )
      ),
      userDepositAmount: parseFloat(
        ethers.utils.formatUnits(
          token.poolTokenInfo.userDepositAmount,
          token.decimals
        )
      ),
      startTime: token.poolTokenInfo.startTime.toNumber(),
      APR: annualYieldEstimate,
      tokenBalance: parseFloat(
        ethers.utils.formatUnits(token.tokenBalance, token.decimals)
      ),
    }

    if (prices.data[token.tokenSymbol.toLowerCase()]) {
      tokenData.priceUSD = prices.data[token.tokenSymbol.toLowerCase()].usd
      tokenData.totalTokenUSDValue = tokenData.priceUSD * tokenData.tokenBalance
    }

    logger.info(`L2 ${token.tokenSymbol} token pool`, {
      networkName: configs.OMGXNetwork.L2,
      key: 'l2Pool',
      data: tokenData,
    })
  })
}

const logBalance = (provider, blockNumber, networkName) => {
  const promiseData =
    networkName === configs.OMGXNetwork.L1
      ? [
          provider.getBalance(configs.l1PoolAddress),
          provider.getGasPrice(),
          networkName,
        ]
      : [
          provider.getBalance(configs.l2PoolAddress),
          provider.getGasPrice(),
          networkName,
        ]

  return Promise.all(promiseData)
    .then(async (values) => {
      if (values[2] === configs.OMGXNetwork.L1) {
        l1PoolBalance = convertWeiToEther(values[0])
        l1GasPrice = parseFloat(values[1].toString())
        l1BlockNumber = blockNumber
      } else {
        l2PoolBalance = convertWeiToEther(values[0])
        l2GasPrice = parseFloat(values[1].toString())
        l2BlockNumber = blockNumber
        try {
          const amounts = await Promise.all(
            oracleAddresses.map((address) => {
              return address.contract.availableFunds()
            })
          )
          for (let i = 0; i < amounts.length; i++) {
            oracleAddresses[i].amount = ethers.BigNumber.from(amounts[i])
              .div(bobaDecimal)
              .toNumber()
          }
        } catch (e) {
          logError(e.message, 'oracleAddressesFunds')(e)
        }
      }
    })
    .then(() => {
      if (l1PoolBalance !== undefined) {
        logger.info(`${configs.OMGXNetwork.L1} balance`, {
          networkName: configs.OMGXNetwork.L1,
          key: 'balance',
          data: {
            poolAddress: configs.l1PoolAddress,
            poolBalance: l1PoolBalance,
            gasPrice: l1GasPrice,
            blockNumber: l1BlockNumber,
          },
        })
      }
      if (l2PoolBalance !== undefined) {
        logger.info(`${configs.OMGXNetwork.L2} balance`, {
          networkName: configs.OMGXNetwork.L2,
          key: 'balance',
          data: {
            poolAddress: configs.l2PoolAddress,
            poolBalance: l2PoolBalance,
            gasPrice: l2GasPrice,
            blockNumber: l2BlockNumber,
            ...getOracleAmouts(),
          },
        })
      }
    })
    .catch(
      logError(`Get ${networkName} balance error`, 'balance', { networkName })
    )
}

const logTransaction = (provider, trans, networkName, metadata, timestamp) => {
  // check from/to address is pool address
  const poolAddress =
    networkName === configs.OMGXNetwork.L1
      ? configs.l1PoolAddress
      : configs.l2PoolAddress
  // logger.debug({
  //   from: trans.from,
  //   to: trans.to,
  //   poolAddress,
  // })
  if (trans.from !== poolAddress && trans.to !== poolAddress) {
    return
  }

  return provider
    .getTransactionReceipt(trans.hash)
    .then((receipt) => {
      if (!receipt) {
        return
      }
      logger.info('transaction ' + trans.hash, {
        key: 'transaction',
        timestamp,
        poolAddress,
        networkName,
        data: _.omit(receipt, ['logs']),
      })
      receipt.logs.forEach((log) => {
        logger.info('event ' + log.address, {
          poolAddress,
          networkName,
          timestamp,
          key: 'event',
          data: log,
        })
      })
    })
    .catch(
      logError('Error while getting transaction receipt', 'transaction', {
        ...metadata,
      })
    )
}

const logData = (provider, blockNumber, networkName) => {
  const poolAddress =
    networkName === configs.OMGXNetwork.L1
      ? configs.l1PoolAddress
      : configs.l2PoolAddress
  const metadata = {
    blockNumber,
    networkName,
    poolAddress,
  }

  return provider
    .getBlockWithTransactions(blockNumber)
    .then((block) => {
      if (block && block.transactions && block.transactions.length) {
        return Promise.all(
          block.transactions.map((tx) => {
            return logTransaction(
              provider,
              tx,
              networkName,
              metadata,
              new Date(block.timestamp * 1000).toISOString()
            )
          })
        )
      }
    })
    .catch(logError('Error while getting block', 'block', { ...metadata }))
}

module.exports.validateMonitoring = () => {
  return (
    configs.l1WsUrl !== undefined &&
    configs.l2WsUrl !== undefined &&
    configs.l1PoolAddress !== undefined &&
    configs.l2PoolAddress !== undefined &&
    configs.monitoringReconnectSecs !== undefined
  )
}

const initConnection = async (networkName, url) => {
  logger.info(`Trying to connect to the ${networkName} network...`, {
    url,
    key: 'network',
  })
  const provider = new ethers.providers.StaticJsonRpcProvider(url)

  for (let i = 0; i < 10; i++) {
    try {
      await provider.detectNetwork()
      logger.info(`Successfully connected to the ${networkName} network.`, {
        url,
        key: 'network',
      })
      break
    } catch (err) {
      if (i < 9) {
        logger.error(`Unable to connect to ${networkName} network`, {
          url,
          key: 'network',
          retryAttemptsRemaining: 9 - i,
        })
        await sleep(1000)
      } else {
        throw new Error(
          `Unable to connect to the ${networkName} network, check that your ${networkName} endpoint is correct.`
        )
      }
    }
  }

  return provider
}

const setupProvider = async (networkName, url, pollingIntervalSecond = 10) => {
  let provider

  while (!provider) {
    try {
      provider = await initConnection(networkName, url)
      break
    } catch (e) {
      logError(e.message, 'network', { url })(e)
    }
    await sleep(configs.monitoringReconnectSecs * 1000)
  }

  let blockNumber = await provider.getBlockNumber()

  if (networkName === configs.OMGXNetwork.L1) {
    provider.on('debug', (info) => {
      if (info.action === 'request') {
        logger.info('ethers', info.request)
      }
    })
  } else {
    for (const addressKey of configs.oracleAddresses) {
      try {
        const address = await addressManager.getAddress(addressKey)
        oracleAddresses.push({
          address,
          key: addressKey,
          amount: -1,
          contract: new ethers.Contract(
            address,
            fluxAggregatorJson.abi,
            l2Provider
          ),
        })
      } catch (err) {
        logError(err.message, 'AddressManager', {
          address: addressKey,
        })(err)
      }
    }
  }

  while (true) {
    const latestBlock = await provider.getBlockNumber()
    logger.info(`Start monitoring to block ${latestBlock}`, {
      network: networkName,
    })
    const logPromise = []

    for (let i = blockNumber; i <= latestBlock; i++) {
      // log transactions and events
      logPromise.push(logData(provider, i, networkName))
    }

    // log balance
    logPromise.push(logBalance(provider, latestBlock, networkName))

    // log L2 pool
    if (networkName === configs.OMGXNetwork.L2) {
      logPromise.push(logL2Pool(latestBlock))
    }

    await Promise.all(logPromise)

    blockNumber = latestBlock + 1
    await sleep(pollingIntervalSecond * 1000)
  }
}

module.exports.setupProvider = setupProvider
