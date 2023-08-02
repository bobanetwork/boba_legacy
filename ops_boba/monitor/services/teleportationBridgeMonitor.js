#!/usr/bin/env node

const ethers = require('ethers')
const DatabaseService = require('./database.service')
const GlobalEnv = require('./utils/globalEnv')
const {sleep} = require('@eth-optimism/core-utils')

const maximumBlockRange = 49999
const teleportationMonitorInterval = 100000
const testnets = [
    {
        name: 'L1:Goerli',
        provider: new ethers.providers.StaticJsonRpcProvider('https://goerli.gateway.tenderly.co'),
        startBlock: '9322135',
        logInterval: '1000',
        contract: '0xC226F132A686A08018431C913d87693396246024',
    },
    {
        name: 'L1:BNB_Testnet',
        provider: new ethers.providers.StaticJsonRpcProvider('https://endpoints.omniatech.io/v1/bsc/testnet/public'),
        startBlock: '31747477',
        logInterval: '1000',
        contract: '0x1b633BdA998507795A4552809be25D1dCe1d881d',
    },
    {
        name: 'L2:Goerli',
        provider: new ethers.providers.StaticJsonRpcProvider('https://replica.goerli.boba.network'),
        startBlock: '3820',
        logInterval: '1000',
        contract: '0x64bD91c67af8cd17e04BeBDaac675f0EF6527edd',
    },
    {
        name: 'L2:BNB_Testnet',
        provider: new ethers.providers.StaticJsonRpcProvider('https://replica.testnet.bnb.boba.network'),
        startBlock: '240152',
        logInterval: '1000',
        contract: '0xC226F132A686A08018431C913d87693396246024',
    }
]
const mainnets = [
    // TODO: Not deployed yet
]

class TeleportationBridgeMonitorService extends GlobalEnv {
    /** @dev Contains providers, blocks for all supported teleportation networks to watch */
    supportedNetworks = this.teleportationUseTestnets ? testnets : mainnets

    constructor() {
        super(...arguments)

        this.databaseService = new DatabaseService()
    }

    async initConnection() {
        this.logger.info('Trying to connect to supported networks for teleportation...')
        for (let supportedNetwork of this.supportedNetworks) {
            this.logger.info(`Testing next provider: ${supportedNetwork.name}`)
            const attempts = 10
            for (let i = 0; i < attempts; i++) {
                try {
                    await supportedNetwork.provider.detectNetwork()
                    this.logger.info(`Successfully connected to ${supportedNetwork.name} network.`)
                    break
                } catch (err) {
                    if (i < (attempts - 1)) {
                        this.logger.info(`Unable to connect to network: ${supportedNetwork.name}`, {
                            retryAttemptsRemaining: attempts - i,
                        })
                        await sleep(1000)
                    } else {
                        throw new Error(
                            `Unable to connect to network, check that your endpoints are correct: ${supportedNetwork.name}`
                        )
                    }
                }
            }
        }

        await this.initGlobalEnv()
        await this.databaseService.initMySQL()

        this.logger.info('Teleportation SQL schema & global env setup.')

        // fetch the last end block
        for (let i = 0; i < this.supportedNetworks.length; i++) {
            const chainId = (await this.supportedNetworks[i].provider.getNetwork()).chainId
            const startBlockQueryObj = (
                await this.databaseService.getNewestBlockFromTeleportationBridgeTable(chainId)
            )

            this.logger.info(`Start block for network ${i} found: ${startBlockQueryObj}`)

            if (startBlockQueryObj && startBlockQueryObj?.length) {
                this.supportedNetworks[i].startBlock = Number(startBlockQueryObj[0]['maxBlock'])
            }
            this.supportedNetworks[i].endBlock =
                Number(this.supportedNetworks[i].startBlock) + Number(this.supportedNetworks[i].logInterval)

            if ((this.supportedNetworks[i].endBlock - this.supportedNetworks[i].startBlock) > maximumBlockRange) {
                this.supportedNetworks[i].endBlock = this.supportedNetworks[i].startBlock + maximumBlockRange
            }

            this.logger.info(`Have set endBlock for network ${i}, got: ${this.supportedNetworks[i].endBlock}.`)
        }
    }

    async startTeleportationMonitor() {
        for (const supportedNetwork of this.supportedNetworks) {
            await this.startTeleportationMonitorForNetwork(supportedNetwork)
        }
        this.logger.info(`Have monitored all networks: ${this.supportedNetworks?.length}`)
        await sleep(teleportationMonitorInterval)
    }

