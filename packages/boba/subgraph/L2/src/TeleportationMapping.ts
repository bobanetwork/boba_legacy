import { AssetReceived, DisbursementSuccess, DisbursementFailed, DisbursementRetrySuccess } from '../generated/Teleportation/Teleportation'
import { TeleportationAssetReceivedEvent, TeleportationDisbursementSuccessEvent, TeleportationDisbursementFailedEvent, TeleportationDisbursementRetrySuccessEvent } from '../generated/schema'
import {ethereum} from "@graphprotocol/graph-ts";

export function handleTeleportationAssetReceived(event: AssetReceived): void {
  let id = `${event.transaction.hash.toHex()}_${event.params.depositId.toString()}`
  let eventObj = new TeleportationAssetReceivedEvent(id)
  eventObj.id = id
  eventObj.token = event.params.token
  eventObj.sourceChainId = event.params.sourceChainId.toString()
  eventObj.toChainId = event.params.toChainId.toString()
  eventObj.depositId = event.params.depositId.toString()
  eventObj.emitter = event.params.emitter
  eventObj.amount = event.params.amount.toString()
  eventObj.txHash = event.transaction.hash
  eventObj.blockNumber = event.block.number.toString()
  eventObj.blockTimestamp = event.block.timestamp.toString()
  eventObj.save()
}

export function handleTeleportationDisbursementSuccess(event: DisbursementSuccess): void {
  let id = `${event.transaction.hash.toHex()}_${event.params.depositId.toString()}`
  let eventObj = new TeleportationDisbursementSuccessEvent(id)
  eventObj.id = id
  eventObj.depositId = event.params.depositId.toString()
  eventObj.to = event.params.to
  eventObj.token = event.params.token
  eventObj.amount = event.params.amount.toString()
  eventObj.sourceChainId = event.params.sourceChainId.toString()
  eventObj.txHash = event.transaction.hash
  eventObj.blockNumber = event.block.number.toString()
  eventObj.blockTimestamp = event.block.timestamp.toString()
  eventObj.save()
}

export function handleTeleportationDisbursementFailed(event: DisbursementFailed): void {
  let id = `${event.transaction.hash.toHex()}_${event.params.depositId.toString()}`
  let eventObj = new TeleportationDisbursementFailedEvent(id)
  eventObj.id = id
  eventObj.depositId = event.params.depositId.toString()
  eventObj.to = event.params.to
  eventObj.amount = event.params.amount.toString()
  eventObj.sourceChainId = event.params.sourceChainId.toString()
  eventObj.txHash = event.transaction.hash
  eventObj.blockNumber = event.block.number.toString()
  eventObj.blockTimestamp = event.block.timestamp.toString()
  eventObj.save()
}

export function handleTeleportationDisbursementRetrySuccess(event: DisbursementRetrySuccess): void {
  let id = `${event.transaction.hash.toHex()}_${event.params.depositId.toString()}`
  let eventObj = new TeleportationDisbursementRetrySuccessEvent(id)
  eventObj.id = id
  eventObj.depositId = event.params.depositId.toString()
  eventObj.to = event.params.to
  eventObj.amount = event.params.amount.toString()
  eventObj.sourceChainId = event.params.sourceChainId.toString()
  eventObj.txHash = event.transaction.hash
  eventObj.blockNumber = event.block.number.toString()
  eventObj.blockTimestamp = event.block.timestamp.toString()
  eventObj.save()
}

