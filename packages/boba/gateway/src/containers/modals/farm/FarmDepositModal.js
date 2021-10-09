import React from 'react';
import { connect } from 'react-redux';
import { isEqual } from 'lodash';
import BN from 'bignumber.js';

import { closeModal, openAlert, openError } from 'actions/uiAction';
import { getFarmInfo } from 'actions/farmAction';

import Button from 'components/button/Button';
import Modal from 'components/modal/Modal';
import Input from 'components/input/Input';
import { logAmount, powAmount, toWei_String } from 'util/amountConvert';

import networkService from 'services/networkService';

import { Typography } from '@material-ui/core';
import { WrapperActionsModal } from 'components/modal/Modal.styles';
import { Box } from '@material-ui/system';
import { farmL1, farmL2 } from 'actions/networkAction';

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
      approvedAllowance: '',
      // loading
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
      let approvedAllowance = powAmount(10, 50)
      // Set to some very big number
      // There is no need to query allowance for depositing ETH
      if (stakeToken.currency !== networkService.L1_ETH_Address) {
        approvedAllowance = await networkService.checkAllowance(
          stakeToken.currency,
          stakeToken.LPAddress
        )
        approvedAllowance = approvedAllowance.toString()
      }

      this.setState({ approvedAllowance, stakeToken })
    }

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
      let approvedAllowance = powAmount(10, 50)
      // There is no need to query allowance for depositing ETH
      if (stakeToken.currency !== networkService.L1_ETH_Address) {
        approvedAllowance = await networkService.checkAllowance(
          stakeToken.currency,
          stakeToken.LPAddress
        )
        approvedAllowance = approvedAllowance.toString()
      }

      this.setState({ approvedAllowance, loading: false })
    } else {
      this.setState({ loading: false })
    }
  }

  async handleConfirm() {

    const { stakeToken, value_Wei_String } = this.state

    this.setState({ loading: true })

    const addLiquidityTX = await networkService.addLiquidity(
      stakeToken.currency,
      value_Wei_String,
      stakeToken.L1orL2Pool,
    )

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
      approvedAllowance,
      loading,
    } = this.state


    let allowanceGTstake = false

    if ( Number(approvedAllowance) > 0 &&
         Number(stakeValue) > 0 &&
         new BN(approvedAllowance).gte(powAmount(stakeValue, stakeToken.decimals))
    ) {
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

        {!allowanceGTstake &&
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
            <Typography variant="body2" sx={{mt: 2}}>
              Your allowance has been approved. You can now stake your funds into the pool.
            </Typography>
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
