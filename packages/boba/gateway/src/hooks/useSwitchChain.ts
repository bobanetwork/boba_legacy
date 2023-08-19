/**
 * useSwitchChain:
 * - this hooks is only responsible to switch between the chains.
 */

import { setConnectBOBA, setConnectETH } from 'actions/setupAction'
import { openModal } from 'actions/uiAction'
import { useDispatch, useSelector } from 'react-redux'
import { selectAccountEnabled, selectLayer } from 'selectors'
import { LAYER } from 'util/constant'

const useSwitchChain = () => {
  const dispatch = useDispatch<any>()
  const accountEnabled = useSelector(selectAccountEnabled())
  const layer = useSelector(selectLayer())

  const switchChain = () => {
    console.log('im here')
    if (accountEnabled) {
      if (!layer || layer === LAYER.L2) {
        dispatch(setConnectETH(true))
      } else {
        dispatch(setConnectBOBA(true))
      }
    } else {
      dispatch(openModal('walletSelectorModal'))
    }
  }

  return { switchChain }
}

export default useSwitchChain
