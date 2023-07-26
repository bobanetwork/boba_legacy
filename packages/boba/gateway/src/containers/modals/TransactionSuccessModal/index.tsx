import {
  SuccessContainer,
  SuccessCheck,
  MutedText,
  CircleOuter,
  CircleInner,
  TitleText,
  SuccessContent,
} from './index.styles'
import React, { FC } from 'react'
import { closeModal } from 'actions/uiAction'
import { Button, Heading, Typography } from 'components/global'
import Modal from 'components/modal/Modal'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

interface Props {
  open: boolean
}

const TransactionSuccessModal: FC<Props> = ({ open }) => {
  const dispatch = useDispatch<any>()
  const navigate = useNavigate()

  const handleClose = () => {
    dispatch(closeModal('transactionSuccess'))
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      minHeight="180px"
      title=""
      transparent={false}
    >
      <SuccessContainer>
        <CircleOuter>
          <CircleInner>
            <SuccessCheck />
          </CircleInner>
        </CircleOuter>
        <SuccessContent>
          <Heading variant="h1">Bridge Successful</Heading>
          <TitleText>
            Your funds will arrive in 1-5min. at your wallet on BobaL2.
          </TitleText>
          <MutedText>To monitor progress, go to History page.</MutedText>
        </SuccessContent>
        <Button
          onClick={() => {
            handleClose()
            navigate('/history')
          }}
          label="Go to history"
        />
      </SuccessContainer>
    </Modal>
  )
}

export default TransactionSuccessModal
