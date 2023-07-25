import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
dayjs.extend(duration)

import { connect } from 'react-redux'
import { openAlert, openError } from 'actions/uiAction'
import { withdrawFS_Savings } from 'actions/fixedAction'

import { Button } from 'components/global/button'
import { Typography } from 'components/global/typography'
import { ModalTypography } from 'components/global/modalTypography'

import { TransactionListInterface } from './types'
import { StakeItemDetails, Token } from './styles'
import { getCoinImage } from 'util/coinImage'

const TransactionList = ({ stakeInfo }: TransactionListInterface) => {
  const [TransactionListState, setTransactionListState] = useState({
    stakeInfo,
  })

  useEffect(() => {
    setTransactionListState({ stakeInfo })
  }, [stakeInfo])

  const handleUnstake = async () => {
    const { stakeInfo } = TransactionListState

    const withdrawTX = await withdrawFS_Savings(stakeInfo.stakeId)

    if (withdrawTX !== null && withdrawTX !== undefined) {
      openAlert('Your BOBA were unstaked')
    } else {
      openError('Failed to unstake BOBA')
    }
  }

  const timeDeposit = dayjs.unix(
    TransactionListState.stakeInfo.depositTimestamp
  )
  const timeNow = dayjs()

  const duration_Days = timeNow.diff(timeDeposit, 'day')
  const earned =
    TransactionListState.stakeInfo.depositAmount *
    (0.05 / 365.0) *
    duration_Days

  const unlocktimeNextBegin = timeNow.add(14, 'day')

  const unlocktimeNextEnd = unlocktimeNextBegin.add(2, 'day')

  const locked = duration_Days <= 14

  return (
    <StakeItemDetails>
      <div>
        <Token src={getCoinImage('boba')} />
      </div>
      <div>
        <Typography variant="body2">
          {timeDeposit.format('DD MMM YYYY hh:mm A')}
        </Typography>
      </div>
      <div>
        <ModalTypography variant="body2">Amount Staked </ModalTypography>
        <Typography variant="body2">
          {TransactionListState.stakeInfo.depositAmount
            ? `${TransactionListState.stakeInfo.depositAmount.toLocaleString(
                undefined,
                {
                  maximumFractionDigits: 2,
                }
              )}`
            : `0`}
        </Typography>
      </div>
      <div>
        <ModalTypography variant="body2">Earned </ModalTypography>
        <Typography variant="body2">{earned.toFixed(3)}</Typography>
      </div>
      <div>
        <ModalTypography variant="body2">Next unstake window: </ModalTypography>
        <Typography variant="body2">
          {` ${unlocktimeNextBegin.format('DD')}-${unlocktimeNextEnd.format(
            'DD MMM YYYY hh:mm A'
          )}`}
        </Typography>
      </div>
      <div>
        <Button
          tiny={true}
          disable={locked}
          label="Unstake"
          onClick={handleUnstake}
        />
      </div>
    </StakeItemDetails>
  )
}

export default TransactionList
