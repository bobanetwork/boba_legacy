import { TuringHelperDeployed } from '../generated/TuringHelperFactory/TuringHelperFactory'
import { TuringHelperDeployedEvent } from '../generated/schema'

export function handleTuringHelperDeployed(
  event: TuringHelperDeployed
): void {
  let id: string = event.transaction.hash.toHex()
  let helperDeployed = new TuringHelperDeployedEvent(id)
  helperDeployed.id = id
  helperDeployed.owner = event.params.owner
  helperDeployed.proxy = event.params.proxy
  helperDeployed.depositedBoba = event.params.depositedBoba.toString()
  helperDeployed.save()
}
