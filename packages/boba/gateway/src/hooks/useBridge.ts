import {
  approveERC20,
  depositETHL2,
  depositErc20,
  depositL1LP,
  depositL2LP,
  exitBOBA,
} from 'actions/networkAction'
import { closeModal, openError, openModal } from 'actions/uiAction'
import { BRIDGE_TYPE } from 'containers/Bridging/BridgeTypeSelector'
import { ethers } from 'ethers'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectAmountToBridge,
  selectBridgeToAddressState,
  selectBridgeType,
  selectLayer,
  selectTokenToBridge,
} from 'selectors'
import networkService from 'services/networkService'
import { toWei_String } from 'util/amountConvert'
import { LAYER } from 'util/constant'
import useBridgeCleanup from './useBridgeCleanup'
import {
  resetToken,
  purgeBridgeAlert,
  resetBridgeAmount,
} from 'actions/bridgeAction'

export const useBridge = () => {
  const dispatch = useDispatch<any>()
  const bridgeType = useSelector(selectBridgeType())
  const layer = useSelector(selectLayer())
  const toL2Account = useSelector(selectBridgeToAddressState())
  const token = useSelector(selectTokenToBridge())
  const amountToBridge = useSelector(selectAmountToBridge())

  /*
  let toL2Account = enableToL2Account ? recipient : '';
    // TO check for ETH
    if (token.address === ethers.constants.AddressZero) {
      receipt = await dispatch(
        depositETHL2({
          recipient: toL2Account,
          value_Wei_String
        })
      )
    } else {
      receipt = await dispatch(
        depositErc20({
          recipient: toL2Account,
          value_Wei_String,
          currency: token.address,
          currencyL2: token.addressL2,
        })
      )
    }
  */

  const triggerDeposit = async (amountWei: any) => {
    let receipt
    if (token.address === ethers.constants.AddressZero) {
      receipt = await dispatch(
        depositETHL2({
          recipient: toL2Account || '',
          value_Wei_String: amountWei,
        })
      )
    } else {
      receipt = await dispatch(
        depositErc20({
          recipient: toL2Account || '',
          value_Wei_String: amountWei,
          currency: token.address,
          currencyL2: token.addressL2,
        })
      )
    }

    return receipt
  }

  const depositNativeToken = async (amountWei: any) => {
    return dispatch(depositL1LP(token.address, amountWei))
  }

  const triggerFastDeposit = async (amountWei: any) => {
    if (token.symbol === networkService.L1NativeTokenSymbol) {
      return depositNativeToken(amountWei)
    }
    // ERC20 token fast bridging.
    // step -1  approve token
    // step -2  deposit to L1LP.
    const allAddresses = networkService.getAllAddresses()
    const approvalReciept = await dispatch(
      approveERC20(
        amountWei,
        token.address,
        (allAddresses as any)['L1LPAddress']
      )
    )

    if (approvalReciept === false) {
      dispatch(openError('Failed to approve amount or user rejected signature'))
      return
    }

    return dispatch(depositL1LP(token.address, amountWei))
  }

  const triggerExit = async (amountWei: any) => {
    return dispatch(exitBOBA(token.address, amountWei))
  }

  const triggerFastExit = async (amountWei: any) => {
    return dispatch(depositL2LP(token.address, amountWei))
  }

  const triggerSubmit = async () => {
    const amountWei = toWei_String(amountToBridge, token.decimals)
    let receipt
    dispatch(openModal('bridgeInProgress'))
    if (layer === LAYER.L1) {
      if (bridgeType === BRIDGE_TYPE.CLASSIC) {
        receipt = await triggerDeposit(amountWei)
        console.log(['classic bridging to l2', receipt])
      } else {
        receipt = await triggerFastDeposit(amountWei)
      }
    } else {
      if (bridgeType === BRIDGE_TYPE.CLASSIC) {
        receipt = await triggerExit(amountWei)
      } else {
        receipt = await triggerFastExit(amountWei)
      }
    }
    dispatch(closeModal('bridgeInProgress'))
    if (receipt) {
      dispatch(openModal('transactionSuccess'))
      dispatch(resetToken())
      dispatch(purgeBridgeAlert())
      dispatch(resetBridgeAmount())
    }
  }

  return {
    triggerSubmit,
  }
}

export default useBridge
