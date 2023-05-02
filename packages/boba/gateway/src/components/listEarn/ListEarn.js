import React from 'react';
import { connect } from 'react-redux';
import { isEqual } from 'util/lodash';

import { logAmount, powAmount } from 'util/amountConvert';
import { BigNumber } from 'ethers';

import { openAlert, openModal } from 'actions/uiAction';

import { getEarnInfo, updateStakeToken, updateWithdrawToken } from 'actions/earnAction';

import Button from 'components/button/Button';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import networkService from 'services/networkService'

import { Box, Typography, Fade, CircularProgress } from '@mui/material';
import * as S from "./ListEarn.styles"
import { getAllAddresses, getReward } from 'actions/networkAction';


import {Text} from 'components/global/text'
import {AprLabel} from 'components/global/label'
import {IconLabel} from 'components/global/IconLabel';
import {formatLargeNumber} from 'util/amountConvert';
import {TableContent} from 'components/global/table'
class ListEarn extends React.Component {

  constructor(props) {

    super(props)

    const {
      poolInfo,
      userInfo,
      L1orL2Pool,
      balance,
      showAll,
      showStakesOnly,
      accountEnabled,
      chainId
    } = this.props;

    this.state = {
      balance,
      L1orL2Pool,
      chainId,
      // data
      poolInfo,
      userInfo,
      showAll,
      showStakesOnly,
      //drop down box
      dropDownBox: false,
      dropDownBoxInit: true,
      // loading
      loading: false,
      // provider status
      accountEnabled,
    }

  }

  componentDidMount() {
    this.props.dispatch(getAllAddresses());
  }

  componentDidUpdate(prevProps, prevState) {
    const { chainId, poolInfo, userInfo, balance, showAll, showStakesOnly, accountEnabled } = this.props;
    const config = {
      chainId,
      poolInfo,
      userInfo,
      balance,
      showAll,
      showStakesOnly,
      accountEnabled
    };

    Object.keys(config).forEach(key => {
      if (!isEqual(prevProps[key], this.props[key])) {
        this.setState({ [key]: this.props[key] });
      }
    });
  }

  async handleStakeToken() {

    const { poolInfo, L1orL2Pool, balance } = this.state

    const { allAddresses } = this.props.earn

    this.props.dispatch(updateStakeToken({
      symbol: poolInfo.symbol,
      currency: L1orL2Pool === 'L1LP' ? poolInfo.l1TokenAddress : poolInfo.l2TokenAddress,
      LPAddress: L1orL2Pool === 'L1LP' ? allAddresses.L1LPAddress : allAddresses.L2LPAddress,
      L1orL2Pool,
      balance,
      decimals: poolInfo.decimals
    }))

    this.props.dispatch(openModal('EarnDepositModal'))
  }

  async handleWithdrawToken() {

    const { poolInfo, L1orL2Pool, balance } = this.state

    const { allAddresses } = this.props.earn

    this.props.dispatch(updateWithdrawToken({
      symbol: poolInfo.symbol,
      currency: L1orL2Pool === 'L1LP' ? poolInfo.l1TokenAddress : poolInfo.l2TokenAddress,
      LPAddress: L1orL2Pool === 'L1LP' ? allAddresses.L1LPAddress : allAddresses.L2LPAddress,
      L1orL2Pool,
      balance,
      decimals: poolInfo.decimals
    }))

    this.props.dispatch(openModal('EarnWithdrawModal'))
  }

  async handleHarvest() {

    const { poolInfo, L1orL2Pool, userInfo } = this.state;

    this.setState({ loading: true })

    const userReward = BigNumber.from(userInfo.pendingReward).add(
      BigNumber.from(userInfo.amount)
        .mul(BigNumber.from(poolInfo.accUserRewardPerShare))
        .div(BigNumber.from(powAmount(1, 12)))
        .sub(BigNumber.from(userInfo.rewardDebt))
    ).toString()

    let getRewardTX = await this.props.dispatch(getReward(
      L1orL2Pool === 'L1LP' ? poolInfo.l1TokenAddress : poolInfo.l2TokenAddress,
      userReward,
      L1orL2Pool
    ))

    if (getRewardTX) {
      this.props.dispatch(openAlert(`${logAmount(userReward, poolInfo.decimals, 2)} ${poolInfo.symbol} was added to your account`))
      this.props.dispatch(getEarnInfo())
      this.setState({ loading: false })
    } else {
      this.setState({ loading: false })
    }

  }



