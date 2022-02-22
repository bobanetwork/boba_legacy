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
import { Circle } from '@mui/icons-material'

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
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.65 }}>
              Earned
            </Typography>
            <Typography variant="body2">
              <BobaIcon dark={true} /> {' '} {earned.toFixed(3)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.65 }}>
              <Circle sx={{ height: "8px", color: '#fff', mr: '5px', opacity: `${stakeInfo.isActive ? 1 : 0.4}`, width: "8px" }} />
              {stakeInfo.isActive ? 'Active' : 'Not Active'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              {timeDeposit}
            </Typography>
          </Box>
        </S.StakeItemDetails>
        <S.StakeItemContent>
          <Box sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <Typography style={{ fontSize: '0.9em', lineHeight: '1.1em', opacity: '0.65' }}>Next unstake window</Typography>
            <Typography style={{ fontSize: '0.7em', lineHeight: '0.9em', opacity: '0.65' }}>{unlocktimeNextBegin} - {unlocktimeNextEnd}</Typography>
          </Box>
          {/* <Box sx={{ width: '100%', my: 2 }}>
            <LinearProgress color='warning' value={70} variant="determinate" />
          </Box> */}
        </S.StakeItemContent>
        <S.StakeItemAction>
          <Button variant="contained"
            onClick={() => { this.handleUnstake() }}
            disabled={locked}
          >Unstake</Button>
        </S.StakeItemAction>
      </S.StakeListItemContainer>
    );

    /* return (
      <S.Wrapper>
        {pageLoading ? (
          <Box sx={{textAlign: 'center'}}>
            <CircularProgress color="secondary" />
          </Box>
        ) : (
        <S.Entry>
          <Grid 
            container
            spacing={2}
          >

            <S.GridItemTag 
              item
              xs={5}
              md={1}
            >
              {isMobile ? (
                <Typography variant="overline" sx={{opacity: 0.7, paddingRight: '5px'}}>Amount</Typography>
              ) : (null)}
              <Typography variant="body1">
                {stakeInfo.depositAmount ?
                  `${stakeInfo.depositAmount.toLocaleString(undefined, {maximumFractionDigits:2})}` : `0`
                }
              </Typography>
            </S.GridItemTag>

            <S.GridItemTag item
              xs={5}
              md={1}
            >
              {isMobile ? (
                <Typography variant="overline" sx={{opacity: 0.7, paddingRight: '5px'}}>Earned</Typography>
              ) : (null)}
              <Typography variant="body1">
                {earned.toFixed(3)}
              </Typography>
            </S.GridItemTag>

            <S.GridItemTag item
              xs={2}
              md={1}
              >
              <Typography variant="body1">
                {stakeInfo.isActive ? 'Active' : 'Not Active'}
              </Typography>
            </S.GridItemTag>

            <S.GridItemTag 
              item
              xs={12}
              md={3}
            >
              {isMobile ? (
                <Typography variant="overline" sx={{opacity: 0.7, paddingRight: '5px'}}>Deposited On</Typography>
              ) : (null)}
              <Typography variant="body1" style={{opacity: '0.4'}}>
                {timeDeposit}
              </Typography>
            </S.GridItemTag>

            <S.GridItemTag item
              xs={12}
              md={4}
            >
              {isMobile ? (
                <Typography variant="overline" sx={{opacity: 0.7, paddingRight: '5px'}}>Next Unstake Window</Typography>
              ) : (null)}
              <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems:'flex-start'}}>
                <Typography variant="overline" style={{lineHeight: '1em'}}>Begin: {unlocktimeNextBegin}</Typography>
                <Typography variant="overline" style={{lineHeight: '1em'}}>End: {unlocktimeNextEnd}</Typography>
              </div>
            </S.GridItemTag>

            <S.GridItemTag item
              xs={12}
              md={2}
            >
              <Button
                variant="contained"
                onClick={()=>{this.handleUnstake()}}
                disabled={locked}
              >
                Unstake
              </Button>
            </S.GridItemTag>

          </Grid>
        </S.Entry>
        )}
      </S.Wrapper>
    ) */
  }
}

const mapStateToProps = state => ({
  fixed: state.fixed,
})

export default connect(mapStateToProps)(ListSave)
