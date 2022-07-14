import {
  AddressSet,
  SetAddressCall,
} from '../generated/Lib_AddressManager/Lib_AddressManager'
import { AddressSetEntity } from '../generated/schema'

/*****************************************
 * indexed string can't be parsed correctly
 * we use call function to find the name
 *****************************************/

export function handleSetAddress(call: SetAddressCall): void {
  const id = call.transaction.hash.toHex()
  let entity = AddressSetEntity.load(id)
  if (entity == null) {
    entity = new AddressSetEntity(id)
  }
  entity.id = id
  entity._name = call.inputs._name
  entity._newAddress = call.inputs._address
  entity.blockNumber = call.block.number
  entity.transactionHash = call.transaction.hash

  entity.save()
}

export function handleAddressSet(event: AddressSet): void {
  const id = event.transaction.hash.toHex()
  let entity = AddressSetEntity.load(id)
  if (entity == null) {
    entity = new AddressSetEntity(id)
  }
  entity.id = id
  entity._newAddress = event.params._newAddress
  entity._oldAddress = event.params._oldAddress
  entity.blockNumber = event.block.number
  entity.transactionHash = event.transaction.hash

  entity.save()
}
