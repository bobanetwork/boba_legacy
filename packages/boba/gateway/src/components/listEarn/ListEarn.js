import React, { useEffect, useState } from 'react'
import { connect, useDispatch  } from 'react-redux';

import { logAmount, powAmount, formatLargeNumber } from 'util/amountConvert';
import { BigNumber } from 'ethers';

import { openAlert, openModal } from 'actions/uiAction';
import { Fade } from '@mui/material';

import {
  getEarnInfo,
  updateStakeToken,
  updateWithdrawToken,
} from 'actions/earnAction'


import networkService from 'services/networkService'

import * as S from "./ListEarn.styles"
import { getAllAddresses, getReward } from 'actions/networkAction';

import { Typography } from 'components/global/typography'
import { AprLabel } from 'components/global/label'
import { IconLabel } from 'components/global/IconLabel'
import { TableContent } from 'components/global/table'
import { Button } from 'components/global/button'
import { Svg } from 'components/global/svg'
import DotsIcon from 'images/icons/actions.svg'

const ListEarn = (props) => {
  const {
    poolInfo,
    userInfo,
    L1orL2Pool,
    balance,
    showAll,
    showStakesOnly,
    accountEnabled,
    chainId
  } = props;

  const [state, setState] = useState({
    balance,
    L1orL2Pool,
    chainId,
    poolInfo,
    userInfo,
    showAll,
    showStakesOnly,
    dropDownBox: false,
    dropDownBoxInit: true,
    loading: false,
    accountEnabled,
  });

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getAllAddresses());
  }, [dispatch]);

  useEffect(() => {
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
      if (config[key] !== state[key]) {
        setState((prevState) => ({
          ...prevState,
          [key]: config[key]
        }));
      }
    });
  }, [
    chainId,
    poolInfo,
    userInfo,
    balance,
    showAll,
    showStakesOnly,
    accountEnabled,
    state,
  ])

  const handleStakeToken = async () => {
    const { poolInfo, L1orL2Pool, balance } = state;
    const { allAddresses } = props.earn;
    const updatedToken = {
      symbol: poolInfo.symbol,
      currency:
        L1orL2Pool === 'L1LP'
          ? poolInfo.l1TokenAddress
          : poolInfo.l2TokenAddress,
      LPAddress:
        L1orL2Pool === 'L1LP'
          ? allAddresses.L1LPAddress
          : allAddresses.L2LPAddress,
      L1orL2Pool,
      balance,
      decimals: poolInfo.decimals,
    }
    dispatch(updateStakeToken(updatedToken))

    dispatch(openModal('EarnDepositModal'));
  };


  const handleWithdrawToken = async () => {
    const { poolInfo, L1orL2Pool, balance } = state;
    const { allAddresses } = props.earn;
    const updatedToken = {
      symbol: poolInfo.symbol,
      currency:
        L1orL2Pool === 'L1LP'
          ? poolInfo.l1TokenAddress
          : poolInfo.l2TokenAddress,
      LPAddress:
        L1orL2Pool === 'L1LP'
          ? allAddresses.L1LPAddress
          : allAddresses.L2LPAddress,
      L1orL2Pool,
      balance,
      decimals: poolInfo.decimals,
    }
    dispatch(updateWithdrawToken(updatedToken))

    dispatch(openModal('EarnWithdrawModal'));
  };

  const handleHarvest = async () => {
    const { poolInfo, L1orL2Pool, userInfo } = state;
    setState({ ...state, loading: true });

    const userReward = BigNumber.from(userInfo.pendingReward).add(
        BigNumber.from(userInfo.amount)
          .mul(BigNumber.from(poolInfo.accUserRewardPerShare))
          .div(BigNumber.from(powAmount(1, 12)))
          .sub(BigNumber.from(userInfo.rewardDebt))
      )
    .toString()

    const getRewardTX = await dispatch(
      getReward(
        L1orL2Pool === 'L1LP'
          ? poolInfo.l1TokenAddress
          : poolInfo.l2TokenAddress,
        userReward,
        L1orL2Pool
      )
    );

    if (getRewardTX) {
      dispatch(
        openAlert(
          `${logAmount(userReward, poolInfo.decimals, 2)} ${
            poolInfo.symbol
          } was added to your account`
        )
      )
      dispatch(getEarnInfo());
      setState({ ...state, loading: false });
    } else {
      setState({ ...state, loading: false });
    }
  };

  const pageLoading = Object.keys(poolInfo).length === 0

  let userReward = 0;

  if (
    Object.keys(userInfo).length &&
    Object.keys(poolInfo).length &&
    accountEnabled
  ) {
    userReward = BigNumber.from(userInfo.pendingReward).add(
        BigNumber.from(userInfo.amount)
        .mul(BigNumber.from(poolInfo.accUserRewardPerShare))
        .div(BigNumber.from(powAmount(1, 12)))
        .sub(BigNumber.from(userInfo.rewardDebt))
    ).toString()
  }

  const disabled = !L1orL2Pool?.includes(networkService.L1orL2)
  const symbol = poolInfo.symbol
  const name = poolInfo.name
  const decimals = poolInfo.decimals
  const address =
    L1orL2Pool === 'L1LP' ? poolInfo.l1TokenAddress : poolInfo.l2TokenAddress

  const formatNumber = (value, limit) => {
    const limits = limit || 2;
    return formatLargeNumber(Number(logAmount(value, decimals, limits)))
  }

  const tableOptions = [
    {
      content: (
        <IconLabel token={{ name, symbol, address, chainId, decimals }} />
      ),
      width: 225,
    },
    {
      content: (
        <Typography variant="body2">
          {' '}
          {formatNumber(poolInfo.tokenBalance)}
        </Typography>
      ),
      width: 145,
    },
    {
      content: (
        <Typography variant="body2">
          {' '}
          {formatNumber(poolInfo.userDepositAmount)}{' '}
        </Typography>
      ),
      width: 115,
    },
    {
      content: <AprLabel>{`${logAmount(poolInfo.APR, 0, 2)}`}</AprLabel>,
      width: 85,
    },
    {
      content: (
        <Typography variant="body2">
          {userInfo.amount ? `${logAmount(userInfo.amount, decimals, 2)}` : `0`}
        </Typography>
      ),
      width: 90,
    },
    {
      content: (
        <>
          <Typography variant="body2">
            {userReward ? `${logAmount(userReward, decimals, 5)}` : `0`}
          </Typography>
      </>),
      width:110
    },
    {
      content: (
        <S.SvgContianer>
          <Svg src={DotsIcon} />
        </S.SvgContianer>
      ),
      width:75
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
        setState({ dropDownBox: !state.dropDownBox, dropDownBoxInit: false }) }
      }
    >

      <TableContent options={tableOptions} mobileOptions={[0,3]}/>
      {state.dropDownBox ? (
        <Fade in={state.dropDownBox}>
          <S.DropdownContent>
            <S.DropdownWrapper>
              <>
                <Button
                  onClick={() => {
                    handleStakeToken()
                  }}
                  disabled={disabled}
                  label="Stake"
                />

                <Button
                  disabled={
                    logAmount(userReward, decimals) === '0' ||
                    disabled ||
                    !enableReward
                  }
                  onClick={() => {
                    handleHarvest()
                  }}
                  loading={state.loading}
                  label="Harvest"
                />

                <Button
                  disabled={disabled}
                  onClick={() => {
                    !disabled && handleWithdrawToken()
                  }}
                  label="Unstake"
                />
              </>
            </S.DropdownWrapper>
          </S.DropdownContent>
        </Fade>
      ) : null}

    </S.Wrapper>
  )
}


const mapStateToProps = state => ({
  earn: state.earn,
})

export default connect(mapStateToProps)(ListEarn)