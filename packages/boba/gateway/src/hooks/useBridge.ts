import {
  approveERC20,
  depositErc20,
  depositETHL2,
  depositWithTeleporter,
  exitBOBA,
} from 'actions/networkAction'
import { closeModal, openError, openModal } from 'actions/uiAction'
import { BRIDGE_TYPE } from 'containers/Bridging/BridgeTypeSelector'
import { BigNumberish, ethers } from 'ethers'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectActiveNetwork,
  selectActiveNetworkType,
  selectAmountToBridge,
  selectBridgeToAddressState,
  selectBridgeType,
  selectLayer,
  selectTokenToBridge,
} from 'selectors'
import networkService from 'services/networkService'
import { toWei_String } from 'util/amountConvert'
import { Layer, LAYER } from 'util/constant'
import {
  purgeBridgeAlert,
  resetBridgeAmount,
  resetToken,
} from 'actions/bridgeAction'
import { INetwork, NetworkList } from '../util/network/network.util'

export const useBridge = () => {
  const dispatch = useDispatch<any>()
  const bridgeType = useSelector(selectBridgeType())
  const layer = useSelector(selectLayer())
  const toL2Account = useSelector(selectBridgeToAddressState())
  const token = useSelector(selectTokenToBridge())
  const amountToBridge = useSelector(selectAmountToBridge())

  const activeNetworkType = useSelector(selectActiveNetworkType())
  const activeNetwork = useSelector(selectActiveNetwork())

  const destLayer = layer === Layer.L1 ? Layer.L2 : Layer.L1
  const destChainIdBridge = (
    NetworkList[activeNetworkType] as INetwork[]
  )?.find((n) => n.chain === activeNetwork)?.chainId[destLayer]
  if (!destChainIdBridge) {
    dispatch(openError('Failed to get destination chain id'))
    console.error(
      'Destination chainId is undefined, this should never happen: ',
      NetworkList,
      activeNetworkType,
      activeNetwork,
      destLayer
    )
  }

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

  const triggerTeleportAsset = async (
    amountWei: BigNumberish,
    destChainId: BigNumberish
  ) => {
    if (token.address !== ethers.constants.AddressZero) {
      // ERC20 token fast bridging.
      // step -1  approve token
      // step -2  deposit to Teleportation.

      const { teleportationAddr } = networkService.getTeleportationAddress()
      const approvalReceipt = await dispatch(
        approveERC20(amountWei, token.address, teleportationAddr)
      )

      if (approvalReceipt === false) {
        dispatch(
          openError('Failed to approve amount or user rejected signature')
        )
        return
      }
    }
    return dispatch(
      depositWithTeleporter(layer, token.address, amountWei, destChainId)
    )
  }

  const triggerExit = async (amountWei: any) => {
    return dispatch(exitBOBA(token.address, amountWei))
  }

  const triggerSubmit = async () => {
    const amountWei = toWei_String(amountToBridge, token.decimals)
    let receipt
    dispatch(openModal('bridgeInProgress'))
    if (layer === LAYER.L1) {
      if (bridgeType === BRIDGE_TYPE.CLASSIC) {
        receipt = await triggerDeposit(amountWei)
      } else if (bridgeType === BRIDGE_TYPE.TELEPORTATION) {
        receipt = await triggerTeleportAsset(amountWei, destChainIdBridge!)
      }
    } else {
      if (bridgeType === BRIDGE_TYPE.CLASSIC) {
        receipt = await triggerExit(amountWei)
      } else if (bridgeType === BRIDGE_TYPE.TELEPORTATION) {
        receipt = await triggerTeleportAsset(amountWei, destChainIdBridge!)
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
