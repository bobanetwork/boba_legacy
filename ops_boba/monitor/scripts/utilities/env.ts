/* Imports: External */
import { utils, Wallet, providers, Transaction, Contract } from 'ethers'
import {
    TransactionResponse,
    TransactionReceipt,
} from '@ethersproject/providers'
import { sleep } from '@eth-optimism/core-utils'
import {
    CrossChainMessenger,
    MessageStatus,
    MessageDirection,
    DEFAULT_L2_CONTRACT_ADDRESSES,
    StandardBridgeAdapter,
    ETHBridgeAdapter,
} from '@eth-optimism/sdk'

import { getContractFactory, predeploys } from '@eth-optimism/contracts'

/* Imports: Internal */
import {
    l1Provider,
    l2Provider,
    l1Wallet,
    l2Wallet,
    getL1Bridge,
    getL2Bridge,
    getBASEDeployerAddresses,
    getBOBADeployerAddresses,
    envConfig,
    getOvmEth,
} from './utils'

export interface CrossDomainMessagePair {
    tx: Transaction
    receipt: TransactionReceipt
    remoteTx: Transaction
    remoteReceipt: TransactionReceipt
}

// Helper class for instantiating a test environment with a funded account
export class OptimismEnv {
    // L1 Contracts
    addressManager: Contract
    addressesBASE
    addressesBOBA
    l1Bridge: Contract
    // l1Messenger: Contract
    // l1BlockNumber: Contract
    //ctc: Contract
    //scc: Contract

    // L2 Contracts
    ovmEth: Contract
    l2Bridge: Contract
    //l2Messenger: Contract
    //gasPriceOracle: Contract
    //sequencerFeeVault: Contract

    // The L1 <> L2 State watcher
    //watcher: Watcher
    //watcherFast: Watcher

    // The wallets
    l1Wallet: Wallet
    l2Wallet: Wallet


    // The providers
    messenger: CrossChainMessenger
    messengerFast: CrossChainMessenger
    l1Provider: providers.JsonRpcProvider
    l2Provider: providers.JsonRpcProvider
    verifierProvider: providers.JsonRpcProvider
    replicaProvider: providers.JsonRpcProvider

    constructor(args: any) {
        this.addressesBASE = args.addressesBASE
        this.addressesBOBA = args.addressesBOBA
        this.l1Bridge = args.l1Bridge
        this.l2Bridge = args.l2Bridge
        //this.l1Messenger = args.l1Messenger
        //this.l1BlockNumber = args.l1BlockNumber
        this.ovmEth = args.ovmEth
        this.l1Wallet = args.l1Wallet
        this.l2Wallet = args.l2Wallet
        this.messenger = args.messenger
        this.messengerFast = args.messengerFast
        this.l1Provider = args.l1Provider
        this.l2Provider = args.l2Provider
        this.verifierProvider = args.verifierProvider
        this.replicaProvider = args.replicaProvider
        //this.ctc = args.ctc
        //this.scc = args.scc
    }

    static async new(): Promise<OptimismEnv> {
        const addressesBASE = await getBASEDeployerAddresses()
        // const addressesBOBA = await getBOBADeployerAddresses()
        const addressesBOBA = await getBASEDeployerAddresses()

        console.log("l1Wallet", l1Wallet.getAddress());
        console.log("l2Wallet", l2Wallet.getAddress());

        const l1Bridge = await getL1Bridge(
            l1Wallet,
            addressesBASE.Proxy__L1StandardBridge
        )

        const l2Bridge = await getL2Bridge(
            l2Wallet,
            DEFAULT_L2_CONTRACT_ADDRESSES.L2StandardBridge.toString(),
        )

        const network = await l1Provider.getNetwork()

        const ovmEth = getOvmEth(l2Wallet)

        const contracts = {
            l1: {
                AddressManager: addressesBASE.AddressManager,
                L1CrossDomainMessenger: addressesBASE.Proxy__L1CrossDomainMessenger,
                L1CrossDomainMessengerFast: "0xB942FA2273C7Bce69833e891BDdFd7212d2dA415", // TODO
                L1StandardBridge: addressesBASE.Proxy__L1StandardBridge,
                StateCommitmentChain: addressesBASE.StateCommitmentChain,
                CanonicalTransactionChain: addressesBASE.CanonicalTransactionChain,
                BondManager: addressesBASE.BondManager,
                L1MultiMessageRelayer: addressesBASE.L1MultiMessageRelayer,
            },
            l2: DEFAULT_L2_CONTRACT_ADDRESSES,
        };
        const bridges = {
            Standard: {
                Adapter: StandardBridgeAdapter,
                l1Bridge: addressesBASE.Proxy__L1StandardBridge,
                l2Bridge: predeploys.L2StandardBridge,
            },
            ETH: {
                Adapter: ETHBridgeAdapter,
                l1Bridge: addressesBASE.Proxy__L1StandardBridge,
                l2Bridge: predeploys.L2StandardBridge,
            },
        };

        const messenger = new CrossChainMessenger({
            l1SignerOrProvider: l1Wallet,
            l2SignerOrProvider: l2Wallet,
            l1ChainId: network.chainId,
            fastRelayer: false,
            contracts: contracts,
            bridges: bridges,
        })

        const messengerFast = new CrossChainMessenger({
            l1SignerOrProvider: l1Wallet,
            l2SignerOrProvider: l2Wallet,
            l1ChainId: network.chainId,
            fastRelayer: true,
            contracts: contracts,
            bridges: bridges,
        })

        return new OptimismEnv({
            addressesBASE,
            addressesBOBA,
            messenger,
            messengerFast,
            ovmEth,
            l1Wallet,
            l2Wallet,
            l1Provider,
            l2Provider,
            l1Bridge,
            l2Bridge,
        })
    }

