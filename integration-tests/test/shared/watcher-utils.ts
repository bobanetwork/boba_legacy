import {
  JsonRpcProvider,
  TransactionReceipt,
  TransactionResponse,
} from '@ethersproject/providers'
import { Watcher } from '@eth-optimism/core-utils'

import { Contract, Transaction } from 'ethers'

export const initWatcher = async (
  l1Provider: JsonRpcProvider,
  l2Provider: JsonRpcProvider,
  AddressManager: Contract
) => {
  const l1MessengerAddress = await AddressManager.getAddress(
    'Proxy__L1CrossDomainMessenger'
  )
  const l2MessengerAddress = await AddressManager.getAddress(
    'L2CrossDomainMessenger'
  )
  return new Watcher({
    l1: {
      provider: l1Provider,
      messengerAddress: l1MessengerAddress,
    },
    l2: {
      provider: l2Provider,
      messengerAddress: l2MessengerAddress,
    },
  })
}

export const initWatcherFast = async (
  l1Provider: JsonRpcProvider,
  l2Provider: JsonRpcProvider,
  AddressManager: Contract
) => {
  const l1MessengerAddressFast = await AddressManager.getAddress(
    'Proxy__L1CrossDomainMessengerFast'
  )
  const l2MessengerAddress = await AddressManager.getAddress(
    'L2CrossDomainMessenger'
  )
  return new Watcher({
    l1: {
      provider: l1Provider,
      messengerAddress: l1MessengerAddressFast,
    },
    l2: {
      provider: l2Provider,
      messengerAddress: l2MessengerAddress,
    },
  })
}

export interface CrossDomainMessagePair {
  tx: Transaction
  receipt: TransactionReceipt
  remoteTx: Transaction
  remoteReceipt: TransactionReceipt
}

export enum Direction {
  L1ToL2,
  L2ToL1,
}

export const waitForXDomainTransactionFast = async (
  watcherFast: Watcher,
  tx: Promise<TransactionResponse> | TransactionResponse,
  direction: Direction
): Promise<CrossDomainMessagePair> => {
  return waitForXDomainTransaction(watcherFast, tx, direction)
}

export const waitForXDomainTransaction = async (
  watcher: Watcher,
  tx: Promise<TransactionResponse> | TransactionResponse,
  direction: Direction
): Promise<CrossDomainMessagePair> => {
  const { src, dest } =
    direction === Direction.L1ToL2
      ? { src: watcher.l1, dest: watcher.l2 }
      : { src: watcher.l2, dest: watcher.l1 }

  // await it if needed
  tx = await tx

  // get the receipt and the full transaction
  const receipt = await tx.wait()
  const fullTx = await src.provider.getTransaction(tx.hash)

  // get the message hash which was created on the SentMessage
  const [xDomainMsgHash] = await watcher.getMessageHashesFromTx(src, tx.hash)

  // Get the transaction and receipt on the remote layer
  const remoteReceipt = await watcher.getTransactionReceipt(
    dest,
    xDomainMsgHash
  )
  const remoteTx = await dest.provider.getTransaction(
    remoteReceipt.transactionHash
  )

  return {
    tx: fullTx,
    receipt,
    remoteTx,
    remoteReceipt,
  }
}
