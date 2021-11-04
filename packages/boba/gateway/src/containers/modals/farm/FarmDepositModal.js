import React from 'react';
import { connect } from 'react-redux';
import { isEqual } from 'lodash';
import BN from 'bignumber.js';

import { closeModal, openAlert, openError } from 'actions/uiAction';
import { addLiquidity, getFarmInfo } from 'actions/farmAction';

import Button from 'components/button/Button';
import Modal from 'components/modal/Modal';
import Input from 'components/input/Input';
import { logAmount, powAmount, toWei_String } from 'util/amountConvert';


import { Typography } from '@material-ui/core';
import { WrapperActionsModal } from 'components/modal/Modal.styles';
import { Box } from '@material-ui/system';
import { farmL1, farmL2 } from 'actions/networkAction';
import {fetchAllowance} from 'actions/farmAction';

class FarmDepositModal extends React.Component {

  constructor(props) {
    super(props);

    const { open } = this.props
    const { stakeToken } = this.props.farm

    this.state = {
      open,
      stakeToken,
      stakeValue: '',
      stakeValueValid: false,
      value_Wei_String: '',
      // allowance
      loading: false,
    }
  }

  async componentDidUpdate(prevState) {

    const { open } = this.props
    const { stakeToken } = this.props.farm

    if (prevState.open !== open) {
      this.setState({ open })
    }

    if (!isEqual(prevState.farm.stakeToken, stakeToken)) {
      
      if ( stakeToken.symbol !== 'ETH' ) {
        this.props.dispatch(fetchAllowance(
          stakeToken.currency,
          stakeToken.LPAddress
        ))
      } else {
        // Set to some very big number to approved allowance in case of ETH.
        // There is no need to query allowance for depositing ETH on the L1 or the L2
        this.props.dispatch({
          type: 'FETCH/ALLOWANCE/RESET',
          payload: powAmount(10, 50)
        })
      }
      this.setState({ stakeToken })
    }

  }

  componentWillUnmount() {
    this.props.dispatch({
      type: 'FETCH/ALLOWANCE/RESET',
      payload: ''
    })
  }

  getMaxTransferValue () {
    const { stakeToken } = this.state
    return logAmount(stakeToken.balance, stakeToken.decimals)
  }

  handleClose() {
    this.props.dispatch(closeModal("farmDepositModal"))
  }

  handleStakeValue(value) {

    const { stakeToken } = this.state

    if( value &&
        Number(value) > 0.0 &&
        Number(value) <= Number(this.getMaxTransferValue())
    ) {
        this.setState({
          stakeValue: value,
          stakeValueValid: true,
          value_Wei_String: toWei_String(value, stakeToken.decimals)
        })
    } else {
      this.setState({
        stakeValue: value,
        stakeValueValid: false,
        value_Wei_String: ''
      })
    }
  }

  async handleApprove() {

    const { stakeToken, value_Wei_String } = this.state

    this.setState({ loading: true })

    let approveTX

    if (stakeToken.L1orL2Pool === 'L2LP') {
      approveTX = await this.props.dispatch(farmL2(
        value_Wei_String,
        stakeToken.currency,
      ))
    }
    else if (stakeToken.L1orL2Pool === 'L1LP') {
      approveTX = await this.props.dispatch(farmL1(
        value_Wei_String,
        stakeToken.currency,
      ))
    }

    if (approveTX) {
      this.props.dispatch(openAlert("Amount was approved"))
      this.props.dispatch(fetchAllowance(
        stakeToken.currency,
        stakeToken.LPAddress
      ))
      this.setState({ loading: false })
    } else {
      this.setState({ loading: false })
    }
  }

  async handleConfirm() {

    const { stakeToken, value_Wei_String } = this.state

    this.setState({ loading: true })

    const addLiquidityTX = await this.props.dispatch(addLiquidity(
      stakeToken.currency,
      value_Wei_String,
      stakeToken.L1orL2Pool,
    ))

    if (addLiquidityTX) {
      this.props.dispatch(openAlert("Your liquidity was added"))
      this.props.dispatch(getFarmInfo())
      this.setState({ loading: false, stakeValue: '', value_Wei_String: ''})
      this.props.dispatch(closeModal("farmDepositModal"))
    } else {
      this.props.dispatch(openError("Failed to add liquidity"))
      this.setState({ loading: false, stakeValue: '', value_Wei_String: ''})
      this.props.dispatch(closeModal("farmDepositModal"))
    }
  }

  render() {

    const {
      open,
      stakeToken,
      stakeValue,
      stakeValueValid,
      //stakeValueBadEntry,
      loading,
    } = this.state

    const {approvedAllowance} = this.props.farm;

    let allowanceGTstake = false

    if ( Number(approvedAllowance) > 0 &&
         Number(stakeValue) > 0 &&
         new BN(approvedAllowance).gte(powAmount(stakeValue, stakeToken.decimals))
    ) {
      allowanceGTstake = true
    }

    //do not need to approve ETH
    if ( Number(stakeValue) > 0 && stakeToken.symbol === 'ETH' ) {
      allowanceGTstake = true
    }

    return (
      <Modal
        open={open}
        maxWidth="md"
        onClose={()=>{this.handleClose()}}
        minHeight="380px"
      >
        <Box>
          <Typography variant="h2" sx={{fontWeight: 700, mb: 3}}>
            Stake {`${stakeToken.symbol}`}
          </Typography>

          <Input
            placeholder={`Amount to stake`}
            value={stakeValue}
            type="number"
            unit={stakeToken.symbol}
            maxValue={this.getMaxTransferValue()}
            onChange={i=>{this.handleStakeValue(i.target.value)}}
            onUseMax={i=>{this.handleStakeValue(this.getMaxTransferValue())}}
            allowUseAll={true}
            newStyle
            variant="standard"
          />
        </Box>

        {!allowanceGTstake && stakeToken.symbol !== 'ETH' &&
          <>
            {stakeValueValid &&
              <Typography variant="body2" sx={{mt: 2}}>
                To stake {stakeValue} {stakeToken.symbol},
                you first need to approve this amount.
              </Typography>
            }
            <WrapperActionsModal>
              <Button
                onClick={()=>{this.handleClose()}}
                color="neutral"
                size="large"
              >
                Cancel
              </Button>
              <Button
                onClick={()=>{this.handleApprove()}}
                loading={loading}
                disabled={!stakeValueValid}
                color='primary'
                size="large"
                variant="contained"
                // fullWidth={isMobile}
              >
                Approve amount
              </Button>
            </WrapperActionsModal>
          </>
        }

        {(stakeValueValid && allowanceGTstake) &&
          <>
            {stakeToken.symbol !== 'ETH' &&
              <Typography variant="body2" sx={{mt: 2}}>
                Your allowance has been approved. You can now stake your funds.
              </Typography>
            }
            <WrapperActionsModal>
              <Button
                onClick={()=>{this.handleClose()}}
                color="neutral"
                size="large"
              >
                Cancel
              </Button>
              <Button
                onClick={()=>{this.handleConfirm()}}
                loading={loading}
                disabled={false}
                color='primary'
                size="large"
                variant="contained"
                // fullWidth={isMobile}
              >
                Stake!
              </Button>
            </WrapperActionsModal>
          </>
        }

      </Modal>
    )
  }
}

const mapStateToProps = state => ({
  ui: state.ui,
  farm: state.farm,
  balance: state.balance,
})

export default connect(mapStateToProps)(FarmDepositModal)
