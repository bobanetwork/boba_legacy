import {
  FailedRelayedMessage,
  RelayedMessage,
} from "../generated/L1CrossDomainMessenger/L1CrossDomainMessenger"
import { RelayedMessageEntity, FailedRelayedMessageEntity } from "../generated/schema"

export function handleFailedRelayedMessage(event: FailedRelayedMessage): void {
  const id = event.params.msgHash.toHex()
  const entity = new FailedRelayedMessageEntity(id)
  entity.id = id
  entity.msgHash = event.params.msgHash
  entity.blockNumber = event.block.number
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRelayedMessage(event: RelayedMessage): void {
  const id = event.params.msgHash.toHex()
  const entity = new RelayedMessageEntity(id)
  entity.id = id
  entity.msgHash = event.params.msgHash
  entity.blockNumber = event.block.number
  entity.transactionHash = event.transaction.hash

  entity.save()
}
