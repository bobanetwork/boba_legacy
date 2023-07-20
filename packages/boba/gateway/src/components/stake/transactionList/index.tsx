import React, { useState, useEffect } from 'react'
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

  const timeDeposit_S = state.stakeInfo.depositTimestamp
  const timeDeposit = formatDate(timeDeposit_S)

  const timeNow_S = Math.round(Date.now() / 1000)
  const duration_S = timeNow_S - timeDeposit_S
  const earned =
    state.stakeInfo.depositAmount *
    (0.05 / 365.0) *
    (duration_S / (24 * 60 * 60))

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
          <Typography variant="body2">{timeDeposit}</Typography>
        </div>
      </StakeItemDetails>
      <StakeItemContent>
        <div>
          <Typography variant="body2">Next unstake window:</Typography>
          <Typography variant="body2">
            {unlocktimeNextBegin} - {unlocktimeNextEnd}
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
