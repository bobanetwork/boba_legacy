import React from 'react'
import { connect } from 'react-redux'
import { isEqual } from 'lodash'

import { openAlert, openError } from 'actions/uiAction'
import moment from 'moment'

import Button from 'components/button/Button'
// eslint-disable-next-line no-unused-vars
import { Box, Typography, LinearProgress } from '@mui/material'
import * as S from "./ListSave.styles"

import { withdrawFS_Savings } from 'actions/fixedAction'
import BobaIcon from 'components/icons/BobaIcon'

class ListSave extends React.Component {

  constructor(props) {

    super(props)

    const {
      stakeInfo,
      isMobile
    } = this.props

    this.state = {
      stakeInfo,
      isMobile
    }

  }

  componentDidUpdate(prevState) {

    const { stakeInfo, isMobile } = this.props

    if (!isEqual(prevState.stakeInfo, stakeInfo)) {
      this.setState({ stakeInfo })
    }

    if (!isEqual(prevState.isMobile, isMobile)) {
      this.setState({ isMobile })
    }

  }

  async handleUnstake() {

    const { stakeInfo } = this.state

    const withdrawTX = await this.props.dispatch(withdrawFS_Savings(stakeInfo.stakeId))

    if (withdrawTX) {
      this.props.dispatch(openAlert("Your BOBA were unstaked"))
    } else {
      this.props.dispatch(openError("Failed to unstake BOBA"))
    }

  }

  render() {

    const {
      stakeInfo,
    } = this.state

    const timeDeposit_S = stakeInfo.depositTimestamp
    const timeDeposit = moment.unix(timeDeposit_S).format('MM/DD/YYYY hh:mm a')

    const timeNow_S = Math.round(Date.now() / 1000)
    let duration_S = timeNow_S - timeDeposit_S
    const earned = stakeInfo.depositAmount * (0.05 / 365.0) * (duration_S / (24 * 60 * 60))

    const twoWeeks = 14 * 24 * 60 * 60
    const twoDays = 2 * 24 * 60 * 60

    const residual_S = duration_S % (twoWeeks + twoDays)
    const timeZero_S = timeNow_S - residual_S
    const unlocktimeNextBegin = moment.unix(timeZero_S + twoWeeks).format('MM/DD/YYYY hh:mm a')
    const unlocktimeNextEnd = moment.unix(timeZero_S + twoWeeks + twoDays).format('MM/DD/YYYY hh:mm a')

    let locked = true
    if (residual_S > twoWeeks) locked = false

    return (
      <S.StakeListItemContainer>
        <S.StakeItemDetails>
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.65 }}>
              Staked Boba
            </Typography>
            <Typography variant="body2">
              {stakeInfo.depositAmount ? `${stakeInfo.depositAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `0`}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="body2" sx={{ opacity: 0.65 }}>
              Earned
            </Typography>
            <Typography variant="body2">
              <BobaIcon dark={true} /> {' '} {earned.toFixed(3)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="body2" sx={{ opacity: 0.65 }}>
              Staked on
            </Typography>
            <Typography variant="body2">
              {timeDeposit}
            </Typography>
          </Box>
        </S.StakeItemDetails>
        <S.StakeItemContent>
          <Box sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-start',
          }}>
            <Typography style={{ fontSize: '0.9em', lineHeight: '1.1em', opacity: '0.65', paddingRight: '6px'}}>Next unstake window:</Typography>
            <Typography style={{ fontSize: '0.9em', lineHeight: '1.1em' }}>{unlocktimeNextBegin} - {unlocktimeNextEnd}</Typography>
          </Box>
          {/* 
          <Box sx={{ width: '100%', my: 2 }}>
            <LinearProgress color='warning' value={70} variant="determinate" />
          </Box> 
          */}
        </S.StakeItemContent>
        <S.StakeItemAction>
          <Button variant="contained"
            onClick={() => { this.handleUnstake() }}
            disabled={locked}
          >Unstake</Button>
        </S.StakeItemAction>
      </S.StakeListItemContainer>
    );

  }
}

const mapStateToProps = state => ({
  fixed: state.fixed,
})

export default connect(mapStateToProps)(ListSave)
