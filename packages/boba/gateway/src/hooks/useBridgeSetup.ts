import {
  fetchL2LPBalance,
  fetchL2LPLiquidity,
  fetchL2LPPending,
  fetchL2TotalFeeRate,
  fetchL2FeeRateN,
  fetchFastDepositCost,
  fetchL1FeeBalance,
} from 'actions/balanceAction'
import { clearLookupPrice, fetchLookUpPrice } from 'actions/networkAction'
import { BRIDGE_TYPE } from 'containers/Bridging/BridgeTypeSelector'
import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectAccountEnabled,
  selectBridgeType,
  selectLayer,
  selectTokenToBridge,
  selectTokens,
} from 'selectors'
import networkService from 'services/networkService'
import { LAYER } from 'util/constant'

const useBridgeSetup = () => {
  const dispatch = useDispatch<any>()
  const isAccountEnabled = useSelector(selectAccountEnabled())
  const tokenList = useSelector(selectTokens)
  const layer = useSelector(selectLayer())
  const bridgeType = useSelector(selectBridgeType())
  const token = useSelector(selectTokenToBridge())

  /**
   * when we are on l1, but the funds will be paid out to L2.
   * Goal now is to find out the as much we can about the state of L2 pools
   *
   * fetching: required info for fast briding
   * 1. L2LP Balance
   * 2. L2Lp Liquidity
   * 3. L2Lp pending
   * 4. L2 TotalFeeRate
   * 5. L2 TotalFeeRateN // use to calculate the receivable amount.
   * 6. fetch fast deposit cost // cost of fast deposit.
   * 7. fetch L1 fee balance // eth balance which user has to pay gas fee.
   */

  useEffect(() => {
    if (layer === LAYER.L1) {
      console.log(`🏃 `)
      if (token && bridgeType === BRIDGE_TYPE.FAST) {
        console.log(`🏃 🏃 `)
        dispatch(fetchL2LPBalance(token.addressL2))
        dispatch(fetchL2LPLiquidity(token.addressL2))
        dispatch(fetchL2LPPending(token.addressL1)) //lookup is, confusingly, via L1 token address
        dispatch(fetchL2TotalFeeRate())
        dispatch(fetchL2FeeRateN(token.addressL2))
        dispatch(fetchFastDepositCost(token.address))
        dispatch(fetchL1FeeBalance()) //ETH balance for paying gas
        return () => {
          dispatch({ type: 'BALANCE/L2/RESET' })
        }
      }
    }
  }, [layer, token, bridgeType, dispatch])

  const getLookupPrice = useCallback(() => {
    if (!isAccountEnabled) {
      return
    }
    // TODO: refactor and make sure to triggered this once all the tokens are
    // // only run once all the tokens have been added to the tokenList
    if (Object.keys(tokenList).length < networkService.supportedTokens.length) {
      return
    }
    const symbolList = Object.values(tokenList).map((i: any) => {
      if (i.symbolL1 === 'ETH') {
        return 'ethereum'
      } else if (i.symbolL1 === 'OMG') {
        return 'omg'
      } else if (i.symbolL1 === 'BOBA') {
        return 'boba-network'
      } else if (i.symbolL1 === 'OLO') {
        return 'oolongswap'
      } else {
        return i.symbolL1.toLowerCase()
      }
    })

    dispatch(fetchLookUpPrice(symbolList))
  }, [tokenList, dispatch, isAccountEnabled])

  useEffect(() => {
    if (isAccountEnabled) {
      getLookupPrice()
    }

    return () => {
      dispatch(clearLookupPrice())
    }
  }, [getLookupPrice, isAccountEnabled])
}

export default useBridgeSetup
