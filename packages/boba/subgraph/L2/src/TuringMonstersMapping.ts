import { Transfer } from '../generated/TuringMonsters/TuringMonsters'
import { TuringMonstersTransferEvent } from '../generated/schema'

export function handleTuringMonstersTransferEvent(event: Transfer): void {
  let id = `${event.transaction.hash.toHex()}_${event.params.tokenId.toString()}`
  let eventObj = new TuringMonstersTransferEvent(id)
  eventObj.id = id
  eventObj.from = event.params.from
  eventObj.to = event.params.to
  eventObj.tokenId = event.params.tokenId.toString()
  eventObj.save()
}
