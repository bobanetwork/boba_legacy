import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { isEqual } from 'util/lodash';

import { closeModal, openAlert } from 'actions/uiAction'
import { addLiquidity, getEarnInfo, fetchAllowance } from 'actions/earnAction'

import Button from 'components/button/Button'
import Modal from 'components/modal/Modal'
import Input from 'components/input/Input'

import { powAmount, toWei_String } from 'util/amountConvert'
import BN from 'bignumber.js'

import { Box, Typography } from '@mui/material'
import { WrapperActionsModal } from 'components/modal/styles'

import { earnL1, earnL2 } from 'actions/networkAction'
import networkService from 'services/networkService'
import { BigNumber, utils } from 'ethers'
import { NETWORK } from 'util/network/network.util'
import {
  selectEarn,
  selectBobaFeeChoice,
  selectLayer,
  selectBobaPriceRatio,
  selectApprovedAllowance,
} from 'selectors'

const EarnDepositModal = (props) => {
  const dispatch = useDispatch()
  const { stakeToken } = useSelector(selectEarn())
  const bobaFeeChoice = useSelector(selectBobaFeeChoice())
  const netLayer = useSelector(selectLayer())
  const bobaFeePriceRatio = useSelector(selectBobaPriceRatio())
  const { approvedAllowance } = useSelector(selectApprovedAllowance())

  const { open } = props;

  const [EarnDepositModalState, setEarnDepositModalState] = useState({
    open,
    stakeValue: '',
    stakeValueValid: false,
    value_Wei_String: '',
    loading: false,
    netLayerNativeToken:
      networkService.networkGateway === NETWORK.ETHEREUM
        ? 'ETH'
        : netLayer === 'L1'
        ? networkService.L1NativeTokenSymbol
        : 'BOBA',
    max_Wei_String: '0',
    max_Float_String: '0.0',
    fee: '0',
  });

  useEffect(() => {
    getMaxTransferValue();
  }, []);

  useEffect(() => {
    if (EarnDepositModalState.open !== open) {
      setEarnDepositModalState((prevState) => ({
        ...prevState,
        open,
      }));
    }
  }, [open]);



  useEffect(() => {
    if (stakeToken) {
      if (stakeToken.symbol !== EarnDepositModalState.netLayerNativeToken) {
        dispatch(fetchAllowance(stakeToken.currency, stakeToken.LPAddress))
      } else {
        dispatch({
          type: 'FETCH/ALLOWANCE/RESET',
          payload: powAmount(10, 50),
        });
      }
      setEarnDepositModalState((prevState) => ({
        ...prevState,
      }));
      getMaxTransferValue();
    }
  }, [stakeToken]);


   useEffect(() => {
    return () => {
      dispatch({
        type: 'FETCH/ALLOWANCE/RESET',
        payload: '',
      });
    };
  }, []);

  const getMaxTransferValue = async () => {
    let max_BN = BigNumber.from(stakeToken.balance.toString())

    if (netLayer === 'L2') {
      const cost_BN = await networkService.liquidityEstimate(
        stakeToken.currency
      )

      // Rest of the logic remains the same, but we update the state using 'setState'

      // if the max amount is less than the gas,
      // set the max amount to zero
      if (max_BN.lt(BigNumber.from('0'))) {
        max_BN = BigNumber.from('0');
      }

      setEarnDepositModalState((prevState) => ({
        ...prevState,
        max_Float_String: utils.formatUnits(
          max_BN,
          stakeToken.decimals
        ),
        fee: bobaFeeChoice && networkService.networkGateway === NETWORK.ETHEREUM
            ? utils.formatUnits(
                cost_BN.mul(
                  BigNumber.from(bobaFeePriceRatio)
                ),
                stakeToken.decimals
              )
            : utils.formatUnits(
                cost_BN,
                stakeToken.decimals
              ),
      }));
    } else {
      setEarnDepositModalState((prevState) => ({
        ...prevState,
        max_Float_String: utils.formatUnits(
          max_BN,
          stakeToken.decimals
        ),
      }));
    }
  };


  const handleClose = () => {
    dispatch(closeModal('EarnDepositModal'))
  };

  const handleStakeValue = (value) => {

    if (
      value &&
      Number(value) > 0.0 &&
      Number(value) <= Number(EarnDepositModalState.max_Float_String)
    ) {
      setEarnDepositModalState((prevState) => ({
        ...prevState,
        stakeValue: value,
        stakeValueValid: true,
        value_Wei_String: toWei_String(value, stakeToken.decimals),
      }));
    } else {
      setEarnDepositModalState((prevState) => ({
        ...prevState,
        stakeValue: value,
        stakeValueValid: false,
        value_Wei_String: '',
      }));
    }
  };

  const handleApprove = async () => {

    setEarnDepositModalState((prevState) => ({
      ...prevState,
      loading: true,
    }));

    let approveTX;

    if (stakeToken.L1orL2Pool === 'L2LP') {
      approveTX = await dispatch(
        earnL2(EarnDepositModalState.value_Wei_String, stakeToken.currency)
      )
    } else if (stakeToken.L1orL2Pool === 'L1LP') {
      approveTX = await dispatch(earnL1(EarnDepositModalState.value_Wei_String, stakeToken.currency));
    }

    if (approveTX) {
      dispatch(openAlert('Amount was approved'));
      dispatch(fetchAllowance(stakeToken.currency, stakeToken.LPAddress));
    }

    setEarnDepositModalState((prevState) => ({
      ...prevState,
      loading: false,
    }));
  };

  const handleConfirm = async () => {

    setEarnDepositModalState((prevState) => ({
      ...prevState,
      loading: true,
    }));

    const addLiquidityTX = await dispatch(
      addLiquidity(
        stakeToken.currency,
        EarnDepositModalState.value_Wei_String,
        stakeToken.L1orL2Pool
      )
    )

    if (addLiquidityTX) {
      dispatch(openAlert('Your liquidity was added'));
      dispatch(getEarnInfo());
    }

    setEarnDepositModalState((prevState) => ({
      ...prevState,
      loading: false,
      stakeValue: '',
      value_Wei_String: '',
    }));

    dispatch(closeModal('EarnDepositModal'));
  };




  let allowanceGTstake = false;

  if (
    Number(approvedAllowance) > 0 &&
    Number(EarnDepositModalState.stakeValue) > 0 &&
    new BN(approvedAllowance).gte(
      powAmount(
        EarnDepositModalState.stakeValue,
        stakeToken.decimals
      )
    )
  ) {
    allowanceGTstake = true;
  } else if (
    Number(EarnDepositModalState.stakeValue) > 0 &&
    stakeToken.symbol === EarnDepositModalState.netLayerNativeToken
  ) {
    //do not need to approve ETH
    allowanceGTstake = true;
  }

  // Calculate allowUseAll
  const allowUseAll = netLayer === 'L2' ? true : false;

  return (
    <Modal
      open={open}
      maxWidth="md"
      onClose={() => {
        handleClose()
      }}
    >
      <Box>
        <Typography variant="h2" sx={{ fontWeight: 700, mb: 3 }}>
          Stake {`${stakeToken.symbol}`}
        </Typography>

        <Input
          placeholder={`Amount to stake`}
          value={EarnDepositModalState.stakeValue}
          type="number"
          unit={stakeToken.symbol}
          maxValue={EarnDepositModalState.max_Float_String}
          onChange={(i) => {
            handleStakeValue(i.target.value)
          }}
          onUseMax={(i) => {
            handleStakeValue(EarnDepositModalState.max_Float_String)
          }}
          allowUseAll={allowUseAll}
          newStyle
          variant="standard"
        />

        {netLayer === 'L2' && bobaFeeChoice && EarnDepositModalState.fee &&
          <Typography variant="body2" sx={{ mt: 2 }}>
            Fee: {EarnDepositModalState.fee} BOBA
          </Typography>
        }

        {netLayer === 'L2' && !bobaFeeChoice && EarnDepositModalState.fee &&
          <Typography variant="body2" sx={{ mt: 2 }}>
            Fee: {EarnDepositModalState.fee} {networkService.L1NativeTokenSymbol}
          </Typography>
        }
      </Box>

      {!allowanceGTstake && stakeToken.symbol !== EarnDepositModalState.netLayerNativeToken &&
        <>
          {EarnDepositModalState.stakeValueValid &&
            <Typography variant="body2" sx={{ mt: 2 }}>
              To stake {EarnDepositModalState.stakeValue} {stakeToken.symbol}, you first need to
              approve this amount.
            </Typography>
          }
          <WrapperActionsModal>
            <Button
              onClick={() => { handleClose() }}
              variant='outlined'
              color='primary'
              size='large'
            >
              Cancel
            </Button>
            <Button
              onClick={() => { handleApprove() }}
              loading={EarnDepositModalState.loading}
              disabled={!EarnDepositModalState.stakeValueValid}
              color='primary'
              size="large"
              variant="contained"
            >
              Approve amount
            </Button>
          </WrapperActionsModal>
        </>
      }

      {EarnDepositModalState.stakeValueValid && EarnDepositModalState.allowanceGTstake &&
        <>
          {stakeToken.symbol !== EarnDepositModalState.netLayerNativeToken &&
            <Typography variant="body2" sx={{ mt: 2 }}>
              Your allowance has been approved. You can now stake your funds.
            </Typography>
          }
          <WrapperActionsModal>
            <Button
                onClick={() => {
                  handleClose()
                }}
              variant='outlined'
              color='primary'
              size='large'
            >
              Cancel
            </Button>
            <Button
              onClick={() => { handleConfirm() }}
              loading={EarnDepositModalState.loading}
              disabled={false}
              color='primary'
              size="large"
              variant="contained"
            >
              Stake!
            </Button>
          </WrapperActionsModal>
        </>
      }

    </Modal>
  )
}



export default EarnDepositModal
