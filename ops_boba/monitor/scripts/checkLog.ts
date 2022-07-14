process.env.NODE_ENV = 'local'
import { ethers } from 'ethers'
import { logger } from '../services/utilities/logger'
const { OptimismEnv } = require('./utilities/env.ts')

import l2StandardBridgeJson from '@eth-optimism/contracts/artifacts/contracts/L2/messaging/L2StandardBridge.sol/L2StandardBridge.json'


    ; (async () => {
        const env = await OptimismEnv.new()
        const latestBlock = await env.l2Provider.getBlockNumber();
        logger.info(`latest blockNumber ${latestBlock}`)

        logger.info("query depositFailed")

        const l2StandardBridgeContract = new ethers.Contract(
            env.addressesBASE.Proxy__L1StandardBridge,
            l2StandardBridgeJson.abi,
            env.l1Wallet
        )

        const logs = await l2StandardBridgeContract.queryFilter(
            l2StandardBridgeContract.filters.DepositFailed(),
            Number(0),
            Number(1000),
        )

        if (logs.length) {
            for (const log of logs) {
                const hash = log.transactionHash
                const blockHash = log.blockHash
                const blockNumber = Number(log.blockNumber)
                logger.info(`hash: ${hash}`)
                logger.info(`blockHash ${blockHash}`)
                logger.info(`blockNumber ${blockNumber}`)
            }
        }

        logger.info("query depositFinalized")

        const failedLogs = await l2StandardBridgeContract.queryFilter(
            l2StandardBridgeContract.filters.DepositFinalized(),
            Number(0),
            Number(1000),
        )

        if (failedLogs.length) {
            for (const log of failedLogs) {
                const hash = log.transactionHash
                const blockHash = log.blockHash
                const blockNumber = Number(log.blockNumber)
                logger.info(`hash: ${hash}`)
                logger.info(`blockHash ${blockHash}`)
                logger.info(`blockNumber ${blockNumber}`)
            }
        }
    })()
