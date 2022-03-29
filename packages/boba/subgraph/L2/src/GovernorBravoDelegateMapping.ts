import {
  NewAdmin, NewImplementation, NewPendingAdmin, ProposalCanceled, ProposalCreated,
  ProposalExecuted, ProposalQueued, ProposalThresholdSet, VoteCast, VotingDelaySet, VotingPeriodSet,
} from '../generated/GovernorBravoDelegate/GovernorBravoDelegate'
import {
  GovernorNewAdmin,
  GovernorNewImplementation,
  GovernorNewPendingAdmin,
  GovernorProposalCanceled,
  GovernorProposalCreated,
  GovernorProposalExecuted,
  GovernorProposalQueued,
  GovernorProposalThresholdSet,
  GovernorVoteCast, GovernorVotingDelaySet, GovernorVotingPeriodSet
} from "../generated/schema";
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";

export function handleGovernorNewAdmin(event: NewAdmin): void {
  let id = event.transaction.hash.toHex()
  let eventObj = new GovernorNewAdmin(id)
  eventObj.id = id
  eventObj.oldAdmin = event.params.oldAdmin
  eventObj.newAdmin = event.params.newAdmin
  eventObj.save()
}

export function handleGovernorNewImplementation(event: NewImplementation): void {
  let id = event.transaction.hash.toHex()
  let eventObj = new GovernorNewImplementation(id)
  eventObj.id = id
  eventObj.oldImplementation = event.params.oldImplementation
  eventObj.newImplementation = event.params.newImplementation
  eventObj.save()
}

export function handleGovernorNewPendingAdmin(event: NewPendingAdmin): void {
  let id = event.transaction.hash.toHex()
  let eventObj = new GovernorNewPendingAdmin(id)
  eventObj.id = id
  eventObj.oldPendingAdmin = event.params.oldPendingAdmin
  eventObj.newPendingAdmin = event.params.newPendingAdmin
  eventObj.save()
}

export function handleGovernorProposalCanceled(event: ProposalCanceled): void {
  let id = event.transaction.hash.toHex()
  let eventObj = new GovernorProposalCanceled(id)
  eventObj.id = id
  eventObj.proposalId = event.params.id.toString()
  eventObj.save()
}

export function handleGovernorProposalCreated(event: ProposalCreated): void {
  let id = event.transaction.hash.toHex()
  let eventObj = new GovernorProposalCreated(id)
  eventObj.id = id
  eventObj.proposalId = event.params.id.toString()
  eventObj.proposer = event.params.proposer
  eventObj.targets = event.params.targets.map<Bytes>((v) => v as Bytes)
  eventObj.values = event.params.values.map<string>((v) => v.toString())
  eventObj.signatures = event.params.signatures
  eventObj.calldatas = event.params.calldatas
  eventObj.startTimestamp = event.params.startTimestamp.toString()
  eventObj.endTimestamp = event.params.endTimestamp.toString()
  eventObj.description = event.params.description
  eventObj.save()
}

export function handleGovernorProposalExecuted(event: ProposalExecuted): void {
  let id = event.transaction.hash.toHex()
  let eventObj = new GovernorProposalExecuted(id)
  eventObj.id = id
  eventObj.proposalId = event.params.id.toString()
  eventObj.save()
}

export function handleGovernorProposalQueued(event: ProposalQueued): void {
  let id = event.transaction.hash.toHex()
  let eventObj = new GovernorProposalQueued(id)
  eventObj.id = id
  eventObj.proposalId = event.params.id.toString()
  eventObj.eta = event.params.eta.toString()
  eventObj.save()
}

export function handleGovernorProposalThresholdSet(event: ProposalThresholdSet): void {
  let id = event.transaction.hash.toHex()
  let eventObj = new GovernorProposalThresholdSet(id)
  eventObj.id = id
  eventObj.oldProposalThreshold = event.params.oldProposalThreshold.toString()
  eventObj.newProposalThreshold = event.params.newProposalThreshold.toString()
  eventObj.save()
}

export function handleGovernorVoteCast(event: VoteCast): void {
  let id = event.transaction.hash.toHex()
  let eventObj = new GovernorVoteCast(id)
  eventObj.id = id
  eventObj.voter = event.params.voter
  eventObj.proposalId = event.params.proposalId.toString()
  eventObj.support = (event.params.support as number).toString()
  eventObj.votes = event.params.votes.toString()
  eventObj.reason = event.params.reason
  eventObj.save()
}

export function handleGovernorVotingDelaySet(event: VotingDelaySet): void {
  let id = event.transaction.hash.toHex()
  let eventObj = new GovernorVotingDelaySet(id)
  eventObj.id = id
  eventObj.oldVotingDelay = event.params.oldVotingDelay.toString()
  eventObj.newVotingDelay = event.params.newVotingDelay.toString()
  eventObj.save()
}

export function handleGovernorVotingPeriodSet(event: VotingPeriodSet): void {
  let id = event.transaction.hash.toHex()
  let eventObj = new GovernorVotingPeriodSet(id)
  eventObj.id = id
  eventObj.oldVotingPeriod = event.params.oldVotingPeriod.toString()
  eventObj.newVotingPeriod = event.params.newVotingPeriod.toString()
  eventObj.save()
}
