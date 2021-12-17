import React from 'react'
import { connect } from 'react-redux'
import { isEqual } from 'lodash'
import { logAmount, powAmount } from 'util/amountConvert'
import { BigNumber } from 'ethers'

import { openAlert, openModal } from 'actions/uiAction'
import moment from 'moment'

import Button from 'components/button/Button'
import networkService from 'services/networkService'

import { Box, Typography, Fade,  CircularProgress } from '@material-ui/core'
import * as S from "./ListSave.styles"

class ListSave extends React.Component {

  constructor(props) {

    super(props)

    const {
      stakeInfo
    } = this.props

    this.state = {
      stakeInfo,
      loading: false,
    }

  }

  componentDidMount(){
    //this.props.dispatch(getAllAddresses());
  }

  componentDidUpdate(prevState) {

    // const { poolInfo, userInfo, balance, showAll, showStakesOnly } = this.props

    // if (!isEqual(prevState.poolInfo, poolInfo)) {
    //   this.setState({ poolInfo });
    // }

    // if (!isEqual(prevState.userInfo, userInfo)) {
    //   this.setState({ userInfo });
    // }

    // if (!isEqual(prevState.balance, balance)) {
    //   this.setState({ balance });
    // }

    // if (!isEqual(prevState.showAll, showAll)) {
    //   this.setState({ showAll });
    // }

    // if (!isEqual(prevState.showStakesOnly, showStakesOnly)) {
    //   this.setState({ showStakesOnly });
    // }

  }

  async handleStakeToken() {

    // const { poolInfo, L1orL2Pool, balance } = this.state

    // const { allAddresses } = this.props.farm

    // this.props.dispatch(updateStakeToken({
    //   symbol: poolInfo.symbol,
    //   currency: L1orL2Pool === 'L1LP' ? poolInfo.l1TokenAddress : poolInfo.l2TokenAddress,
    //   LPAddress: L1orL2Pool === 'L1LP' ? allAddresses.L1LPAddress : allAddresses.L2LPAddress,
    //   L1orL2Pool,
    //   balance,
    //   decimals: poolInfo.decimals
    // }))

    // this.props.dispatch(openModal('farmDepositModal'))
  }

  async handleWithdrawToken() {

    // const { poolInfo, L1orL2Pool, balance } = this.state

    // const { allAddresses } = this.props.farm

    // this.props.dispatch(updateWithdrawToken({
    //   symbol: poolInfo.symbol,
    //   currency: L1orL2Pool === 'L1LP' ? poolInfo.l1TokenAddress : poolInfo.l2TokenAddress,
    //   LPAddress: L1orL2Pool === 'L1LP' ? allAddresses.L1LPAddress : allAddresses.L2LPAddress,
    //   L1orL2Pool,
    //   balance,
    //   decimals: poolInfo.decimals
    // }))

    // this.props.dispatch(openModal('farmWithdrawModal'))
  }

  async handleHarvest() {

    // const { poolInfo, L1orL2Pool, userInfo } = this.state;

    // this.setState({ loading: true })

    // const userReward = BigNumber.from(userInfo.pendingReward).add(
    //   BigNumber.from(userInfo.amount)
    //   .mul(BigNumber.from(poolInfo.accUserRewardPerShare))
    //   .div(BigNumber.from(powAmount(1, 12)))
    //   .sub(BigNumber.from(userInfo.rewardDebt))
    // ).toString()

    // let getRewardTX = await this.props.dispatch(getReward(
    //   L1orL2Pool === 'L1LP' ? poolInfo.l1TokenAddress : poolInfo.l2TokenAddress,
    //   userReward,
    //   L1orL2Pool
    // ))

    // if (getRewardTX) {
    //   this.props.dispatch(openAlert(`${logAmount(userReward, poolInfo.decimals, 2)} ${poolInfo.symbol} was added to your account`))
    //   this.props.dispatch(getFarmInfo())
    //   this.setState({ loading: false })
    // } else {
    //   this.setState({ loading: false })
    // }

  }

  render() {

    const {
      stakeInfo,
      dropDownBox, 
      loading
    } = this.state

    const pageLoading = Object.keys(stakeInfo).length === 0

    const { isMobile } = this.props

/*
depositAmount: "100"
depositTimestamp: 1639707811
isActive: true
stakeId: 3
*/

    const time = moment.unix(stakeInfo.depositTimestamp).format('MM/DD/YYYY hh:mm a')

    return (
      <S.Wrapper dropDownBox={dropDownBox}>
        {pageLoading ? (
          <Box sx={{textAlign: 'center'}}>
            <CircularProgress color="secondary" />
          </Box>
        ) : (
          <S.GridContainer container
            spacing={2}
            direction="row"
            justifyContent="flex-start"
            alignItems="center"
          >

            <S.GridItemTag item
              xs={4}
              md={3}
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
              xs={4}
              md={3}
            >
              {isMobile ? (
                <Typography variant="overline" sx={{opacity: 0.7, paddingRight: '5px'}}>Staked</Typography>
              ) : (null)}
              <Typography variant="body1" style={{opacity: '0.4'}}>
                {time}
              </Typography>
            </S.GridItemTag>

            <S.GridItemTag item
              xs={4}
              md={3}
              >
              {isMobile ? (
                <Typography variant="overline" sx={{opacity: 0.7, paddingRight: '5px'}}>Status</Typography>
              ) : (null)}
              <Typography variant="body1" style={{opacity: '0.4'}}>
                {stakeInfo.isActive ? 'Active' : 'Not Active'}
              </Typography>
            </S.GridItemTag>

            <S.GridItemTag item
              xs={12}
              md={3}
              >
              {isMobile ? (
                <Typography variant="overline" sx={{opacity: 0.7, paddingRight: '5px'}}>Actions</Typography>
              ) : (null)}
              <Button
                variant="contained"
                onClick={()=>{}}
                disabled={false}
                fullWidth
                sx={{flex: 1}}
              >
                Unstake
              </Button>
            </S.GridItemTag>

          </S.GridContainer>
        )}
      </S.Wrapper>
    )
  }
}

const mapStateToProps = state => ({
    fixed: state.fixed,
})

export default connect(mapStateToProps)(ListSave)
