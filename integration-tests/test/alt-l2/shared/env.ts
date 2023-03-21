/* Imports: External */
import { Wallet, providers, Transaction, Contract } from 'ethers'
import {
  TransactionResponse,
  TransactionReceipt,
} from '@ethersproject/providers'
import { sleep } from '@eth-optimism/core-utils'
import { CrossChainMessenger, MessageStatus, MessageDirection } from '@eth-optimism/sdk'

/* Imports: Internal */
import {
  l1Provider,
  l2Provider,
  replicaProvider,
  verifierProvider,
  l1Wallet,
  l2Wallet,
  l1Wallet_2,
  l2Wallet_2,
  l1Wallet_3,
  l2Wallet_3,
  l1Wallet_4,
  l2Wallet_4,
  getL2BOBA,
  l2BobalinkWallet,
  getL1Bridge,
  getBASEDeployerAddresses,
  getBOBADeployerAddresses,
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
  addressesBASE
  addressesBOBA
  l1Bridge: Contract

  // L2 Contracts
  L2BOBA: Contract

  // The wallets
  l1Wallet: Wallet
  l2Wallet: Wallet
  l1Wallet_2: Wallet
  l2Wallet_2: Wallet
  l1Wallet_3: Wallet
  l2Wallet_3: Wallet
  l1Wallet_4: Wallet
  l2Wallet_4: Wallet
  l2BobalinkWallet: Wallet

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
    this.L2BOBA = args.L2BOBA
    this.l1Wallet = args.l1Wallet
    this.l2Wallet = args.l2Wallet
    this.messenger = args.messenger
    this.messengerFast = args.messengerFast
    this.l1Wallet_2 = args.l1Wallet_2
    this.l2Wallet_2 = args.l2Wallet_2
    this.l1Wallet_3 = args.l1Wallet_3
    this.l2Wallet_3 = args.l2Wallet_3
    this.l1Wallet_4 = args.l1Wallet_4
    this.l2Wallet_4 = args.l2Wallet_4
    this.l2BobalinkWallet = args.l2BobalinkWallet
    this.l1Provider = args.l1Provider
    this.l2Provider = args.l2Provider
    this.verifierProvider = args.verifierProvider
    this.replicaProvider = args.replicaProvider
  }

  static async new(): Promise<OptimismEnv> {
    const addressesBASE = await getBASEDeployerAddresses()
    const addressesBOBA = await getBOBADeployerAddresses()

    const l1Bridge = await getL1Bridge(
      l1Wallet,
      addressesBASE.Proxy__L1StandardBridge
    )

    const network = await l1Provider.getNetwork()

    const L2BOBA = getL2BOBA(l2Wallet)

    const messenger = new CrossChainMessenger({
      l1SignerOrProvider: l1Wallet,
      l2SignerOrProvider: l2Wallet,
      l1ChainId: network.chainId,
      fastRelayer: false,
    })

    const messengerFast = new CrossChainMessenger({
      l1SignerOrProvider: l1Wallet,
      l2SignerOrProvider: l2Wallet,
      l1ChainId: network.chainId,
      fastRelayer: true,
    })

    return new OptimismEnv({
      addressesBASE,
      addressesBOBA,
      messenger,
      messengerFast,
      L2BOBA,
      l1Wallet,
      l2Wallet,
      l1Wallet_2,
      l2Wallet_2,
      l1Wallet_3,
      l2Wallet_3,
      l1Wallet_4,
      l2Wallet_4,
      l2BobalinkWallet,
      l1Provider,
      l2Provider,
      verifierProvider,
      replicaProvider,
      l1Bridge,
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
            err.message.includes('nonce too low') ||
            err.message.includes('transaction was replaced') ||
            err.message.includes(
              'another transaction with same nonce in the queue'
            ) ||
            err.message.includes('replacement transaction underpriced')
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

  async waitForRevertXDomainTransactionL2(
    tx: Promise<TransactionResponse> | TransactionResponse
  ) {
    const { remoteReceipt } = await this.waitForXDomainTransaction(tx)
    const backTx = await this.messenger.l2Provider.getTransaction(remoteReceipt.transactionHash)
    await this.waitForXDomainTransaction(backTx)
  }

  async waitForRevertXDomainTransactionL1(
    tx: Promise<TransactionResponse> | TransactionResponse
  ) {
    const { remoteReceipt } = await this.waitForXDomainTransaction(tx)
    const backTx = await this.messenger.l1Provider.getTransaction(remoteReceipt.transactionHash)
    await this.waitForXDomainTransaction(backTx)
  }

  // async waitForRevertXDomainTransactionFast(
  //   tx: Promise<TransactionResponse> | TransactionResponse
  // ) {
  //   const { remoteReceipt } = await this.waitForXDomainTransactionFast(tx)
  //   const [xDomainMsgHash] = await this.messengerFast.getMessageHashesFromL1Tx(
  //     remoteReceipt.transactionHash
  //   )
  //   await this.messengerFast.getL2TransactionReceipt(xDomainMsgHash)
  // }
}

//   async waitForXDomainTransaction(
//     tx: Promise<TransactionResponse> | TransactionResponse
//   ): Promise<CrossDomainMessagePair> {
//     return waitForXDomainTransaction(this.messenger, tx)
//   }

//   async waitForXDomainTransactionOld(
//     tx: Promise<TransactionResponse> | TransactionResponse,
//     direction: DirectionOld
//   ): Promise<CrossDomainMessagePairOld> {
//     return waitForXDomainTransactionOld(this.watcher, tx, direction)
//   }

//   async waitForXDomainTransactionFastOld(
//     tx: Promise<TransactionResponse> | TransactionResponse,
//     direction: DirectionOld
//   ): Promise<CrossDomainMessagePairOld> {
//     return waitForXDomainTransactionFastOld(this.watcherFast, tx, direction)
//   }

//   async waitForRevertXDomainTransactionOld(
//     tx: Promise<TransactionResponse> | TransactionResponse,
//     direction: DirectionOld
//   ) {
//     const { remoteReceipt } = await waitForXDomainTransactionOld(
//       this.watcher,
//       tx,
//       direction
//     )
//     const [xDomainMsgHash] = await this.watcher.getMessageHashesFromL2Tx(
//       remoteReceipt.transactionHash
//     )
//     await this.watcherFast.getL1TransactionReceipt(xDomainMsgHash)
//   }

//   async waitForRevertXDomainTransactionFastOld(
//     tx: Promise<TransactionResponse> | TransactionResponse,
//     direction: DirectionOld
//   ) {
//     const { remoteReceipt } = await waitForXDomainTransactionOld(
//       this.watcherFast,
//       tx,
//       direction
//     )
//     const [xDomainMsgHash] = await this.watcher.getMessageHashesFromL1Tx(
//       remoteReceipt.transactionHash
//     )
//     await this.watcher.getL2TransactionReceipt(xDomainMsgHash)
//   }

//   /**
//    * Relays all L2 => L1 messages found in a given L2 transaction.
//    *
//    * @param tx Transaction to find messages in.
//    */
//   async relayXDomainMessages(
//     tx: Promise<TransactionResponse> | TransactionResponse
//   ): Promise<void> {
//     tx = await tx

//     let messagePairs = []
//     while (true) {
//       try {
//         messagePairs = await getMessagesAndProofsForL2Transaction(
//           l1Provider,
//           l2Provider,
//           this.scc.address,
//           predeploys.L2CrossDomainMessenger,
//           tx.hash
//         )
//         break
//       } catch (err) {
//         if (err.message.includes('unable to find state root batch for tx')) {
//           await sleep(5000)
//         } else {
//           throw err
//         }
//       }
//     }

//     for (const { message, proof } of messagePairs) {
//       while (true) {
//         try {
//           const result = await this.l1Messenger
//             .connect(this.l1Wallet)
//             .relayMessage(
//               message.target,
//               message.sender,
//               message.message,
//               message.messageNonce,
//               proof
//             )
//           await result.wait()
//           break
//         } catch (err) {
//           if (err.message.includes('execution failed due to an exception')) {
//             await sleep(5000)
//           } else if (err.message.includes('Nonce too low')) {
//             await sleep(5000)
//           } else if (
//             err.message.includes('message has already been received')
//           ) {
//             break
//           } else {
//             throw err
//           }
//         }
//       }
//     }
//   }
// }

// /**
//  * Sets the timeout of a test based on the challenge period of the current network. If the
//  * challenge period is greater than 60s (e.g., on Mainnet) then we skip this test entirely.
//  *
//  * @param testctx Function context of the test to modify (i.e. `this` when inside a test).
//  * @param env Optimism environment used to resolve the StateCommitmentChain.
//  */
// export const useDynamicTimeoutForWithdrawals = async (
//   testctx: any,
//   env: OptimismEnv
// ) => {
//   if (!IS_LIVE_NETWORK) {
//     return
//   }

//   const challengePeriod = await env.scc.FRAUD_PROOF_WINDOW()
//   if (challengePeriod.gt(60)) {
//     console.log(
//       `WARNING: challenge period is greater than 60s (${challengePeriod.toString()}s), skipping test`
//     )
//     testctx.skip()
//   }

//   // 60s for state root batch to be published + (challenge period x 4)
//   const timeoutMs = 60000 + challengePeriod.toNumber() * 1000 * 4
//   console.log(
//     `NOTICE: inside a withdrawal test on a prod network, dynamically setting timeout to ${timeoutMs}ms`
//   )
//   testctx.timeout(timeoutMs)
// }
