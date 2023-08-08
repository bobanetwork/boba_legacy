type TransactionType = {
  stakeId: number
  depositTimestamp: number
  depositAmount: number
  isActive: boolean
}

export interface TransactionListInterface {
  stakeInfo: TransactionType
}
