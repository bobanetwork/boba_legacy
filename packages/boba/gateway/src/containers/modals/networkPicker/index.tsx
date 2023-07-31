import {
  NetworkIcon,
  NetworkItem,
  NetworkLabel,
  NetworkPickerList,
  NetworkPickerModalContainer,
} from './index.styles'
import { closeModal } from 'actions/uiAction'
import Modal from 'components/modal/Modal'
import React, { ElementType, FC } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ListLabel } from '../tokenPicker/styles'
import {
  INetwork,
  L1_ICONS,
  L2_ICONS,
  NetworkList,
} from 'util/network/network.util'
import {
  selectActiveNetwork,
  selectActiveNetworkType,
  selectModalState,
} from 'selectors'
import { setNetwork } from 'actions/networkAction'
import { BRIDGE_TYPE } from '../../Bridging/BridgeTypeSelector'
import { Layer } from '../../../util/constant'

interface NetworkPickerModalProps {
  open: boolean
  bridgeType: BRIDGE_TYPE
}

const NetworkPickerModal: FC<NetworkPickerModalProps> = ({
  open,
  bridgeType,
}: NetworkPickerModalProps) => {
  const dispatch = useDispatch<any>()
  const networkType = useSelector(selectActiveNetworkType())
  const activeNetwork = useSelector(selectActiveNetwork())
  const selectionLayer = useSelector(selectModalState('selectionLayer'))

  const handleClose = () => {
    dispatch(closeModal('networkPicker'))
  }

  const networkList: INetwork[] = NetworkList[networkType]

  const l1Icon = L1_ICONS as Record<string, ElementType>
  const l2Icon = L2_ICONS as Record<string, ElementType>

  const onChainChange = (chainDetail: INetwork) => {
    dispatch(
      // destNetworkSelection && bridgeType === BRIDGE_TYPE.FAST ?
      setNetwork({
        network: chainDetail.chain,
        name: chainDetail.name,
        chainIds: chainDetail.chainId,
        networkIcon: chainDetail.icon,
        networkType,
      })
    )
    handleClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      minHeight="180px"
      title="Select Network"
      transparent={false}
    >
      <ListLabel> Network Names </ListLabel>
      <NetworkPickerModalContainer>
        <NetworkPickerList>
          {networkList.map((chainDetail: INetwork) => {
            const CurrentIcon =
              selectionLayer === 'l1'
                ? l1Icon[chainDetail.icon]
                : l2Icon[chainDetail.icon]

            return (
              <NetworkItem
                selected={chainDetail.chain === activeNetwork}
                key={chainDetail.label}
                onClick={() => onChainChange(chainDetail)}
              >
                <NetworkIcon>
                  <CurrentIcon selected />
                </NetworkIcon>
                <NetworkLabel>{chainDetail.name[selectionLayer]}</NetworkLabel>
              </NetworkItem>
            )
          })}
        </NetworkPickerList>
      </NetworkPickerModalContainer>
    </Modal>
  )
}

export default NetworkPickerModal
