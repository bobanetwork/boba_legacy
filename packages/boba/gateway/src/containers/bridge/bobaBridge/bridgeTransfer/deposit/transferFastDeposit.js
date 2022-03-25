/*
Copyright 2019-present OmiseGO Pte Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import BN from 'bignumber.js';

import { closeModal, openAlert, openError, openModal } from 'actions/uiAction';
import { approveERC20, depositL1LP } from 'actions/networkAction';
import {
  fetchFastDepositCost,
  fetchL1FeeBalance,
  fetchL2FeeRateN,
  fetchL2LPBalance,
  fetchL2LPLiquidity,
  fetchL2LPPending,
  fetchL2TotalFeeRate
} from 'actions/balanceAction';
import { resetToken } from 'actions/bridgeAction';

import {
  selectFastDepositCost,
  selectL1FeeBalance,
  selectL2FeeBalance,
  selectL2FeeRateN,
  selectL2LPBalanceString,
  selectL2LPLiquidity,
  selectL2LPPendingString
} from 'selectors/balanceSelector';
import { selectLoading } from 'selectors/loadingSelector';
import { selectSignatureStatus_depositLP } from 'selectors/signatureSelector';

import Button from 'components/button/Button';

import networkService from 'services/networkService';

import { logAmount } from 'util/amountConvert';

function TransferFastDeposit({
  token
}) {

  console.log(['TRANSFER FAST DEPOSIT'])
  const [ validValue, setValidValue ] = useState(false);
  const [ LPRatio, setLPRatio ] = useState(0)
  const dispatch = useDispatch();

  const allAddresses = networkService.getAllAddresses()

  const cost = useSelector(selectFastDepositCost)
  const LPBalance = useSelector(selectL2LPBalanceString)
  const LPPending = useSelector(selectL2LPPendingString)
  const LPLiquidity = useSelector(selectL2LPLiquidity)
  const feeRateN = useSelector(selectL2FeeRateN)

  const depositLoading = useSelector(selectLoading([ 'DEPOSIT/CREATE' ]))
  const signatureStatus = useSelector(selectSignatureStatus_depositLP)

  const feeBalance = useSelector(selectL1FeeBalance)
  const lpUnits = logAmount(LPBalance, token.decimals)

  const balanceSubPending = lpUnits - logAmount(LPPending, token.decimals) //subtract the in flight exits

  console.log(['DEPOSIT COST',cost])
  console.log(['DEPOSIT FEEBALANCE',feeBalance])
  //ok, we are on L1, but the funds will be paid out on l2
  //goal now is to find out as much as we can about the state of the l2 pools...
  useEffect(() => {
    if (typeof(token) !== 'undefined') {
      dispatch(fetchL2LPBalance(token.addressL2))
      dispatch(fetchL2LPLiquidity(token.addressL2))
      dispatch(fetchL2LPPending(token.addressL1)) //lookup is, confusingly, via L1 token address
      dispatch(fetchL2TotalFeeRate())
      dispatch(fetchL2FeeRateN(token.addressL2))
      dispatch(fetchFastDepositCost(token.address))
      dispatch(fetchL1FeeBalance()) //ETH balance for paying gas
      return ()=>{
        dispatch({type: 'BALANCE/L2/RESET'})
      }
    }
  }, [ token, dispatch ])

  useEffect(() => {
    const lbl = Number(logAmount(LPLiquidity, token.decimals))
    if(lbl > 0){
      const lbp = Number(logAmount(LPBalance, token.decimals))
      const LPR = lbp / lbl
      setLPRatio(Number(LPR).toFixed(3))
    }
  }, [ LPLiquidity, LPBalance, token.decimals ])



  useEffect(() => {
    const maxValue = logAmount(token.balance, token.decimals);
    const tooSmall = new BN(token.amount).lte(new BN(0.0))
    const tooBig = new BN(token.amount).gt(new BN(maxValue))
    console.group(['VALIDATE'])
    if (tooSmall || tooBig) {
      console.log(`SMALL & BIG`)
      setValidValue(false)
    } else if (token.symbol === 'ETH' && (Number(cost) + Number(token.amount)) > Number(feeBalance)) {
      //insufficient ETH to cover the ETH amount plus gas
      console.log(`INSUF ETH for amount + gas`)
      setValidValue(false)
    } else if ((Number(cost) > Number(feeBalance))) {
      console.log(`INSUF ETH for gas`)
      //insufficient ETH to pay gas
      setValidValue(false)
    } else if (Number(LPRatio) < 0.1) {
      //not enough balance/liquidity ratio
      //we always want some balance for unstaking
      setValidValue(false)
      console.log(`B/L ratio is less`);
    } else if (Number(token.amount) > Number(balanceSubPending) * 0.9) {
      console.log(`NOT enough absolute balance`);
      //not enough absolute balance
      //we don't want one large bridge to wipe out the entire balance
      //NOTE - this logic still allows bridgers to drain the entire pool, but just more slowly than before
      //this is because the every time someone exits, the limit is recalculated
      //via Number(LPBalance) * 0.9, and LPBalance changes over time
      setValidValue(false)
    } else {
      //Whew, finally!
      setValidValue(true)
    }
    console.groupEnd(['VALIDATE'])

  }, [ token, setValidValue, cost, LPRatio, balanceSubPending, feeBalance, ])

  const receivableAmount = (value) => {
    return (Number(value) * ((100 - Number(feeRateN)) / 100)).toFixed(3)
  }
  useEffect(() => {
    if (signatureStatus && depositLoading) {
      //we are all set - can close the window
      //transaction has been sent and signed
      dispatch(closeModal('transferPending'));
      dispatch(resetToken());
    }
  }, [ signatureStatus, depositLoading, dispatch ])


  const doFastDeposit = async () => {
    dispatch(openModal('transferPending'));
    let res;
    if(token.symbol === 'ETH') {
      console.log(["ETH Fast Bridge"])
      res = await dispatch(depositL1LP(token.address, token.toWei_String))

      if (res) {
        dispatch(
          openAlert(
            `ETH was bridged. You will receive approximately
            ${((Number(token.amount) * (100 - Number(feeRateN)))/100).toFixed(3)}
            ETH on L2`
          )
        )
        dispatch(closeModal('transferPending'));
        dispatch(resetToken());
        return
      }

    } else {
      //at this point we know it's not ETH
      console.log("ERC20 Fast Bridge")

      res = await dispatch(
        approveERC20(
          token.toWei_String,
          token.address,
          allAddresses.L1LPAddress
        )
      )

      if(res === false) {
        dispatch(openError('Failed to approve amount or user rejected signature'))
        dispatch(closeModal('transferPending'));
        dispatch(resetToken());
        return
      }

      res = await dispatch(
        depositL1LP(token.address, token.toWei_String)
      )

      if (res) {
        dispatch(
          openAlert(
            `${token.symbol} was bridged to the L1LP. You will receive approximately
            ${receivableAmount(token.amount)} ${token.symbol} on L2`
          )
        )
        dispatch(closeModal('transferPending'));
        dispatch(resetToken());
        return
      }
    }
  }

  return <Button
    color="primary"
    variant="contained"
    tooltip={"Click here to bridge your funds to L2"}
    triggerTime={new Date()}
    onClick={doFastDeposit}
    disabled={!validValue}
    fullWidth={true}
  >Transfer</Button>
};

export default React.memo(TransferFastDeposit);
