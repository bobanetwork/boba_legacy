import {
  NetworkPickerModalContainer,
  NetworkPickerList,
  NetworkItem,
  NetworkIcon,
  NetworkLabel,
} from './index.styles'
import { closeModal } from 'actions/uiAction'
import Modal from 'components/modal/Modal'
import React, { ElementType, FC } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ListLabel } from '../tokenPicker/styles'
import { L1_ICONS, L2_ICONS, NetworkList } from 'util/network/network.util'
import {
  selectActiveNetwork,
  selectActiveNetworkType,
  selectModalState,
} from 'selectors'
import { getCoinImage } from 'util/coinImage'
import { setNetwork } from 'actions/networkAction'

interface NetworkPickerModalProps {
  open: boolean
}

const NetworkPickerModal: FC<NetworkPickerModalProps> = ({ open }) => {
  const dispatch = useDispatch<any>()
  const networkType = useSelector(selectActiveNetworkType())
  const activeNetwork = useSelector(selectActiveNetwork())
  const selectionLayer = useSelector(selectModalState('selectionLayer'))

  const handleClose = () => {
    dispatch(closeModal('networkPicker'))
  }

  const networkList = (NetworkList as Record<string, any>)[networkType]

  const l1Icon = L1_ICONS as Record<string, ElementType>
  const l2Icon = L2_ICONS as Record<string, ElementType>

  const onChainChange = (chainDetail: any) => {
    dispatch(
      setNetwork({
        network: chainDetail.chain,
        name: chainDetail.name,
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
          {networkList.map((chainDetail: any) => {
            const Icon =
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
                  <Icon selected />
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
