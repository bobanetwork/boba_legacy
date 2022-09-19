import networkService from "services/networkService";
import { createAction } from "./createAction";


/************************
 **** VE Boba Actions ***
 ************************/

export function createLock(payload) {
  return createAction('LOCK/CREATE', () => networkService.createLock(payload))
}

export function withdrawLock(payload) {
  return createAction('LOCK/WITHDRAW', () => networkService.withdrawLock(payload))
}

export function increaseLockAmount(payload) {
  return createAction('LOCK/INCREASE_AMOUNT', () => networkService.increaseLockAmount(payload))
}

export function extendLockTime(payload) {
  return createAction('LOCK/EXTEND_TIME', () => networkService.extendLockTime(payload))
}

export function fetchLockRecords() {
  return createAction('LOCK/RECORDS', () => networkService.fetchLockRecords())
}

export function fetchPools() {
  return createAction('VOTE/POOLS', () => networkService.fetchPools())
}

export function onSavePoolVote(payload) {
  return createAction('SAVE_POOL/VOTE', () => networkService.savePoolVote(payload))
}

export function onDistributePool(payload) {
  return createAction('DISTRIBUTE/POOL', () => networkService.distributePool(payload))
}
