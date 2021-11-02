import {
  WithdrawalInitiated,
  DepositFailed,
  DepositFinalized
} from '../generated/OVM_L2StandardBridge/OVM_L2StandardBridge'
import {
  StandardBridgeWithdrawalInitiated,
  StandardBridgeDepositFailed,
  StandardBridgeDepositFinalized
} from '../generated/schema'

export function handleStandardBridgeWithdrawalInitiated(event: WithdrawalInitiated): void {
  let id = event.transaction.hash.toHex()
  let withdrawalInitiated = new StandardBridgeWithdrawalInitiated(id)
  withdrawalInitiated.id = id
  withdrawalInitiated.l1Token = event.params._l1Token
  withdrawalInitiated.l2Token = event.params._l2Token
  withdrawalInitiated.from = event.params._from
  withdrawalInitiated.l1Token = event.params._l1Token
  withdrawalInitiated.to = event.params._to
  withdrawalInitiated.amount = event.params._amount.toString()
  withdrawalInitiated.data = event.params._data
  withdrawalInitiated.save()
}

export function handleStandardBridgeDepositFailed(event: DepositFailed): void {
  let id = event.transaction.hash.toHex()
  let depositFailed = new StandardBridgeDepositFailed(id)
  depositFailed.id = id
  depositFailed.l1Token = event.params._l1Token
  depositFailed.l2Token = event.params._l2Token
  depositFailed.from = event.params._from
  depositFailed.l1Token = event.params._l1Token
  depositFailed.to = event.params._to
  depositFailed.amount = event.params._amount.toString()
  depositFailed.data = event.params._data
  depositFailed.save()
}

export function handleStandardBridgeDepositFinalized(event: DepositFinalized): void {
  let id = event.transaction.hash.toHex()
  let depositFinalized = new StandardBridgeDepositFinalized(id)
  depositFinalized.id = id
  depositFinalized.l1Token = event.params._l1Token
  depositFinalized.l2Token = event.params._l2Token
  depositFinalized.from = event.params._from
  depositFinalized.l1Token = event.params._l1Token
  depositFinalized.to = event.params._to
  depositFinalized.amount = event.params._amount.toString()
  depositFinalized.data = event.params._data
  depositFinalized.save()
}
