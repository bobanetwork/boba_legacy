/* Imports: External */
import { Contract, utils, Wallet, providers } from 'ethers'
import { TransactionResponse } from '@ethersproject/providers'
import { getContractFactory, predeploys } from '@eth-optimism/contracts'
import { Watcher } from '@eth-optimism/core-utils'
import { getMessagesAndProofsForL2Transaction } from '@eth-optimism/message-relayer'

/* Imports: Internal */
import {
  getAddressManager,
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
  fundUser,
  getOvmEth,
  getL1Bridge,
  getL2Bridge,
  IS_LIVE_NETWORK,
  getBOBADeployerAddresses,
  sleep,
} from './utils'
import {
  initWatcher,
  initWatcherFast,
  CrossDomainMessagePair,
  Direction,
  waitForXDomainTransaction,
  waitForXDomainTransactionFast,
} from './watcher-utils'

/// Helper class for instantiating a test environment with a funded account
export class OptimismEnv {
  // L1 Contracts
  addressManager: Contract
  addressesBOBA
  l1Bridge: Contract
  l1Messenger: Contract
  l1BlockNumber: Contract
  ctc: Contract
  scc: Contract

  // L2 Contracts
  ovmEth: Contract
  l2Bridge: Contract
  l2Messenger: Contract
  gasPriceOracle: Contract
  sequencerFeeVault: Contract

  // The L1 <> L2 State watcher
  watcher: Watcher
  watcherFast: Watcher

  // The wallets
  l1Wallet: Wallet
  l2Wallet: Wallet
  l1Wallet_2: Wallet
  l2Wallet_2: Wallet
  l1Wallet_3: Wallet
  l2Wallet_3: Wallet
  l1Wallet_4: Wallet
  l2Wallet_4: Wallet

  // The providers
  l1Provider: providers.JsonRpcProvider
  l2Provider: providers.JsonRpcProvider
  verifierProvider: providers.JsonRpcProvider
  replicaProvider: providers.JsonRpcProvider

  constructor(args: any) {
    this.addressManager = args.addressManager
    this.addressesBOBA = args.addressesBOBA
    this.l1Bridge = args.l1Bridge
    this.l1Messenger = args.l1Messenger
    this.l1BlockNumber = args.l1BlockNumber
    this.ovmEth = args.ovmEth
    this.l2Bridge = args.l2Bridge
    this.l2Messenger = args.l2Messenger
    this.gasPriceOracle = args.gasPriceOracle
    this.sequencerFeeVault = args.sequencerFeeVault
    this.watcher = args.watcher
    this.watcherFast = args.watcherFast
    this.l1Wallet = args.l1Wallet
    this.l2Wallet = args.l2Wallet
    this.l1Wallet_2 = args.l1Wallet_2
    this.l2Wallet_2 = args.l2Wallet_2
    this.l1Wallet_3 = args.l1Wallet_3
    this.l2Wallet_3 = args.l2Wallet_3
    this.l1Wallet_4 = args.l1Wallet_4
    this.l2Wallet_4 = args.l2Wallet_4
    this.l1Provider = args.l1Provider
    this.l2Provider = args.l2Provider
    this.verifierProvider = args.verifierProvider
    this.replicaProvider = args.replicaProvider
    this.ctc = args.ctc
    this.scc = args.scc
  }

  static async new(): Promise<OptimismEnv> {
    const addressManager = getAddressManager(l1Wallet)
    const addressesBOBA = await getBOBADeployerAddresses()
    const watcher = await initWatcher(l1Provider, l2Provider, addressManager)
    const watcherFast = await initWatcherFast(
      l1Provider,
      l2Provider,
      addressManager
    )
    const l1Bridge = await getL1Bridge(l1Wallet, addressManager)

    // fund the user if needed
    const balance = await l2Wallet.getBalance()
    if (balance.isZero()) {
      await fundUser(watcher, l1Bridge, utils.parseEther('20'))
    }
    const l1Messenger = getContractFactory('L1CrossDomainMessenger')
      .connect(l1Wallet)
      .attach(watcher.l1.messengerAddress)
    const l1MessengerFast = getContractFactory('IL1CrossDomainMessenger')
      .connect(l1Wallet)
      .attach(watcherFast.l1.messengerAddress)
    const ovmEth = getOvmEth(l2Wallet)
    const l2Bridge = await getL2Bridge(l2Wallet)
    const l2Messenger = getContractFactory('L2CrossDomainMessenger')
      .connect(l2Wallet)
      .attach(watcher.l2.messengerAddress)

    const ctcAddress = await addressManager.getAddress(
      'CanonicalTransactionChain'
    )
    const ctc = getContractFactory('CanonicalTransactionChain')
      .connect(l1Wallet)
      .attach(ctcAddress)

    const gasPriceOracle = getContractFactory('OVM_GasPriceOracle')
      .connect(l2Wallet_4)
      .attach(predeploys.OVM_GasPriceOracle)

    const sccAddress = await addressManager.getAddress('StateCommitmentChain')
    const scc = getContractFactory('StateCommitmentChain')
      .connect(l1Wallet)
      .attach(sccAddress)

    const sequencerFeeVault = getContractFactory('OVM_SequencerFeeVault')
      .connect(l2Wallet)
      .attach(predeploys.OVM_SequencerFeeVault)

    const l1BlockNumber = getContractFactory('iOVM_L1BlockNumber')
      .connect(l2Wallet)
      .attach(predeploys.OVM_L1BlockNumber)

    return new OptimismEnv({
      addressManager,
      addressesBOBA,
      l1Bridge,
      ctc,
      scc,
      l1Messenger,
      l1BlockNumber,
      l1MessengerFast,
      ovmEth,
      gasPriceOracle,
      sequencerFeeVault,
      l2Bridge,
      l2Messenger,
      watcher,
      watcherFast,
      l1Wallet,
      l2Wallet,
      l1Wallet_2,
      l2Wallet_2,
      l1Wallet_3,
      l2Wallet_3,
      l1Wallet_4,
      l2Wallet_4,
      l1Provider,
      l2Provider,
      verifierProvider,
      replicaProvider,
    })
  }