  render() {
    const {
      poolInfo, userInfo,
      dropDownBox, showAll, showStakesOnly,
      loading, L1orL2Pool, accountEnabled,
      chainId,
    } = this.state;

    const pageLoading = Object.keys(poolInfo).length === 0;

    let userReward = 0;

    if (Object.keys(userInfo).length && Object.keys(poolInfo).length && accountEnabled) {
      userReward = BigNumber.from(userInfo.pendingReward).add(
        BigNumber.from(userInfo.amount)
          .mul(BigNumber.from(poolInfo.accUserRewardPerShare))
          .div(BigNumber.from(powAmount(1, 12)))
          .sub(BigNumber.from(userInfo.rewardDebt))
      ).toString()
    }

    const disabled = !L1orL2Pool.includes(networkService.L1orL2)
    const symbol = poolInfo.symbol
    const name = poolInfo.name
    const decimals = poolInfo.decimals
    const address = L1orL2Pool === 'L1LP' ? poolInfo.l1TokenAddress : poolInfo.l2TokenAddress;



    const formatNumber = (value,limit) => {
      const limits = limit || 2;
      return formatLargeNumber(Number(logAmount(value, decimals, limits)))
    }

    const tableOptions = [
      { content: <IconLabel token={{ name, symbol, address, chainId, decimals }} />, width:225 },
      { content: <Text> {formatNumber(poolInfo.tokenBalance)}</Text>,width:145 },
      { content: <Text> {formatNumber(poolInfo.userDepositAmount)} </Text>,width:115 },
      { content: <AprLabel>{`${logAmount(poolInfo.APR, 0, 2)}`}</AprLabel>, width:85 },
      { content: <Text> {userInfo.amount ? `${logAmount(userInfo.amount, decimals, 2)}` : `0`}</Text>, width:90 },
      { content: <> <Text>{ userReward ? `${logAmount(userReward, decimals, 5)}` : `0`}</Text>
          <Box
            disabled={disabled}
            sx={{ display: 'flex', cursor: 'pointer', color: "#0ebf9a", transform: dropDownBox ? "rotate(-180deg)" : "" }}
          >
            {accountEnabled ? <ExpandMoreIcon /> : <></>}
          </Box>
        </>, 
        width:110
      }
    ];

    if (showAll === false) {
      if (Number(logAmount(poolInfo.tokenBalance, decimals, 2)) > 0.001) {
        return null
      }
    }

    if (showStakesOnly === true) {
      if (Number(logAmount(userInfo.amount, decimals, 2)) < 0.001) {
        return null
      }
    }

    let enableReward = false
    if (Number(logAmount(userReward, decimals, 3)) >= 0.001) {
      enableReward = true
    }

    return (
      <S.Wrapper
        onClick={() => {
          this.setState({ dropDownBox: !dropDownBox, dropDownBoxInit: false }) }
        }
      >
        {pageLoading ? (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress color="secondary" />
          </Box>
        ) : (
          <TableContent options={tableOptions} mobileOptions={[0,3]}/>
        )}


        {dropDownBox ? (
          <Fade in={dropDownBox}>
            <S.DropdownContent>
              <S.DropdownWrapper>
                <Typography sx={{ flex: 1, display:'inline-flex' }} variant="body2" component="div">Earned</Typography>
                <Typography sx={{ flex: 1 }} variant="body2" component="div" color="secondary">{logAmount(userReward, decimals, 5)}</Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  disabled={logAmount(userReward, decimals) === '0' || disabled || !enableReward}
                  onClick={() => { this.handleHarvest() }}
                  loading={loading}
                  sx={{ flex: 1 }}
                >
                  Harvest
                </Button>
              </S.DropdownWrapper>

              <S.DropdownWrapper>
                {logAmount(userInfo.amount, decimals) === '0' ?
                  <>
                    <Typography sx={{ flex: 1, display:'inline-flex' }} variant="body2" component="div">Staked</Typography>
                    <Typography sx={{ flex: 1 }} variant="body2" component="div" color="secondary">0.00</Typography>
                    <Button
                      variant="outlined"
                      onClick={() => { this.handleStakeToken() }}
                      disabled={disabled}
                      fullWidth
                      sx={{ flex: 1 }}
                    >
                      Stake
                    </Button>
                  </> :
                  <>
                    <Typography variant="body2" component="div">Staked</Typography>
                    <Typography variant="body2" component="div" color="secondary">{logAmount(userInfo.amount, decimals, 2)}</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <Button variant="contained" disabled={disabled} onClick={() => { !disabled && this.handleWithdrawToken() }}>
                        Unstake
                      </Button>
                      <Button variant="contained" disabled={disabled} onClick={() => { !disabled && this.handleStakeToken() }}>
                        Stake More
                      </Button>
                    </Box>
                  </>
                }
              </S.DropdownWrapper>
            </S.DropdownContent>
          </Fade>
        ) : null}

      </S.Wrapper>
    )
  }
}

const mapStateToProps = state => ({
  earn: state.earn,
})

export default connect(mapStateToProps)(ListEarn)