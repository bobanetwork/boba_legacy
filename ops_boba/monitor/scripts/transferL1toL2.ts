process.env.NODE_ENV = 'local'
const ethers = require('ethers')
const { logger } = require('../services/utilities/logger')
const { OptimismEnv } = require('./utilities/env.ts')

require('dotenv').config()

  ; (async () => {
    const env = await OptimismEnv.new()

    const balance = await env.l2Wallet.getBalance()
    logger.info(balance.toString())

    const depositAmount = ethers.BigNumber.from('500000000000900000')
    const fundETHTx = await env.l1Bridge.depositETH(8_000_000, '0x', {
      value: depositAmount,
      // gasLimit: 2_000_000, // Idk, gas estimation was broken and this fixes it.
    })

    await fundETHTx.wait()
    logger.info('tx done', { hash: fundETHTx.hash })

    const xDomainTx = await env.waitForXDomainTransaction(fundETHTx)
    logger.info('xDomain tx', { xDomain: xDomainTx })
  })()

