import {
  clearBridgeAlert,
  purgeBridgeAlert,
  setBridgeAlert,
} from 'actions/bridgeAction'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectActiveNetwork,
  selectActiveNetworkType,
  selectAmountToBridge,
  selectBobaFeeChoice,
  selectBobaPriceRatio,
  selectBridgeType,
  selectExitFee,
  selectFastDepositCost,
  selectFastExitCost,
  selectIsTeleportationOfAssetSupported,
  selectL1FeeBalance,
  selectL1LPBalanceString,
  selectL1LPLiquidity,
  selectL1LPPendingString,
  selectL2BalanceBOBA,
  selectL2BalanceETH,
  selectL2LPBalanceString,
  selectL2LPLiquidity,
  selectL2LPPendingString,
  selectLayer,
  selectTokenToBridge,
} from 'selectors'
import { logAmount } from 'util/amountConvert'
import { LAYER } from 'util/constant'
import BN from 'bignumber.js'
import { BRIDGE_TYPE } from 'containers/Bridging/BridgeTypeSelector'
import {
  depositWithTeleporter,
  isTeleportationOfAssetSupported,
} from '../actions/networkAction'
import { NetworkList } from '../util/network/network.util'
import networkService from '../services/networkService'
import { BigNumberish, utils } from 'ethers'

enum ALERT_KEYS {
  OMG_INFO = 'OMG_INFO',
  VALUE_TOO_SMALL = 'VALUE_TOO_SMALL',
  VALUE_TOO_LARGE = 'VALUE_TOO_LARGE',
  FAST_EXIT_ERROR = 'FAST_EXIT_ERROR',
  FAST_DEPOSIT_ERROR = 'FAST_DEPOSIT_ERROR',
}

interface ITeleportationTokenSupport {
  supported: boolean
  minDepositAmount: BigNumberish
  maxDepositAmount: BigNumberish
  maxTransferAmountPerDay: BigNumberish
  transferTimestampCheckPoint: BigNumberish
  transferredAmount: BigNumberish
}

