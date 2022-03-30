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
import { fetchFastDepositBatchCost, fetchL1FeeBalance, fetchL2TotalFeeRate, fetchUserAndL2LPBalanceBatch } from 'actions/balanceAction';
import { resetToken } from 'actions/bridgeAction';
import { approveFastDepositBatch, depositL1LPBatch } from 'actions/networkAction';
import { closeModal, openAlert, openError, openModal } from 'actions/uiAction';
import BN from 'bignumber.js';
import { Typography, Box } from '@mui/material';
import Button from 'components/button/Button';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectFastDepositBatchCost, selectL2FeeBalance, selectUserAndL2LPBalanceBatch, selectL2FeeRate } from 'selectors/balanceSelector';
import { selectLoading } from 'selectors/loadingSelector';
import { selectSignatureStatus_depositLP } from 'selectors/signatureSelector';
import { logAmount } from 'util/amountConvert';
import BridgeFee from '../fee/bridgeFee';

/*
Transfer Fast Deposit Batch
*/

function TransferFastDepositBatch({
  tokens
}) {


  const dispatch = useDispatch();

  const [ validValue, setValidValue ] = useState(false);

  const feeBalance = useSelector(selectL2FeeBalance)
  const batchInfo = useSelector(selectUserAndL2LPBalanceBatch)
  const batchCost = useSelector(selectFastDepositBatchCost)
  const feeRate = useSelector(selectL2FeeRate)

  const depositLoading = useSelector(selectLoading([ 'DEPOSIT/CREATE' ]))
  // const approvalLoading = useSelector(selectLoading([ 'APPROVE/CREATE' ]))
  const signatureStatus = useSelector(selectSignatureStatus_depositLP)

  const bridgeFeeLabel = `The fee varies between ${feeRate.feeMin} and ${feeRate.feeMax}%.`

  let bridgeFee = '';

  let estReceive = '';

  if (tokens.length) {
    bridgeFee = tokens.map((t, i) => {
      let l2LPFeeRate = 0.1;
      if (t.symbol && batchInfo[ t.symbol ]) {
        l2LPFeeRate = batchInfo[ t.symbol ].l2LPFeeRate;
        return <Typography key={i} component="span" display="block" variant="body2"> {((t.amount ? t.amount : 0) * l2LPFeeRate / 100).toFixed(3)} {t.symbol} ({l2LPFeeRate}%) </Typography>
      }
      return <React.Fragment key={i}></React.Fragment>
    })

    estReceive = tokens.map((t,i) => {
      let l2LPFeeRate = 0.1;
      if (t.symbol && batchInfo[ t.symbol ]) {
        l2LPFeeRate = batchInfo[ t.symbol ].l2LPFeeRate;
        return <Typography key={i} component="span" display="block" variant="body2"> {((t.amount ? t.amount : 0) * (1 - l2LPFeeRate / 100)).toFixed(3)} {t.symbol} </Typography>
      }
      return <React.Fragment key={i}></React.Fragment>
    })
  }

  useEffect(() => {
    dispatch(fetchL2TotalFeeRate())
    dispatch(fetchL1FeeBalance()) //ETH balance for paying gas
    return () => {
      dispatch({ type: 'BALANCE/L2/RESET' })
    }
  }, [ dispatch ])

  useEffect(() => {
    let tokenList = tokens.map((t) => t.symbol)
    dispatch(fetchUserAndL2LPBalanceBatch(tokenList))
    dispatch(fetchFastDepositBatchCost(tokenList))
  }, [ tokens, dispatch ])


  useEffect(() => {
    if (signatureStatus && depositLoading) {
      //we are all set - can close the window
      //transaction has been sent and signed
      dispatch(closeModal('transferPending'));
      dispatch(resetToken());
    }
  }, [ signatureStatus, depositLoading, dispatch ])


  useEffect(() => {
    const ethTokens = tokens.filter(i => i.symbol === 'ETH');
    if (ethTokens.length === 1) {
      // there should be only one input for ETH
      let ethToken = ethTokens[ 0 ];
      if (Number(ethToken.value) + Number(batchCost) > Number(feeBalance)) {
        // WARNING: your L1 ETH balance of ${Number(feeBalance).toFixed(4)} is not sufficient to cover this transaction.
        // THIS TRANSACTION WILL FAIL.`
        setValidValue(false);
      }
      else if ((Number(ethToken.value) + Number(batchCost)) > Number(feeBalance) * 0.96) {
        setValidValue(true);
        // CAUTION: your L1 ETH balance of ${Number(feeBalance).toFixed(4)} is very close to the estimated total.
        // THIS TRANSACTION MIGHT FAIL.`
      }
    } else if (ethTokens.length > 1) {
      // diable the transfer incase of multiple tokens
      setValidValue(false);
    } else {
      if (Number(batchCost) > Number(feeBalance)) {
        // L1 ETH balance is not sufficient to cover tx will fail.
        setValidValue(true);
      } else if (Number(batchCost) > Number(feeBalance) * 0.96) {
        // your L1 ETH balance of ${Number(feeBalance).toFixed(4)} is very close to the estimated cost.
        // tx might fail  It would be safer to have slightly more ETH in your L1 wallet to cover gas.`
        setValidValue(true);
      }
    }


    tokens.forEach((token) => {
      const maxValue = logAmount(token.balance, token.decimals);
      const tooSmall = new BN(token.amount).lte(new BN(0.0))
      const tooBig = new BN(token.amount).gt(new BN(maxValue))

      if (tooSmall || tooBig) {
        setValidValue(false)
      } else if (batchInfo[ token.symbol ]) {
        const LPBalance = batchInfo[ token.symbol ].l2LPBalance
        const LPRatio = batchInfo[ token.symbol ].LPRatio
        if (
          (Number(LPRatio) < 0.10 && Number(token.amount) > Number(LPBalance) * 0.90) ||
          (Number(LPRatio) < 0.10 && Number(token.amount) <= Number(LPBalance) * 0.90) ||
          (Number(LPRatio) >= 0.10 && Number(token.amount) > Number(LPBalance) * 0.90)
        ) {
          setValidValue(false)
        }
      } else {
        setValidValue(true)
      }

    })
  }, [ tokens, batchInfo, batchCost, feeBalance ])

  const doFastDeposit = async () => {
    dispatch(openModal('transferPending'));
    let res;
    const payload = tokens.map(i => ({ ...i, value: i.amount }));
    console.log([ `[FAST DEPOSIT BATCH] > APPROVING..` ])
    res = await dispatch(approveFastDepositBatch(payload));

    if (res === false) {
      dispatch(openError('Failed to approve amount or user rejected signature'))
      dispatch(closeModal('transferPending'));
      dispatch(resetToken());
      return
    }

    console.log([ `[FAST DEPOSIT BATCH] > DEPOSITING..` ])
    res = await dispatch(depositL1LPBatch(payload));

    if (res) {
      dispatch(
        openAlert(
          `Your funds were bridged to the L1LP in batch.`
        )
      )
      dispatch(closeModal('transferPending'));
      dispatch(resetToken());
      return
    }

  }

  return <>
    <BridgeFee
      time="10mins - 3hrs"
      timeLabel="In most cases, a fast bridge takes less than 10 minutes. However, if Ethereum is congested, it can take as long as 3 hours"
      estBridgeFee={bridgeFee}
      estBridgeFeeLabel={bridgeFeeLabel}
      estFee={batchCost ? `${Number(batchCost).toFixed(5)} ETH` : 0}
      estReceive={estReceive}
    />
    <Box>
      {tokens.map(i => i.symbol).includes('OMG') ? <Typography variant="body2" sx={{ mt: 2 }}>
        The OMG Token was minted in 2017 and it does not conform to the ERC20 token standard.
        In some cases, three interactions with MetaMask are needed.
      </Typography> : null}
    </Box>
    <Button
      color="primary"
      variant="contained"
      tooltip={"Click here to bridge your funds to L2"}
      triggerTime={new Date()}
      onClick={doFastDeposit}
      disabled={!validValue}
      fullWidth={true}
    >Multi Bridge</Button>
  </>
};

export default React.memo(TransferFastDepositBatch);
