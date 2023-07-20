import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
dayjs.extend(duration)

import { connect } from 'react-redux'
import { openAlert, openError } from 'actions/uiAction'
import { formatDate } from 'util/dates'
import { withdrawFS_Savings } from 'actions/fixedAction'

import { Button } from 'components/global/button'
import { Typography } from 'components/global/typography'

import { TransactionListInterface } from './types'
import {
  StakeListItemContainer,
  StakeItemDetails,
  StakeItemContent,
  StakeItemAction,
} from './styles'

const TransactionList = ({ stakeInfo }: TransactionListInterface) => {
  const [state, setState] = useState({
    stakeInfo,
  })

  useEffect(() => {
    setState({ stakeInfo })
  }, [stakeInfo])

  const handleUnstake = async () => {
    const { stakeInfo } = state
    const withdrawTX = await withdrawFS_Savings(stakeInfo.stakeId)

    if (withdrawTX !== null && withdrawTX !== undefined) {
      openAlert('Your BOBA were unstaked')
    } else {
      openError('Failed to unstake BOBA')
    }
  }

  const timeDeposit = dayjs.unix(state.stakeInfo.depositTimestamp)
  const timeNow = dayjs()

  const duration_Days = timeNow.diff(timeDeposit, 'day')
  const earned = state.stakeInfo.depositAmount * (0.05 / 365.0) * duration_Days

  const unlocktimeNextBegin = timeNow.add(14, 'day')

  const unlocktimeNextEnd = unlocktimeNextBegin.add(2, 'day')

  const locked = duration_Days <= 14

  return (
    <StakeListItemContainer>
      <StakeItemDetails>
        <div>
          <Typography variant="body2">Staked Boba</Typography>
          <Typography variant="body2">
            {state.stakeInfo.depositAmount
              ? `${state.stakeInfo.depositAmount.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}`
              : `0`}
          </Typography>
        </div>
        <div>
          <Typography variant="body2">Earned</Typography>
          <Typography variant="body2">{earned.toFixed(3)}</Typography>
        </div>
        <div>
          <Typography variant="body2">Staked on</Typography>
          <Typography variant="body2">
            {timeDeposit.format('YYYY-MM-DD')}
          </Typography>
        </div>
      </StakeItemDetails>
      <StakeItemContent>
        <div>
          <Typography variant="body2">Next unstake window:</Typography>
          <Typography variant="body2">
            {unlocktimeNextBegin.format('YYYY-MM-DD')} -
            {unlocktimeNextEnd.format('YYYY-MM-DD')}
          </Typography>
        </div>
      </StakeItemContent>
      <StakeItemAction>
        <Button onClick={handleUnstake} disable={locked} label="Unstake" />
      </StakeItemAction>
    </StakeListItemContainer>
  )
}

const mapStateToProps = (state: any) => ({
  fixed: state.fixed,
})

export default connect(mapStateToProps)(TransactionList)
