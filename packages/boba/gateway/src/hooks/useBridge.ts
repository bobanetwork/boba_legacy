import { depositETHL2, depositErc20 } from 'actions/networkAction'
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
import { toWei_String } from 'util/amountConvert'
import { LAYER } from 'util/constant'

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

  const triggerDeposit = async () => {
    let receipt
    const value_Wei_String = toWei_String(amountToBridge, token.decimals)
    if (token.address === ethers.constants.AddressZero) {
      receipt = await dispatch(
        depositETHL2({
          recipient: toL2Account || '',
          value_Wei_String,
        })
      )
    } else {
      receipt = await dispatch(
        depositErc20({
          recipient: toL2Account || '',
          value_Wei_String,
          currency: token.address,
          currencyL2: token.addressL2,
        })
      )
    }

    console.log(receipt)
    console.log(['open modal'])
  }

  const triggerSubmit = () => {
    if (layer === LAYER.L1) {
      if (bridgeType === BRIDGE_TYPE.CLASSIC) {
        triggerDeposit()
      }
    } else {
      // trigger exits
    }
  }

  return {
    triggerSubmit,
  }
}

export default useBridge
