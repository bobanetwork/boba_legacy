const _ = require('lodash')
const web3 = require('web3')
const ethers = require('ethers')
const fluxAggregatorJson = require('@boba/contracts/artifacts/contracts/oracle/FluxAggregator.sol/FluxAggregator.json')
const addressManagerJSON = require('@eth-optimism/contracts/artifacts/contracts/libraries/resolver/Lib_AddressManager.sol/Lib_AddressManager.json')
const { WebSocketProvider } = require('@ethersproject/providers')
const { logger } = require('./utilities/logger')
const configs = require('./utilities/configs')

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
          logError(e.message, 'oracleAddressesFunds')
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
    .catch((err) => {
      logger.error(`Get ${networkName} balance error`, {
        networkName,
        key: 'balance',
        error: err.message,
      })
    })
}

const logTransaction = (socket, trans, networkName, metadata) => {
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

  socket
    .getTransactionReceipt(trans.hash)
    .then((receipt) => {
      try {
        logger.info('transaction ' + trans.hash, {
          key: 'transaction',
          poolAddress,
          networkName,
          data: _.omit(receipt, ['logs']),
        })
        receipt.logs.forEach((log) => {
          logger.info('event ' + log.address, {
            poolAddress,
            networkName,
            key: 'event',
            data: log,
          })
        })
      } catch (err) {
        logError('Error while logging transaction receipt', 'receipt', {
          ...metadata,
          receipt,
        })
      }
    })
    .catch(
      logError('Error while getting transaction receipt', 'transaction', {
        ...metadata,
      })
    )
}

const logData = (socket, blockNumber, networkName) => {
  const poolAddress =
    networkName === configs.OMGXNetwork.L1
      ? configs.l1PoolAddress
      : configs.l2PoolAddress
  const metadata = {
    blockNumber,
    networkName,
    poolAddress,
  }

  return socket
    .getBlockWithTransactions(blockNumber)
    .then((block) => {
      block?.transactions.forEach((trans) => {
        logTransaction(socket, trans, networkName, metadata)
      })
    })
    .catch(logError('Error while getting block', 'block', { ...metadata }))
}

const onConnected = (networkName) => {
  return (event) => {
    logger.info(`${networkName} network connected`, {
      url: event.target._url,
      key: 'network',
    })
  }
}

const onError = (networkName, provider) => {
  return async (event) => {
    logger.error(`${networkName} network failed to connect`, {
      networkName,
      error: event.message,
      url: event.target._url,
      key: 'network',
    })
    await provider.destroy()
    setTimeout(() => {
      logger.info(`${networkName} reconnecting ...`, {
        networkName,
        url: event.target._url,
        key: 'network',
      })
      setupProvider(networkName, event.target._url)
    }, configs.monitoringReconnectSecs * 1000)
  }
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

const setupProvider = async (networkName, url) => {
  const provider = new WebSocketProvider(url)
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
      } catch (e) {
        logError(e.message, 'AddressManager', {
          address: addressKey,
        })
      }
    }
  }

  provider._websocket.addEventListener('open', onConnected(networkName))
  provider._websocket.addEventListener('error', onError(networkName, provider))
  provider
    ._subscribe('block', ['newHeads'], (result) => {
      const blockNumber = parseInt(result.number, 16)

      // log transactions and events
      logData(provider, result.number, networkName)

      // log balances
      logBalance(provider, blockNumber, networkName).catch()
    })
    .catch()
}

module.exports.setupProvider = setupProvider
