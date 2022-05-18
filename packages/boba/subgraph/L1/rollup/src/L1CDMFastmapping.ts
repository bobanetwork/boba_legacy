import {
  FailedRelayedMessage,
  RelayedMessage,
} from '../generated/L1CrossDomainMessenger/L1CrossDomainMessenger'
import { RelayedMessageFastEntity, FailedRelayedMessageFastEntity } from '../generated/schema'

export function handleFailedRelayedMessage(event: FailedRelayedMessage): void {
  const id = event.params.msgHash.toHex()
  const entity = new FailedRelayedMessageFastEntity(id)
  entity.id = event.params.msgHash.toHex()
  entity.msgHash = event.params.msgHash
  entity.blockNumber = event.block.number

  entity.save()
}

export function handleRelayedMessage(event: RelayedMessage): void {
  const id = event.params.msgHash.toHex()
  const entity = new RelayedMessageFastEntity(id)
  entity.id = event.params.msgHash.toHex()
  entity.msgHash = event.params.msgHash
  entity.blockNumber = event.block.number

  entity.save()
}
