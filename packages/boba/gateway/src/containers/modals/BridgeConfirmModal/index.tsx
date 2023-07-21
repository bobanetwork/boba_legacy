import { Heading } from 'components/global'
import {
  ConfirmModalContainer,
  ConfirmLabel,
  ConfirmValue,
  ConfirmActionButton,
  Item,
} from './index.styles'
import { closeModal } from 'actions/uiAction'
import Modal from 'components/modal/Modal'
import React, { FC } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectAmountToBridge,
  selectBridgeType,
  selectLookupPrice,
  selectTokenToBridge,
} from 'selectors'
import { amountToUsd } from 'util/amountConvert'
import { BRIDGE_TYPE } from 'containers/Bridging/BridgeTypeSelector'
import useBridge from 'hooks/useBridge'

interface Props {
  open: boolean
}

const BridgeConfirmModal: FC<Props> = ({ open }) => {
  const dispatch = useDispatch<any>()
  const bridgeType = useSelector(selectBridgeType())
  const token = useSelector(selectTokenToBridge())
  const amountToBridge = useSelector(selectAmountToBridge())
  const lookupPrice = useSelector(selectLookupPrice)

  const { triggerSubmit } = useBridge()

  const estimatedTime =
    bridgeType === BRIDGE_TYPE.CLASSIC ? '7 days' : '1 ~ 3 minutes'

  const handleClose = () => {
    dispatch(closeModal('bridgeConfirmModal'))
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      minHeight="180px"
      title="Bridge Confirmation"
      transparent={false}
    >
      <ConfirmModalContainer>
        <Item>
          <ConfirmLabel>Bridge Type</ConfirmLabel>
          <ConfirmValue>{bridgeType.toLowerCase()} Bridge</ConfirmValue>
        </Item>
        <Item>
          <ConfirmLabel>Amount to bridge</ConfirmLabel>
          <ConfirmValue>
            {amountToBridge} {token.symbol} ($
            {amountToUsd(amountToBridge, lookupPrice, token).toFixed(2)})
          </ConfirmValue>
        </Item>
        <Item>
          <ConfirmLabel>Gas Fee</ConfirmLabel>
          <ConfirmValue>0.000038 ETH</ConfirmValue>
        </Item>
        <Item>
          <ConfirmLabel>Time</ConfirmLabel>
          <ConfirmValue>{estimatedTime}</ConfirmValue>
        </Item>
        <ConfirmActionButton
          onClick={() => {
            triggerSubmit()
            handleClose()
          }}
          label={<Heading variant="h3">Confirm</Heading>}
        />
      </ConfirmModalContainer>
    </Modal>
  )
}

export default BridgeConfirmModal
