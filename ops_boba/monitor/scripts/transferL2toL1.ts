process.env.NODE_ENV = 'local'
const ethers = require('ethers')
const { logger } = require('../services/utilities/logger')
const { predeploys } = require('@eth-optimism/contracts')
const { OptimismEnv } = require('./utilities/env.ts')



  ; (async () => {
    logger.info(`Get OptimismEnv`)
    const env = await OptimismEnv.new()

    const balance = await env.l2Wallet.getBalance()
    logger.info(`balance before ${balance.toString()}`)

    const withdrawAmount = balance.div(10).mul(9)

    const withdrawTx = await env.l2Bridge.withdraw(
      predeploys.OVM_ETH,
      withdrawAmount,
      0,
      '0xFFFF'
    )
    await withdrawTx.wait()
    logger.info('tx done', { hash: withdrawTx.hash })

    const xDomainTx = await env.waitForXDomainTransaction(withdrawTx)
    logger.info('xDomain tx', { xDomain: xDomainTx })
  })()