const useBridgeAlerts = () => {
  const dispatch = useDispatch<any>()
  const layer = useSelector(selectLayer())
  const bridgeType = useSelector(selectBridgeType())
  const token = useSelector(selectTokenToBridge())
  const amountToBridge = useSelector(selectAmountToBridge())
  const tokenForTeleportationSupported: ITeleportationTokenSupport =
    useSelector(selectIsTeleportationOfAssetSupported())

  // imports needed for layer= 2;
  const feeBalanceETH = useSelector(selectL2BalanceETH)
  const feeBalanceBOBA = useSelector(selectL2BalanceBOBA)
  const feeUseBoba = useSelector(selectBobaFeeChoice())
  const feePriceRatio = useSelector(selectBobaPriceRatio())
  const exitFee = useSelector(selectExitFee)
  const fastExitCost = useSelector(selectFastExitCost)
  const LPBalance = useSelector(selectL1LPBalanceString)
  const LPPending = useSelector(selectL1LPPendingString)
  const LPLiquidity = useSelector(selectL1LPLiquidity)

  // show infor to user about to OMG token when
  // connected to layer 1 ETH as token is specific to ethereum only.
  useEffect(() => {
    if (layer === LAYER.L1) {
      if (token && token.symbol === 'OMG') {
        dispatch(
          setBridgeAlert({
            meta: ALERT_KEYS.OMG_INFO,
            type: 'info',
            text: `The OMG Token was minted in 2017 and it does not conform to the ERC20 token standard.
        In some cases, three interactions with MetaMask are needed. If you are bridging out of a
        new wallet, it starts out with a 0 approval, and therefore, only two interactions with
        MetaMask will be needed.`,
          })
        )
      } else {
        dispatch(
          clearBridgeAlert({
            keys: [ALERT_KEYS.OMG_INFO],
          })
        )
      }
    }
  }, [dispatch, layer, token, bridgeType])

  useEffect(() => {
    if (!token) {
      return
    }
    const maxValue = logAmount(token.balance, token.decimals)
    const underZero = new BN(amountToBridge).lt(new BN(0.0))
    const overMax = new BN(amountToBridge).gt(new BN(maxValue))

    dispatch(
      clearBridgeAlert({
        keys: [ALERT_KEYS.VALUE_TOO_LARGE, ALERT_KEYS.VALUE_TOO_SMALL],
      })
    )

    if (amountToBridge !== '' && (underZero || amountToBridge <= 0)) {
      dispatch(
        setBridgeAlert({
          meta: ALERT_KEYS.VALUE_TOO_SMALL,
          type: 'error',
          text: `Value too small: the value must be greater than 0`,
        })
      )
    } else if (overMax) {
      dispatch(
        setBridgeAlert({
          meta: ALERT_KEYS.VALUE_TOO_LARGE,
          type: 'error',
          text: `Value too large: the value must be smaller than ${Number(
            maxValue
          ).toFixed(5)}`,
        })
      )
    }
  }, [dispatch, token, amountToBridge])

  /**
   * Checks to run specific to L2 chains.
   * 1. check exitFee > balanceBoba.
   * 2. check feeETH > feeETHbalance
   * a. symbol=ETH then (value + feeETH) > feeETHBalance.
   * b. symbol=NA then (feeETH) > feeETHBalance.
   * 3. feeUseBoba :
   * a. symbol=boba then (value + feeBoba + exitFee) > feeBobaBalance
   * b. symbol=NA (feeBoba + exitFee) > feeBobaBalance
   * 4. LPRatio < 0.1 // we always wants user to have some balance for unstaking.
   * a. && value > BSP * 0.9
   * b. && value <= BSP * 0.9
   * 5. value > balanceSubPending * 0.9 : error.
   *
   */

  useEffect(() => {
    if (!token) {
      return
    }
    dispatch(
      clearBridgeAlert({
        keys: [ALERT_KEYS.FAST_EXIT_ERROR],
      })
    )
    if (layer === LAYER.L2 && bridgeType !== BRIDGE_TYPE.FAST) {
      let warning = ''
      const balance = Number(logAmount(token.balance, token.decimals))
      const ethCost = Number(fastExitCost) * 1.04 // 1.04 == safety margin on the cost.
      const bobaCost = ethCost * feePriceRatio

      if (exitFee > feeBalanceBOBA) {
        warning = `Insufficient BOBA balance to cover xChain message relay. You need at least ${exitFee} BOBA`
      } else if (ethCost > feeBalanceETH) {
        if (feeUseBoba) {
          warning = `ETH balance too low. Even if you pay in BOBA, you still need to maintain a minimum ETH balance in your wallet`
        } else {
          warning = `ETH balance too low to cover gas`
        }
      } else if (feeUseBoba) {
        if (
          token.symbol === 'BOBA' &&
          Number(amountToBridge) + bobaCost + exitFee > balance
        ) {
          warning = `Insufficient BOBA balance to conver Boba Amount, Exit Fee and Relay fee.`
        } else if (bobaCost + exitFee > feeBalanceBOBA) {
          warning = `Insufficient BOBA balance to conver Exit Fee and Relay fee.`
        }
      } else if (
        token.symbol === 'ETH' &&
        Number(amountToBridge) + ethCost > balance
      ) {
        if (feeUseBoba) {
          warning = `Insufficient ETH Balance to cover ETH amount and fees. Even if you pay in BOBA, you still need to maintain a minimum ETH balance in your wallet`
        }
        warning = `Insufficient ETH balance to cover ETH Amount and Exit fee.`
      }

      if (bridgeType === BRIDGE_TYPE.FAST && balance > 0) {
        // as in case of fast withdrwal we are using liquidity pools so below checks are required.
        let LpRatio = 0
        const lbl = Number(logAmount(LPLiquidity, token.decimals))
        if (lbl > 0) {
          const lpb = Number(logAmount(LPBalance, token.decimals))
          const LPR = lpb / lbl
          LpRatio = Number(LPR)
        }

        const lpUnits: any = logAmount(LPBalance, token.decimals)
        const pendingUnits: any = logAmount(LPPending, token.decimals)
        const pendingExitsBalance = Number(lpUnits) - Number(pendingUnits) // inflight exits (pending exits)

        if (LpRatio < 0.1) {
          if (Number(amountToBridge) > Number(pendingExitsBalance) * 0.9) {
            //not enough absolute balance
            //we don't want one large bridge to wipe out all the balance
            //NOTE - this logic still allows bridgers to drain the entire pool, but just more slowly than before
            //this is because the every time someone exits, the limit is recalculated
            //via Number(LPBalance) * 0.9, and LPBalance changes over time
            warning = `Insufficient balance in pool and balance / liquidity ratio too low, please reduce amount or use classical exit`
          } else if (
            Number(amountToBridge) <=
            Number(pendingExitsBalance) * 0.9
          ) {
            warning = `The pool's balance/liquidity ratio (of ${Number(
              LpRatio
            ).toFixed(2)}) is too low.
            Please use the classic bridge.`
          } else {
            warning = `Insufficient balance in pool - reduce amount or use classical exit`
          }
        }

        if (
          LpRatio >= 0.1 &&
          Number(amountToBridge) > Number(pendingExitsBalance) * 0.9
        ) {
          warning = `The pool's balance of ${Number(
            pendingExitsBalance
          ).toFixed(2)} (including inflight bridges) is too low.
            Please use the classic bridge or reduce the amount.`
        }
      }

      if (warning) {
        dispatch(
          setBridgeAlert({
            meta: ALERT_KEYS.FAST_EXIT_ERROR,
            type: 'error',
            text: warning,
          })
        )
      }
    }
  }, [
    dispatch,
    layer,
    bridgeType,
    amountToBridge,
    token,
    feeBalanceBOBA,
    feeBalanceETH,
    feePriceRatio,
    feeUseBoba,
    exitFee,
    fastExitCost,
    LPLiquidity,
    LPBalance,
    LPPending,
  ])

  // alerts for fast deposit (teleportation).

  useEffect(() => {
    if (!token) {
      return
    }

    dispatch(
      clearBridgeAlert({
        keys: [ALERT_KEYS.FAST_DEPOSIT_ERROR],
      })
    )

    // Teleportation
    if (bridgeType === BRIDGE_TYPE.FAST) {
      let warning = ''
      const type = 'error'
      const balance = Number(logAmount(token.balance, token.decimals))

      /*if (fastDepositCost > L1feeBalance) {
        warning = `Insufficient native balance to cover Gas fee`
      }*/
      console.log(
        'ERROR FAST',
        tokenForTeleportationSupported,
        tokenForTeleportationSupported?.supported
      )
      if (amountToBridge > balance) {
        warning = `Not enough balance to bridge`
      } else if (!tokenForTeleportationSupported?.supported) {
        warning = `Token for selected destination chain not supported`
      } else if (
        tokenForTeleportationSupported?.minDepositAmount > amountToBridge
      ) {
        warning = `You need to bridge at least ${utils.formatEther(
          tokenForTeleportationSupported.minDepositAmount
        )}`
      } else if (
        tokenForTeleportationSupported?.maxDepositAmount < amountToBridge
      ) {
        warning = `You can bridge at maximum ${utils.formatEther(
          tokenForTeleportationSupported.maxDepositAmount
        )}`
      }

      if (warning) {
        dispatch(
          setBridgeAlert({
            meta: ALERT_KEYS.FAST_EXIT_ERROR,
            text: warning,
            type,
          })
        )
      }
    }
  }, [dispatch, layer, bridgeType, amountToBridge, token])

  // on changing bridgeType only cleanup alerts
  useEffect(() => {
    dispatch(purgeBridgeAlert())
  }, [dispatch, bridgeType])
}

export default useBridgeAlerts
