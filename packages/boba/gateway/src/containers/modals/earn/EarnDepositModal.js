import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { closeModal, openAlert } from 'actions/uiAction'
import { addLiquidity, getEarnInfo, fetchAllowance } from 'actions/earnAction'

import Modal from 'components/modal/Modal'

import { powAmount, toWei_String } from 'util/amountConvert'
import BN from 'bignumber.js'

import { Box, Typography } from '@mui/material'
import { WrapperActionsModal } from 'components/modal/styles'

import { earnL1, earnL2 } from 'actions/networkAction'
import networkService from 'services/networkService'
import { BigNumber, utils } from 'ethers'
import { NETWORK } from 'util/network/network.util'
import { MaxInput } from 'components/global/InputMax'
import { Button } from 'components/global/button'

import {
  selectStakeToken,
  selectBobaFeeChoice,
  selectLayer,
  selectBobaPriceRatio,
  selectApprovedAllowance,
} from 'selectors'

const EarnDepositModal = (props) => {
  const dispatch = useDispatch()
  const stakeToken = useSelector(selectStakeToken())
  const bobaFeeChoice = useSelector(selectBobaFeeChoice())
  const netLayer = useSelector(selectLayer())
  const bobaFeePriceRatio = useSelector(selectBobaPriceRatio())
  const approvedAllowance  = useSelector(selectApprovedAllowance())

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


  const updateEarnDepositModalState = (max_BN, cost_BN, stakeToken) => {
    const newState = {
      ...EarnDepositModalState,
      max_Float_String: utils.formatUnits(max_BN, stakeToken.decimals),
    };

    if (netLayer === 'L2') {
      // If the max amount is less than the gas, set the max amount to zero
      if (max_BN.lt(BigNumber.from('0'))) {
        max_BN = BigNumber.from('0');
      }

      newState.fee = bobaFeeChoice && networkService.networkGateway === NETWORK.ETHEREUM
          ? utils.formatUnits(
              cost_BN.mul(BigNumber.from(bobaFeePriceRatio)),
              stakeToken.decimals
            )
          : utils.formatUnits(cost_BN, stakeToken.decimals)
    }

    setEarnDepositModalState(newState);
  };

  const getMaxTransferValue = async () => {
    const max_BN = BigNumber.from(stakeToken.balance.toString())

    if (netLayer === 'L2') {
      const cost_BN = await networkService.liquidityEstimate(
        stakeToken.currency
      )
      updateEarnDepositModalState(max_BN, cost_BN, stakeToken);
    } else {
      updateEarnDepositModalState(max_BN, null, stakeToken);
    }
  };

  const handleClose = () => {
    dispatch(closeModal('EarnDepositModal'))
  };

  const handleStakeValue = (value) => {
    const isValid =
      value &&
      Number(value) > 0.0 &&
      Number(value) <= Number(EarnDepositModalState.max_Float_String)

    const newState = {
      ...EarnDepositModalState,
      stakeValue: value,
      stakeValueValid: isValid,
      value_Wei_String: isValid ? toWei_String(value, stakeToken.decimals) : '',
    };

    setEarnDepositModalState(newState);
  };

  const changeLoading = (status) =>
    setEarnDepositModalState((prevState) => ({
    ...prevState,
    loading: status,
  }))

  const handleApprove = async () => {
    try {
      const { L1orL2Pool, value_Wei_String, currency, LPAddress } = stakeToken;

      dispatch(changeLoading(true));

      const approveTX = await dispatch(
        L1orL2Pool === 'L2LP'
          ? earnL2(value_Wei_String, currency)
          : earnL1(value_Wei_String, currency)
      );

      if (approveTX) {
        dispatch(openAlert('Amount was approved'));
        dispatch(fetchAllowance(currency, LPAddress));
      }
    } catch (error) {
      console.log(error)
    } finally {
      dispatch(changeLoading(false));
    }
  };

  const handleConfirm = async () => {
    changeLoading(true)

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
      stakeValue: '',
      value_Wei_String: '',
    }));

    changeLoading(false);
    dispatch(closeModal('EarnDepositModal'));
  };



  let allowanceGTstake = false
  const allowance = Number(approvedAllowance);
  const stakeValue = Number(EarnDepositModalState.stakeValue);
  const isETH = stakeToken.symbol === EarnDepositModalState.netLayerNativeToken;

  if (
    (allowance > 0 &&
      stakeValue > 0 &&
      new BN(allowance).gte(powAmount(stakeValue, stakeToken.decimals))) ||
    (stakeValue > 0 && isETH)
  ) {
    allowanceGTstake = true;
  }

  const allowUseAll = netLayer === 'L2' ? true : false;

  return (
    <Modal
      open={open}
      maxWidth="md"
      onClose={() => {
        handleClose()
      }}
      title={`Stake ${stakeToken.symbol}`}
    >
      <Box>

        <MaxInput
          max={EarnDepositModalState.max_Float_String}
          placeholder={`Amount to stake`}
          initialValue={EarnDepositModalState.stakeValue}
          onValueChange={(val) => {
            handleStakeValue(val)
          }}
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
                onClick={() => {
                  handleApprove()
                }}
                loading={EarnDepositModalState.loading}
                disabled={!EarnDepositModalState.stakeValueValid}
                label="Approve amount"
            />
            <Button
                onClick={() => {
                  handleClose()
                }}
                label="Cancel"
                transparent
            />
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
              Stake
            </Button>
          </WrapperActionsModal>
        </>
      }

    </Modal>
  )
}

export default EarnDepositModal
