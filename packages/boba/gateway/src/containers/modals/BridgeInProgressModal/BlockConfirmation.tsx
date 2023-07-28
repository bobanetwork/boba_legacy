import { Typography } from 'components/global'
import useInterval from 'hooks/useInterval'
import React, { FC, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectIsFetchTxBlockNumber } from 'selectors'
import networkService from 'services/networkService'
import { POLL_INTERVAL } from 'util/constant'
import { MutedText } from './index.styles'
import { diffBetweenTimeStamp } from 'util/dates'

interface Props {
  onClose: () => void
}

const BlockConfirmation: FC<Props> = ({ onClose }) => {
  const [initialBlock, setInitialBlock] = useState<any>(0)
  const [latestBlock, setLatestBlock] = useState<any>(0)
  const [blockTime, setBlockTime] = useState<any>(0)

  const isFetchTxBlock = useSelector(selectIsFetchTxBlockNumber())

  useEffect(() => {
    const fetchBlockNumber = async () => {
      const blockN = await networkService.getLatestBlockNumber()
      const time1 = await networkService.getBlockTime(blockN)
      const time2 = await networkService.getBlockTime(blockN - 1)
      setBlockTime(diffBetweenTimeStamp(time1, time2))
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
    // close modal as soon as blocks exceeds or equal 64.
    if (latestBlock - initialBlock >= 64) {
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
      {latestBlock ? (
        <Typography variant="body2">
          Estimated time to complete :{' '}
          {!!latestBlock
            ? ((64 - (latestBlock - initialBlock)) * blockTime) / 60
            : 0}{' '}
          min.
        </Typography>
      ) : null}
    </>
  )
}

export default BlockConfirmation
