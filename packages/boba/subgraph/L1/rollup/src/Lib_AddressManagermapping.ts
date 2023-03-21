import {
  AddressSet,
  SetAddressCall,
} from '../generated/Lib_AddressManager/Lib_AddressManager'
import { AddressSetEntity } from '../generated/schema'

export function handleAddressSet(event: AddressSet): void {
  const id = event.transaction.hash.toHex()
  let entity = AddressSetEntity.load(id)
  if (entity == null) {
    entity = new AddressSetEntity(id)
  }
  entity.id = id
  entity._name = event.params._name
  entity._newAddress = event.params._newAddress
  entity._oldAddress = event.params._oldAddress
  entity.blockNumber = event.block.number
  entity.transactionHash = event.transaction.hash

  entity.save()
}
