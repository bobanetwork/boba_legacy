import {
  clearBridgeAlert,
  purgeBridgeAlert,
  setBridgeAlert,
} from 'actions/bridgeAction'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
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
import { BigNumberish, ethers } from 'ethers'

enum ALERT_KEYS {
  OMG_INFO = 'OMG_INFO',
  VALUE_TOO_SMALL = 'VALUE_TOO_SMALL',
  VALUE_TOO_LARGE = 'VALUE_TOO_LARGE',
  FAST_EXIT_ERROR = 'FAST_EXIT_ERROR',
  FAST_DEPOSIT_ERROR = 'FAST_DEPOSIT_ERROR',
  TELEPORTATION_ASSET_NOT_SUPPORTED = 'TELEPORTER_ASSET_NOT_SUPPORTED',
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

  // fast input layer 1
  const L1LPBalance = useSelector(selectL2LPBalanceString)
  const L1LPPending = useSelector(selectL2LPPendingString)
  const L1LPLiquidity = useSelector(selectL2LPLiquidity)
  const L1feeBalance = useSelector(selectL1FeeBalance)
  const fastDepositCost = useSelector(selectFastDepositCost)

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

  useEffect(() => {
    if (bridgeType === BRIDGE_TYPE.TELEPORTATION) {
      if (!tokenForTeleportationSupported.supported) {
        dispatch(
          clearBridgeAlert({
            keys: [ALERT_KEYS.VALUE_TOO_LARGE, ALERT_KEYS.VALUE_TOO_SMALL],
          })
        )
        dispatch(
          setBridgeAlert({
            meta: ALERT_KEYS.TELEPORTATION_ASSET_NOT_SUPPORTED,
            type: 'error',
            text: `Asset not supported, please choose different asset or one of our other bridge modes.`,
          })
        )
      } else {
        dispatch(
          clearBridgeAlert({
            keys: [ALERT_KEYS.TELEPORTATION_ASSET_NOT_SUPPORTED],
          })
        )
        if (amountToBridge < tokenForTeleportationSupported.minDepositAmount) {
          dispatch(
            setBridgeAlert({
              meta: ALERT_KEYS.VALUE_TOO_SMALL,
              type: 'error',
              text: `For this asset you need to bridge at least ${ethers.utils.formatEther(
                tokenForTeleportationSupported.minDepositAmount
              )}.`,
            })
          )
        } else if (
          amountToBridge > tokenForTeleportationSupported.maxDepositAmount
        ) {
          dispatch(
            setBridgeAlert({
              meta: ALERT_KEYS.VALUE_TOO_LARGE,
              type: 'error',
              text: `For this asset you are allowed to bridge at maximum ${ethers.utils.formatEther(
                tokenForTeleportationSupported.maxDepositAmount
              )} per transaction.`,
            })
          )
        }
      }
    }
  }, [tokenForTeleportationSupported, bridgeType])

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

    if ((underZero || amountToBridge <= 0) && amountToBridge) {
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
    if (layer === LAYER.L2) {
      // trigger only when withdrawing funds.
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
            warning = `There is not enough liquidity in the fast bridge pool - please reduce amount or use classical bridge`
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

  // alerts for fast deposit L1.

  useEffect(() => {
    if (!token) {
      return
    }

    dispatch(
      clearBridgeAlert({
        keys: [ALERT_KEYS.FAST_DEPOSIT_ERROR],
      })
    )

    if (layer === LAYER.L1 && bridgeType === BRIDGE_TYPE.FAST) {
      let warning = ''
      let type = 'error'
      const balance = Number(logAmount(token.balance, token.decimals))

      if (fastDepositCost > L1feeBalance) {
        warning = `Insufficient L1 ETH balance to cover Gas fee`
      }
      if (token.symbol === 'ETH') {
        if (Number(amountToBridge) + fastDepositCost > L1feeBalance) {
          warning = `Insufficient L1 ETH balance to cover Amount and Gas fee`
        }
        if (Number(amountToBridge) + fastDepositCost > L1feeBalance * 0.96) {
          warning = `Your L1 ETH balance ${L1feeBalance.toFixed(4)}
          is very close to the estimated total (gas fee + amount).
          Transaction might fail`
          type = 'warning'
        }
      } else {
        if (fastDepositCost > L1feeBalance) {
          warning = `Insufficient L1 ETH balance to cover Gas fee`
        }
        if (fastDepositCost > L1feeBalance * 0.96) {
          warning = `Your L1 ETH balance ${L1feeBalance.toFixed(4)}
          is very close to the gas fee + amount.
          Transaction might fail, it would be safe to have slightly more ETH in your L1 wallet to cover gas fee`
          type = 'warning'
        }
      }

      if (balance > 0) {
        let LpRatio = 0

        const lbl = Number(logAmount(L1LPLiquidity, token.decimals))
        if (lbl > 0) {
          const lbp = Number(logAmount(L1LPBalance, token.decimals))
          const LPR = lbp / lbl
          LpRatio = Number(LPR)
        }
        const L1lpUnits = logAmount(L1LPBalance, token.decimals)
        const pendingUnits = logAmount(L1LPPending, token.decimals)
        const pendingDepositBalance = Number(L1lpUnits) - Number(pendingUnits) ////subtract the in flight exits

        if (LpRatio < 0.1) {
          //not enough balance/liquidity ratio
          //we always want some balance for unstaking

          if (Number(amountToBridge) > pendingDepositBalance * 0.9) {
            //not enough absolute balance
            //we don't want one large bridge to wipe out the entire balance
            //NOTE - this logic still allows bridgers to drain the entire pool, but just more slowly than before
            //this is because the every time someone exits, the limit is recalculated
            //via Number(LPBalance) * 0.9, and LPBalance changes over time

            warning = `The ${token.symbol} pool's balance and balance/liquidity ratio is
            low. Please use the classic bridge.`
          } else if (Number(amountToBridge) <= pendingDepositBalance * 0.9) {
            warning = `The ${token.symbol} pool's balance/liquidity ratio (of
             ${Number(LpRatio).toFixed(2)}) is too low. Please use the classic
            bridge.`
          } else {
            warning = `There is not enough liquidity in the fast bridge pool - reduce your amount or use the Classic Bridge`
          }
        }

        if (
          LpRatio >= 0.1 &&
          Number(amountToBridge) > Number(pendingDepositBalance) * 0.9
        ) {
          warning = `The ${token.symbol} pool's balance of
          ${Number(pendingDepositBalance).toFixed(2)}
          (including inflight bridges) is too low.
          Please use the classic bridge or reduce the amount.`
        }
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
  }, [
    dispatch,
    layer,
    bridgeType,
    amountToBridge,
    token,
    L1LPBalance,
    L1LPPending,
    L1LPLiquidity,
    L1feeBalance,
    fastDepositCost,
  ])

  // on changing bridgeType only cleanup alerts
  useEffect(() => {
    dispatch(purgeBridgeAlert())
  }, [dispatch, bridgeType])
}

export default useBridgeAlerts
