import networkService from "services/networkService";
import { createAction } from "./createAction";


/************************
 **** VE Boba Actions ***
 ************************/

/**
 * @VeBobaAction actions can have.
 *  - number of locks
 *  - createLock
 *  - increaseLockAmount
 *  - extendLockTime
 *  - withdrawLock
 *  - fetchLockRecords
 *  - fetchVotingPower
 *  - fetchVeBobaRatio
 *
 *  TODO: write function for fetching the data for the locking period vs convert ration.
 */

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
  return createAction('LOCK/RECORDS/GET', () => networkService.fetchLockRecords())
}
