import {
  resetToken,
  purgeBridgeAlert,
  resetBridgeAmount,
} from 'actions/bridgeAction'
import { InprogressContainer, MutedText, ProgressLoader } from './index.styles'
import { closeModal } from 'actions/uiAction'
import { Heading, Typography } from 'components/global'
import Modal from 'components/modal/Modal'
import useInterval from 'hooks/useInterval'
import React, { FC, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import networkService from 'services/networkService'
import { POLL_INTERVAL } from 'util/constant'

interface Props {
  open: boolean
}

const BridgeInProgressModal: FC<Props> = ({ open }) => {
  const dispatch = useDispatch<any>()
  const [initialBlock, setInitialBlock] = useState<any>(0)
  const [latestBlock, setLatestBlock] = useState<any>(0)

  const handleClose = () => {
    dispatch(closeModal('bridgeInProgress'))
    // cleaning up bridge state
    dispatch(resetToken())
    dispatch(purgeBridgeAlert())
    dispatch(resetBridgeAmount())
  }

  useEffect(() => {
    const fetchBlockNumber = async () => {
      const blockN = await networkService.getLatestBlockNumber()
      setInitialBlock(blockN)
    }
    fetchBlockNumber()
  }, [])

  useInterval(() => {
    const fetchBlockNumber = async () => {
      const blockN = await networkService.getLatestBlockNumber()
      setLatestBlock(blockN)
    }
    fetchBlockNumber()
  }, POLL_INTERVAL)

  useEffect(() => {
    if (latestBlock - initialBlock === 64) {
      handleClose()
    }
  }, [initialBlock, latestBlock, handleClose])

  return (
    <Modal
      open={open}
      onClose={handleClose}
      minHeight="180px"
      title=""
      transparent={false}
    >
      <InprogressContainer>
        <ProgressLoader />
        <Heading variant="h1">Bridging...</Heading>
        <Typography variant="head">
          Current blocks : {latestBlock - initialBlock}/64
        </Typography>
        <MutedText>Please wait a moment</MutedText>
      </InprogressContainer>
    </Modal>
  )
}

export default BridgeInProgressModal
