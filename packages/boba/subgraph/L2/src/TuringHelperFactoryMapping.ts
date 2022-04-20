import { TuringHelperDeployed } from '../generated/TuringHelperFactory/TuringHelperFactory'
import { TuringHelperDeployedEvent } from '../generated/schema'

export function handleTuringHelperDeployed(
  event: TuringHelperDeployed
): void {
  let transactionHash: string = event.transaction.hash.toHex()
  let transfer = new TuringHelperDeployedEvent(transactionHash)
  transfer.owner = event.params.owner
  transfer.proxy = event.params.proxy
  transfer.depositedBoba = event.params.depositedBoba.toString()
  transfer.save()
}
