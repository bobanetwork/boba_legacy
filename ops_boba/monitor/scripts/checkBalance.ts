/* Imports: External */
process.env.NODE_ENV = 'local'
const ethers = require('ethers')
const { logger } = require('../services/utilities/logger')
const { OptimismEnv } = require('./utilities/env.ts')
require('dotenv').config()


    ; (async () => {

        logger.info(`Get OptimismEnv`)
        const env = await OptimismEnv.new()

        const balanceL1 = await env.l1Wallet.getBalance()
        logger.info(`balane of wallet ${env.l1Wallet.address} is ${balanceL1.toString()}`)

        const balanceL2 = await env.l2Wallet.getBalance()
        logger.info(`balane of wallet ${env.l2Wallet.address} is ${balanceL2.toString()}`)
    })()
