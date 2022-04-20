import {
  UseBobaAsFeeToken,
  SwapBOBAForETHMetaTransaction,
  UseETHAsFeeToken,
} from '../generated/Boba_GasPriceOracle/Boba_GasPriceOracle'
import {
  UseBobaAsFeeTokenEvent,
  SwapBOBAForETHMetaTransactionEvent,
  UseETHAsFeeTokenEvent,
} from '../generated/schema'

export function handleUseBobaAsFeeToken(event: UseBobaAsFeeToken): void {
  let id = event.transaction.hash.toHex()
  let useBobaAsFeeTokenEvent = new UseBobaAsFeeTokenEvent(id)
  useBobaAsFeeTokenEvent.id = id
  useBobaAsFeeTokenEvent.address = event.params.param0
  useBobaAsFeeTokenEvent.save()
}

export function handleSwapBOBAForETHMetaTransaction(event: SwapBOBAForETHMetaTransaction): void {
  let id = event.transaction.hash.toHex()
  let swapBOBAForETHMetaTransactionEvent = new SwapBOBAForETHMetaTransactionEvent(id)
  swapBOBAForETHMetaTransactionEvent.id = id
  swapBOBAForETHMetaTransactionEvent.address = event.params.param0
  swapBOBAForETHMetaTransactionEvent.save()
}

export function handleUseETHAsFeeToken(event: UseETHAsFeeToken): void {
  let id = event.transaction.hash.toHex()
  let useETHAsFeeTokenEvent = new UseETHAsFeeTokenEvent(id)
  useETHAsFeeTokenEvent.id = id
  useETHAsFeeTokenEvent.address = event.params.param0
  useETHAsFeeTokenEvent.save()
}
