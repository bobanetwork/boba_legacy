import { switchFee } from 'actions/setupAction'
import { openAlert, openError } from 'actions/uiAction'
import BN from 'bignumber.js'
import { isEqual } from 'util/lodash'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectBobaFeeChoice, selectlayer2Balance } from 'selectors'
import networkService from 'services/networkService'
import { logAmount } from 'util/amountConvert'

/**
 * useFeeSwitcher.
 *
 * Hook to switch the fee when in case of L2
 */

const useFeeSwitcher = () => {
  const dispatch = useDispatch<any>()
  const feeUseBoba = useSelector(selectBobaFeeChoice())
  const l2Balances = useSelector(selectlayer2Balance, isEqual)
  const l2BalanceNativeToken = l2Balances.filter(
    (i: any) => i.symbol === networkService.L1NativeTokenSymbol
  )
  const balanceETH = l2BalanceNativeToken[0]
  const l2BalanceBOBA = l2Balances.filter((i: any) => i.symbol === 'BOBA')
  const balanceBOBA = l2BalanceBOBA[0]

  const switchFeeUse = useCallback(
    async (targetFee) => {
      let tooSmallL1NativeToken = false
      // mini balance required for token to use as bridge fee
      const minL1NativeBalance =
        await networkService.estimateMinL1NativeTokenForFee() //0.002
      let tooSmallBOBA = false

      if (typeof balanceBOBA === 'undefined') {
        tooSmallBOBA = true
      } else {
        //check actual balance
        tooSmallBOBA = new BN(logAmount(balanceBOBA.balance, 18)).lt(new BN(1))
      }

      if (typeof balanceETH === 'undefined') {
        tooSmallL1NativeToken = true
      } else {
        //check actual balance
        tooSmallL1NativeToken = new BN(logAmount(balanceETH.balance, 18)).lt(
          new BN(minL1NativeBalance)
        )
      }

      if (!balanceBOBA && !balanceETH) {
        dispatch(
          openError('Wallet empty - please bridge in ETH or BOBA from L1')
        )
        return
      }

      let res

      if (feeUseBoba && targetFee === 'BOBA') {
        // do nothing - already set to BOBA
      } else if (
        !feeUseBoba &&
        targetFee === networkService.L1NativeTokenSymbol
      ) {
        // do nothing - already set to ETH
      } else if (!feeUseBoba && targetFee === 'BOBA') {
        // change to BOBA
        if (tooSmallBOBA) {
          dispatch(
            openError(`You cannot change the fee token to BOBA since your BOBA balance is below 1 BOBA.
          If you change fee token now, you might get stuck. Please swap some ETH for BOBA first.`)
          )
        } else {
          res = await dispatch(switchFee(targetFee))
        }
      } else if (
        feeUseBoba &&
        targetFee === networkService.L1NativeTokenSymbol
      ) {
        // change to L1Native Token
        if (tooSmallL1NativeToken) {
          dispatch(
            openError(`You cannot change the fee token to ${networkService.L1NativeTokenSymbol} since your ${networkService.L1NativeTokenSymbol} balance is below ${minL1NativeBalance}.
          If you change fee token now, you might get stuck. Please obtain some ${networkService.L1NativeTokenSymbol} first.`)
          )
        } else {
          res = await dispatch(switchFee(targetFee))
        }
      }

      if (res) {
        dispatch(openAlert(`Successfully changed fee to ${targetFee}`))
      }
    },
    [dispatch, feeUseBoba, balanceETH, balanceBOBA]
  )

  return { switchFeeUse }
}

export default useFeeSwitcher
