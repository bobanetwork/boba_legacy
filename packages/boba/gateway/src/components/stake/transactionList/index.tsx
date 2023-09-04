import React from 'react'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { formatDate } from 'util/dates'

dayjs.extend(duration)

import { useDispatch } from 'react-redux'
import { openAlert, openError } from 'actions/uiAction'
import { withdrawFS_Savings } from 'actions/fixedAction'

import { Button } from 'components/global/button'
import { Typography } from 'components/global/typography'
import { ModalTypography } from 'components/global/modalTypography'

import { TransactionListInterface } from './types'
import { StakeItemDetails, Token, Flex } from './styles'
import { getCoinImage } from 'util/coinImage'

const TransactionList = ({ stakeInfo }: TransactionListInterface) => {
  const dispatch = useDispatch<any>()

  const timeDeposit_S = stakeInfo.depositTimestamp
  const timeDeposit = formatDate(timeDeposit_S)
  const timeNow_S = Math.round(Date.now() / 1000)

  const duration_S = timeNow_S - timeDeposit_S

  const twoWeeks = 14 * 24 * 60 * 60
  const twoDays = 2 * 24 * 60 * 60

  const residual_S = duration_S % (twoWeeks + twoDays)
  const timeZero_S = timeNow_S - residual_S
  const unlocktimeNextBegin = formatDate(timeZero_S + twoWeeks)
  const unlocktimeNextEnd = formatDate(timeZero_S + twoWeeks + twoDays)

  let locked = true
  if (residual_S > twoWeeks) {
    locked = false
  }

  const earned = stakeInfo.depositAmount * (0.05 / 365.0) * duration_S

  const handleUnstake = async () => {
    const withdrawTX = await dispatch(withdrawFS_Savings(stakeInfo.stakeId))

    if (withdrawTX !== null && withdrawTX !== undefined) {
      openAlert('Your BOBA were unstaked')
    } else {
      openError('Failed to unstake BOBA')
    }
  }

  return (
    <StakeItemDetails>
      <div>
        <Token src={getCoinImage('boba')} />
        <Typography variant="body2">
          {dayjs(timeDeposit).format('DD MMM YYYY hh:mm A')}
        </Typography>
      </div>
      <Flex>
        <div>
          <ModalTypography variant="body2">Amount Staked </ModalTypography>
          <Typography variant="body2">
            {stakeInfo.depositAmount
              ? `${stakeInfo.depositAmount.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}`
              : `0`}
          </Typography>
        </div>
        <div>
          <ModalTypography variant="body2">Earned </ModalTypography>
          <Typography variant="body2">{earned.toFixed(3)}</Typography>
        </div>
        <div>
          <ModalTypography variant="body2">
            Next unstake window:{' '}
          </ModalTypography>
          <Typography variant="body2">
            {` ${dayjs(unlocktimeNextBegin).format('DD')}-${dayjs(
              unlocktimeNextEnd
            ).format('DD MMM YYYY hh:mm A')}`}
          </Typography>
        </div>
      </Flex>
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