  async waitForXDomainTransaction(
    tx: Promise<TransactionResponse> | TransactionResponse,
    direction: Direction
  ): Promise<CrossDomainMessagePair> {
    return waitForXDomainTransaction(this.watcher, tx, direction)
  }

  async waitForXDomainTransactionFast(
    tx: Promise<TransactionResponse> | TransactionResponse,
    direction: Direction
  ): Promise<CrossDomainMessagePair> {
    return waitForXDomainTransactionFast(this.watcherFast, tx, direction)
  }

  async waitForRevertXDomainTransaction(
    tx: Promise<TransactionResponse> | TransactionResponse,
    direction: Direction
  ) {
    const { remoteReceipt } = await waitForXDomainTransaction(
      this.watcher,
      tx,
      direction
    )
    const [xDomainMsgHash] = await this.watcher.getMessageHashesFromL2Tx(
      remoteReceipt.transactionHash
    )
    await this.watcherFast.getL1TransactionReceipt(xDomainMsgHash)
  }

  async waitForRevertXDomainTransactionFast(
    tx: Promise<TransactionResponse> | TransactionResponse,
    direction: Direction
  ) {
    const { remoteReceipt } = await waitForXDomainTransaction(
      this.watcherFast,
      tx,
      direction
    )
    const [xDomainMsgHash] = await this.watcher.getMessageHashesFromL1Tx(
      remoteReceipt.transactionHash
    )
    await this.watcher.getL2TransactionReceipt(xDomainMsgHash)
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

    let messagePairs = []
    while (true) {
      try {
        messagePairs = await getMessagesAndProofsForL2Transaction(
          l1Provider,
          l2Provider,
          this.scc.address,
          predeploys.L2CrossDomainMessenger,
          tx.hash
        )
        break
      } catch (err) {
        if (err.message.includes('unable to find state root batch for tx')) {
          await sleep(5000)
        } else {
          throw err
        }
      }
    }

    for (const { message, proof } of messagePairs) {
      while (true) {
        try {
          const result = await this.l1Messenger
            .connect(this.l1Wallet)
            .relayMessage(
              message.target,
              message.sender,
              message.message,
              message.messageNonce,
              proof
            )
          await result.wait()
          break
        } catch (err) {
          if (err.message.includes('execution failed due to an exception')) {
            await sleep(5000)
          } else if (err.message.includes('Nonce too low')) {
            await sleep(5000)
          } else if (
            err.message.includes('message has already been received')
          ) {
            break
          } else {
            throw err
          }
        }
      }
    }
  }
}

/**
 * Sets the timeout of a test based on the challenge period of the current network. If the
 * challenge period is greater than 60s (e.g., on Mainnet) then we skip this test entirely.
 *
 * @param testctx Function context of the test to modify (i.e. `this` when inside a test).
 * @param env Optimism environment used to resolve the StateCommitmentChain.
 */
export const useDynamicTimeoutForWithdrawals = async (
  testctx: any,
  env: OptimismEnv
) => {
  if (!IS_LIVE_NETWORK) {
    return
  }

  const challengePeriod = await env.scc.FRAUD_PROOF_WINDOW()
  if (challengePeriod.gt(60)) {
    console.log(
      `WARNING: challenge period is greater than 60s (${challengePeriod.toString()}s), skipping test`
    )
    testctx.skip()
  }

  // 60s for state root batch to be published + (challenge period x 4)
  const timeoutMs = 60000 + challengePeriod.toNumber() * 1000 * 4
  console.log(
    `NOTICE: inside a withdrawal test on a prod network, dynamically setting timeout to ${timeoutMs}ms`
  )
  testctx.timeout(timeoutMs)
}
