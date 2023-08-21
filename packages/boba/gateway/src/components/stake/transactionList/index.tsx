import React from 'react'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

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

  const timeDeposit = dayjs.unix(stakeInfo.depositTimestamp)
  const timeNow = dayjs()

  const duration_Days = timeNow.diff(timeDeposit, 'day')
  const earned = stakeInfo.depositAmount * (0.05 / 365.0) * duration_Days

  const unlocktimeNextBegin = timeDeposit.add(14, 'day')

  const unlocktimeNextEnd = unlocktimeNextBegin.add(2, 'day')

  /* finalize the migration to DAYJs next deploy*/
  const timeDeposit_S = stakeInfo.depositTimestamp
  const timeNow_S = Math.round(Date.now() / 1000)

  const duration_S = timeNow_S - timeDeposit_S

  const twoWeeks = 14 * 24 * 60 * 60
  const twoDays = 2 * 24 * 60 * 60
  const residual_S = duration_S % (twoWeeks + twoDays)

  const handleUnstake = async () => {
    const withdrawTX = await dispatch(withdrawFS_Savings(stakeInfo.stakeId))

    if (withdrawTX !== null && withdrawTX !== undefined) {
      openAlert('Your BOBA were unstaked')
    } else {
      openError('Failed to unstake BOBA')
    }
  }

  let locked = true
  if (residual_S > twoWeeks) {
    locked = false
  }

  return (
    <StakeItemDetails>
      <div>
        <Token src={getCoinImage('boba')} />
        <Typography variant="body2">
          {timeDeposit.format('DD MMM YYYY hh:mm A')}
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
            {` ${unlocktimeNextBegin.format('DD')}-${unlocktimeNextEnd.format(
              'DD MMM YYYY hh:mm A'
            )}`}
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
