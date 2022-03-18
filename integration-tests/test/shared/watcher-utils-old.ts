import {
  JsonRpcProvider,
  TransactionReceipt,
  TransactionResponse,
} from '@ethersproject/providers'
import { Watcher } from '@eth-optimism/core-utils'

import { Contract, Transaction } from 'ethers'

export const initWatcherOld = async (
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

export const initWatcherFastOld = async (
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

export interface CrossDomainMessagePairOld {
  tx: Transaction
  receipt: TransactionReceipt
  remoteTx: Transaction
  remoteReceipt: TransactionReceipt
}

export enum DirectionOld {
  L1ToL2,
  L2ToL1,
}

export const waitForXDomainTransactionFastOld = async (
  watcherFast: Watcher,
  tx: Promise<TransactionResponse> | TransactionResponse,
  direction: DirectionOld
): Promise<CrossDomainMessagePairOld> => {
  return waitForXDomainTransactionOld(watcherFast, tx, direction)
}

export const waitForXDomainTransactionOld = async (
  watcher: Watcher,
  tx: Promise<TransactionResponse> | TransactionResponse,
  direction: DirectionOld
): Promise<CrossDomainMessagePairOld> => {
  const { src, dest } =
    direction === DirectionOld.L1ToL2
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
