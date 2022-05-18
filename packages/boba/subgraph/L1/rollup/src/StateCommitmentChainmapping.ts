import { StateBatchAppended } from '../generated/StateCommitmentChain/StateCommitmentChain'
import { StateBatchAppendedEntity } from '../generated/schema'

export function handleStateCommitmentChain(event: StateBatchAppended): void {

  const id = event.transaction.hash.toHex()
  const entity = new StateBatchAppendedEntity(id)
  entity.id = id
  entity._batchIndex = event.params._batchIndex
  entity._batchRoot = event.params._batchRoot
  entity._batchSize = event.params._batchSize
  entity._prevTotalElements = event.params._prevTotalElements
  entity._extraData = event.params._extraData
  entity.blockNumber = event.block.number
  entity.transactionHash = event.transaction.hash

  entity.save()
}
