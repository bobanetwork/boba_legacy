import {
  UseBobaAsFeeToken,
  UseBobaAsFeeTokenMetaTransaction,
  UseETHAsFeeToken,
} from '../generated/Boba_GasPriceOracle/Boba_GasPriceOracle'
import {
  UseBobaAsFeeTokenEvent,
  UseBobaAsFeeTokenMetaTransactionEvent,
  UseETHAsFeeTokenEvent,
} from '../generated/schema'

export function handleUseBobaAsFeeToken(event: UseBobaAsFeeToken): void {
  let id = event.transaction.hash.toHex()
  let useBobaAsFeeTokenEvent = new UseBobaAsFeeTokenEvent(id)
  useBobaAsFeeTokenEvent.id = id
  useBobaAsFeeTokenEvent.address = event.params.param0
  useBobaAsFeeTokenEvent.save()
}

export function handleUseBobaAsFeeTokenMetaTransaction(event: UseBobaAsFeeTokenMetaTransaction): void {
  let id = event.transaction.hash.toHex()
  let useBobaAsFeeTokenMetaTransactionEvent = new UseBobaAsFeeTokenMetaTransactionEvent(id)
  useBobaAsFeeTokenMetaTransactionEvent.id = id
  useBobaAsFeeTokenMetaTransactionEvent.address = event.params.param0
  useBobaAsFeeTokenMetaTransactionEvent.save()
}

export function handleUseETHAsFeeToken(event: UseETHAsFeeToken): void {
  let id = event.transaction.hash.toHex()
  let useETHAsFeeTokenEvent = new UseETHAsFeeTokenEvent(id)
  useETHAsFeeTokenEvent.id = id
  useETHAsFeeTokenEvent.address = event.params.param0
  useETHAsFeeTokenEvent.save()
}
