import { Typography } from 'components/global'
import useInterval from 'hooks/useInterval'
import React, { FC, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectIsFetchTxBlockNumber } from 'selectors'
import networkService from 'services/networkService'
import { POLL_INTERVAL } from 'util/constant'
import { MutedText } from './index.styles'

interface Props {
  onClose: () => void
}

const BlockConfirmation: FC<Props> = ({ onClose }) => {
  const [initialBlock, setInitialBlock] = useState<any>(0)
  const [latestBlock, setLatestBlock] = useState<any>(0)

  const isFetchTxBlock = useSelector(selectIsFetchTxBlockNumber())

  useEffect(() => {
    const fetchBlockNumber = async () => {
      const blockN = await networkService.getLatestBlockNumber()
      setInitialBlock(blockN)
    }
    if (isFetchTxBlock) {
      fetchBlockNumber()
    }
  }, [isFetchTxBlock])

  useInterval(() => {
    const fetchBlockNumber = async () => {
      const blockN = await networkService.getLatestBlockNumber()
      setLatestBlock(blockN)
    }
    if (isFetchTxBlock) {
      fetchBlockNumber()
    }
  }, POLL_INTERVAL)

  useEffect(() => {
    if (latestBlock - initialBlock === 64) {
      onClose()
    }
  }, [initialBlock, latestBlock, onClose])

  return (
    <>
      <MutedText>
        Your deposit will be available on L2 soon after the following block
        confirmations. You can safely close this window
      </MutedText>
      <Typography variant="body2">
        Current blocks : {!!latestBlock ? latestBlock - initialBlock : 0}/64
      </Typography>
    </>
  )
}

export default BlockConfirmation