    async waitForXDomainTransaction(
        tx: Promise<TransactionResponse> | TransactionResponse
    ): Promise<CrossDomainMessagePair> {
        // await it if needed
        tx = await tx

        const receipt = await tx.wait()
        const resolved = await this.messenger.toCrossChainMessage(tx)
        const messageReceipt = await this.messenger.waitForMessageReceipt(tx)
        let fullTx: any
        let remoteTx: any
        if (resolved.direction === MessageDirection.L1_TO_L2) {
            fullTx = await this.messenger.l1Provider.getTransaction(tx.hash)
            remoteTx = await this.messenger.l2Provider.getTransaction(
                messageReceipt.transactionReceipt.transactionHash
            )
        } else {
            fullTx = await this.messenger.l2Provider.getTransaction(tx.hash)
            remoteTx = await this.messenger.l1Provider.getTransaction(
                messageReceipt.transactionReceipt.transactionHash
            )
        }

        return {
            tx: fullTx,
            receipt,
            remoteTx,
            remoteReceipt: messageReceipt.transactionReceipt,
        }
    }

    async waitForXDomainTransactionFast(
        tx: Promise<TransactionResponse> | TransactionResponse
    ): Promise<CrossDomainMessagePair> {
        // await it if needed
        tx = await tx
        console.log('XDF - done waiting for tx:', tx.hash)

        const receipt = await tx.wait()
        console.log('XDF - receipt:', receipt.transactionHash)

        const resolved = await this.messengerFast.toCrossChainMessage(tx)
        console.log('XDF - resolved:', resolved.transactionHash)

        const messageReceipt = await this.messengerFast.waitForMessageReceipt(tx)
        console.log(
            'XDF - messageReceipt:',
            messageReceipt.transactionReceipt.transactionHash
        )

        let fullTx: any
        let remoteTx: any
        if (resolved.direction === MessageDirection.L1_TO_L2) {
            fullTx = await this.messengerFast.l1Provider.getTransaction(tx.hash)
            remoteTx = await this.messengerFast.l2Provider.getTransaction(
                messageReceipt.transactionReceipt.transactionHash
            )
        } else {
            fullTx = await this.messengerFast.l2Provider.getTransaction(tx.hash)
            remoteTx = await this.messengerFast.l1Provider.getTransaction(
                messageReceipt.transactionReceipt.transactionHash
            )
        }

        return {
            tx: fullTx,
            receipt,
            remoteTx,
            remoteReceipt: messageReceipt.transactionReceipt,
        }
    }

    /**
     * Relays all L2 => L1 messages found in a given L2 transaction.
     *
     * @param tx Transaction to find messages in.
     */
    async relayXDomainMessages(
        tx: Promise<TransactionResponse> | TransactionResponse
    ): Promise<void> {
        tx = await tx
        await tx.wait()

        const messages = await this.messenger.getMessagesByTransaction(tx)
        if (messages.length === 0) {
            return
        }

        for (const message of messages) {
            await this.messenger.waitForMessageStatus(
                message,
                MessageStatus.READY_FOR_RELAY
            )

            let relayed = false
            while (!relayed) {
                try {
                    await this.messenger.finalizeMessage(message)
                    relayed = true
                } catch (err) {
                    if (
                        err.message.includes('Nonce too low') ||
                        err.message.includes('transaction was replaced') ||
                        err.message.includes(
                            'another transaction with same nonce in the queue'
                        )
                    ) {
                        // Sometimes happens when we run tests in parallel.
                        await sleep(5000)
                    } else if (
                        err.message.includes('message has already been received')
                    ) {
                        // Message already relayed, this is fine.
                        relayed = true
                    } else {
                        throw err
                    }
                }
            }

            await this.messenger.waitForMessageReceipt(message)
        }
    }

    /**
     * Relays all L2 => L1 messages found in a given L2 transaction.
     *
     * @param tx Transaction to find messages in.
     */
    async relayXDomainMessagesFast(
        tx: Promise<TransactionResponse> | TransactionResponse
    ): Promise<void> {
        tx = await tx
        await tx.wait()

        const messages = await this.messengerFast.getMessagesByTransaction(tx)
        if (messages.length === 0) {
            return
        }

        for (const message of messages) {
            await this.messengerFast.waitForMessageStatus(
                message,
                MessageStatus.READY_FOR_RELAY
            )

            let relayed = false
            while (!relayed) {
                try {
                    await this.messengerFast.finalizeMessage(message)
                    relayed = true
                } catch (err) {
                    if (
                        err.message.includes('Nonce too low') ||
                        err.message.includes('transaction was replaced') ||
                        err.message.includes(
                            'another transaction with same nonce in the queue'
                        )
                    ) {
                        // Sometimes happens when we run tests in parallel.
                        await sleep(5000)
                    } else if (
                        err.message.includes('message has already been received')
                    ) {
                        // Message already relayed, this is fine.
                        relayed = true
                    } else {
                        throw err
                    }
                }
            }

            await this.messengerFast.waitForMessageReceipt(message)
        }
    }
}