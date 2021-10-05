import { getContractFactory } from '@eth-optimism/contracts'
import { Contract, Wallet } from 'ethers'
import { Watcher } from './watcher'

import {
  getAddressManager,
  getBOBADeployerAddresses,
  l1Provider,
  l2Provider,
  bobl1Wallet,
  bobl2Wallet,
  alicel1Wallet,
  alicel2Wallet,
  katel1Wallet,
  katel2Wallet,
} from './utils'

import {
  initWatcher,
  CrossDomainMessagePair,
  Direction,
  waitForXDomainTransaction,
} from './watcher-utils'

import { TransactionResponse } from '@ethersproject/providers'

/// Helper class for instantiating a test environment with a funded account
export class OptimismEnv {
  // L1 Contracts
  addressManager: Contract
  addressesBOBA

  l2ETHAddress: String

  l1Messenger: Contract
  l2Messenger: Contract

  L1StandardBridge: Contract
  L2StandardBridge: Contract

  l1Provider: any
  l2Provider: any

  // The L1 <> L2 State watcher
  watcher: Watcher
  watcherFast: Watcher

  // The wallets
  bobl1Wallet: Wallet
  bobl2Wallet: Wallet

  alicel1Wallet: Wallet
  alicel2Wallet: Wallet

  katel1Wallet: Wallet
  katel2Wallet: Wallet

  constructor(args: any) {
    this.addressManager = args.addressManager
    this.addressesBOBA = args.addressesBOBA
    this.l2ETHAddress = args.l2ETHAddress
    this.l1Messenger = args.l1Messenger
    this.l2Messenger = args.l2Messenger
    this.L1StandardBridge = args.L1StandardBridge
    this.L2StandardBridge = args.L2StandardBridge
    this.watcher = args.watcher
    this.bobl1Wallet = args.bobl1Wallet
    this.bobl2Wallet = args.bobl2Wallet
    this.alicel1Wallet = args.alicel1Wallet
    this.alicel2Wallet = args.alicel2Wallet
    this.katel1Wallet = args.katel1Wallet
    this.katel2Wallet = args.katel2Wallet
    this.l1Provider = args.l1Provider
    this.l2Provider = args.l2Provider
  }

  static async new(): Promise<OptimismEnv> {
    const addressManager = await getAddressManager(bobl1Wallet)

    const addressesBOBA = await getBOBADeployerAddresses()

    const watcher = await initWatcher(l1Provider, l2Provider, addressManager)

    const l1Messenger = getContractFactory('IL1CrossDomainMessenger')
      .connect(bobl1Wallet)
      .attach(watcher.l1.messengerAddress)

    const l2Messenger = getContractFactory('IL2CrossDomainMessenger')
      .connect(bobl2Wallet)
      .attach(watcher.l2.messengerAddress)

    const L1StandardBridgeAddress = await addressManager.getAddress(
      'Proxy__L1StandardBridge'
    )
    const L1StandardBridge = getContractFactory('L1StandardBridge')
      .connect(bobl1Wallet)
      .attach(L1StandardBridgeAddress)

    const L2StandardBridgeAddress = await L1StandardBridge.l2TokenBridge()
    const L2StandardBridge = getContractFactory('L2StandardBridge')
      .connect(bobl2Wallet)
      .attach(L2StandardBridgeAddress)

    return new OptimismEnv({
      addressManager,
      addressesBOBA,

      l1Messenger,
      l2Messenger,

      L1StandardBridge,
      L2StandardBridge,

      watcher,

      bobl1Wallet,
      bobl2Wallet,

      alicel1Wallet,
      alicel2Wallet,

      katel1Wallet,
      katel2Wallet,

      l1Provider,
      l2Provider,
    })
  }

  async waitForXDomainTransaction(
    tx: Promise<TransactionResponse> | TransactionResponse,
    direction: Direction
  ): Promise<CrossDomainMessagePair> {
    return waitForXDomainTransaction(this.watcher, tx, direction)
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
    console.log('lalal2')
    const [xDomainMsgHash] = await this.watcher.getMessageHashesFromL1Tx(
      remoteReceipt.transactionHash
    )

    console.log('lalal3')
    await this.watcher.getL2TransactionReceipt(xDomainMsgHash)
  }
}