    async startTeleportationMonitorForNetwork(supportedNetwork) {
        const latestBlock = await supportedNetwork.provider.getBlockNumber()

        const endBlock = Math.min(latestBlock, supportedNetwork.endBlock)
        if (supportedNetwork.startBlock > endBlock) {
            supportedNetwork.startBlock = endBlock
        }

        this.logger.info(`Monitoring new network until latestBlock ${latestBlock}, startBlock ${supportedNetwork.startBlock}, endBlock ${endBlock}`)
        const teleportationLog = await supportedNetwork.provider.getLogs({
            address: supportedNetwork.contract,
            fromBlock: Number(supportedNetwork.startBlock),
            toBlock: Number(endBlock),
        })

        this.logger.info(`Found ${teleportationLog.length} events for current network.`)

        if (teleportationLog.length) {
            for (const eachEvent of teleportationLog) {
                const TeleportationEvent = this.TeleportationInterface.parseLog(eachEvent)
                this.logger.info(`Received event ${TeleportationEvent.name}`)
                if (
                    TeleportationEvent.name === 'AssetReceived' ||
                    TeleportationEvent.name === 'DisbursementSuccess' ||
                    TeleportationEvent.name === 'DisbursementFailed' ||
                    TeleportationEvent.name === 'DisbursementRetrySuccess'
                ) {
                    const hash = eachEvent.transactionHash
                    const blockHash = eachEvent.blockHash
                    const blockNumber = eachEvent.blockNumber
                    const timestamp = Number(
                        (await supportedNetwork.provider.getBlock(blockNumber)).timestamp
                    )

                    this.logger.info(`Received event for teleportation for current network: ${TeleportationEvent.name}, hash: ${hash}`)

                    if (TeleportationEvent.name === 'AssetReceived') {
                        const {token, sourceChainId, toChainId, depositId, emitter, amount} = TeleportationEvent.args
                        const payload = {
                            depositHash: hash,
                            depositBlockHash: blockHash,
                            depositBlockNumber: blockNumber,
                            depositSender: emitter,
                            depositChainId: sourceChainId,
                            depositId: depositId,
                            depositToken: token,
                            depositAmount: amount,
                            disburseChainId: toChainId,
                            lastUpdatedTimestamp: timestamp,
                            status: 'asset_received'
                        }
                        await this.databaseService.insertTeleportationAssetReceived(payload)
                    }

                    if (TeleportationEvent.name === 'DisbursementFailed') {
                        const {depositId, to, amount, sourceChainId} = TeleportationEvent.args
                        const payload = {
                            disburseHash: hash,
                            disburseBlockHash: blockHash,
                            disburseBlockNumber: blockNumber,
                            disburseReceiver: to,
                            disburseToken: ethers.constants.AddressZero, // always native, token disbursement reverts before sending tx
                            lastUpdatedTimestamp: timestamp,
                            status: 'disbursement_failed',
                            // for filters
                            depositChainId: sourceChainId,
                            depositId: depositId,
                            depositAmount: amount,
                        }
                        await this.databaseService.insertTeleportationDisbursement(payload)
                    }

                    if (TeleportationEvent.name === 'DisbursementRetrySuccess') {
                        const {depositId, to, amount, sourceChainId} = TeleportationEvent.args
                        const payload = {
                            disburseHash: hash,
                            disburseBlockHash: blockHash,
                            disburseBlockNumber: blockNumber,
                            disburseReceiver: to,
                            disburseToken: ethers.constants.AddressZero, // always native, token disbursement reverts before sending tx
                            lastUpdatedTimestamp: timestamp,
                            status: 'disbursement_success',
                            // for filters
                            depositChainId: sourceChainId,
                            depositId: depositId,
                            depositAmount: amount,
                        }
                        await this.databaseService.insertTeleportationDisbursement(payload)
                    }

                    if (TeleportationEvent.name === 'DisbursementSuccess') {
                        const {depositId, to, token, amount, sourceChainId} = TeleportationEvent.args
                        const payload = {
                            disburseHash: hash,
                            disburseBlockHash: blockHash,
                            disburseBlockNumber: blockNumber,
                            disburseReceiver: to,
                            disburseToken: token,
                            lastUpdatedTimestamp: timestamp,
                            status: 'disbursement_success',
                            // for filters
                            depositChainId: sourceChainId,
                            depositId: depositId,
                            depositAmount: amount,
                        }
                        await this.databaseService.insertTeleportationDisbursement(payload)
                    }
                    this.logger.info(
                        `Finished saving event for current network.`
                    )
                }
            }
            this.logger.info(
                `Finished saving all events for current network.`
            )
        }

        supportedNetwork.startBlock = endBlock
        supportedNetwork.endBlock = Number(endBlock) + Number(supportedNetwork.logInterval)
        this.logger.info(`Finished current network, new startBlock: ${supportedNetwork.startBlock}, new endBlock: ${supportedNetwork.endBlock}`)
    }
}

module.exports = TeleportationBridgeMonitorService
