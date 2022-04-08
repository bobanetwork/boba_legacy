import React from 'react'
import { connect } from 'react-redux'
import { isEqual } from 'lodash'

import { closeModal, openAlert } from 'actions/uiAction'
import { addLiquidity, getFarmInfo } from 'actions/farmAction'

import Button from 'components/button/Button'
import Modal from 'components/modal/Modal'
import Input from 'components/input/Input'

import { logAmount, powAmount, toWei_String } from 'util/amountConvert'
import BN from 'bignumber.js'

import { Box, Typography } from '@mui/material'
import { WrapperActionsModal } from 'components/modal/Modal.styles'

import { farmL1, farmL2 } from 'actions/networkAction'
import { fetchAllowance } from 'actions/farmAction'
import networkService from 'services/networkService'
import { BigNumber, utils } from 'ethers'

class FarmDepositModal extends React.Component {

  constructor(props) {

    super(props)

    const { open } = this.props
    const { stakeToken } = this.props.farm
    const { bobaFeeChoice, netLayer, bobaFeePriceRatio } = this.props.setup

    this.state = {
      open,
      stakeToken,
      stakeValue: '',
      stakeValueValid: false,
      value_Wei_String: '',
      // allowance
      loading: false,
      bobaFeeChoice,
      netLayer,
      bobaFeePriceRatio,
      max_Wei_String: '0',
      max_Float: '0',
    }
  }

  componentDidMount() {
    this.getMaxTransferValue();
  }

  async componentDidUpdate(prevState) {

    const { open } = this.props
    const { stakeToken } = this.props.farm
    const { bobaFeeChoice, netLayer } = this.props.setup

    if (prevState.open !== open) {
      this.setState({ open })
    }

    if (!isEqual(prevState.setup.bobaFeeChoice, bobaFeeChoice)) {
      this.setState({ bobaFeeChoice }, () => this.getMaxTransferValue())
    }

    if (!isEqual(prevState.setup.netLayer, netLayer)) {
      this.setState({ netLayer })
    }

    if (!isEqual(prevState.farm.stakeToken, stakeToken)) {

      if (stakeToken.symbol !== 'ETH') {
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
      this.setState({ stakeToken }, () => this.getMaxTransferValue())
    }

  }

  componentWillUnmount() {
    this.props.dispatch({
      type: 'FETCH/ALLOWANCE/RESET',
      payload: ''
    })
  }

  async getMaxTransferValue() {

    const { stakeToken, bobaFeeChoice, bobaFeePriceRatio, netLayer } = this.state

    let amount = logAmount(stakeToken.balance, stakeToken.decimals)

    // should not be hardcoded - ToDo - lookup actual cost
    // three scenarios -
    // L1 staking ETH
    // L2 staking ETH and paying in ETH
    // L2 staking BOBA and paying in BOBA
    if (netLayer === 'L2') {

      let cost_BN = await networkService.liquidityEstimate(
        stakeToken.currency,
        stakeToken.balance.toString()
      )

      let max_BN = BigNumber.from(stakeToken.balance.toString());

      console.log([ `cost_BN`, cost_BN ]);
      console.log([ `max_BN`, max_BN ]);

      // both ETH and BOBA have 18 decimals so this is safe
      if (stakeToken.symbol === 'ETH') {
        // we are staking ETH and paying in ether token
        // since MetaMask does not know about BOBA, we need to subtract the ETH fee
        // regardless of how we are paying, otherwise will get an error in MetaMask
        max_BN = max_BN.sub(cost_BN)
      }
      else if (stakeToken.symbol === 'BOBA' && bobaFeeChoice) {
        // we are staking BOBA and paying in BOBA
        // so need to subtract the BOBA fee
        max_BN = max_BN.sub(cost_BN.mul(BigNumber.from(bobaFeePriceRatio)))
      }

      // if the max amount is less than the gas,
      // set the max amount to zero
      if (max_BN.lt(BigNumber.from('0'))) {
        max_BN = BigNumber.from('0')
      }

      console.log([ `max_BN`, max_BN.toString() ]);
      console.log([ `max_BN to float`, utils.formatUnits(max_BN, stakeToken.decimals) ]);

      return max_BN.toString();
    }
    else if (stakeToken.symbol === 'ETH' && netLayer === 'L1') {
      let safeRet = Number(amount) - 0.01
      if (safeRet > 0)
        return safeRet.toString()
      else
        return '0'
    }

    return amount
  }

  handleClose() {
    this.props.dispatch(closeModal("farmDepositModal"))
  }

  handleStakeValue(value) {

    const { stakeToken } = this.state

    if (value &&
      Number(value) > 0.0 &&
      Number(value) <= Number(this.state.max_Float)
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
    }
    this.setState({ loading: false })

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
    }

    this.setState({ loading: false, stakeValue: '', value_Wei_String: '' })
    this.props.dispatch(closeModal("farmDepositModal"))
  }

  render() {

    const {
      open,
      stakeToken,
      stakeValue,
      stakeValueValid,
      loading,
      max_Float
    } = this.state

    const { approvedAllowance } = this.props.farm

    let allowanceGTstake = false

    if (Number(approvedAllowance) > 0 &&
      Number(stakeValue) > 0 &&
      new BN(approvedAllowance).gte(powAmount(stakeValue, stakeToken.decimals))
    ) {
      allowanceGTstake = true
    }

    //do not need to approve ETH
    if (Number(stakeValue) > 0 && stakeToken.symbol === 'ETH') {
      allowanceGTstake = true
    }

    return (
      <Modal
        open={open}
        maxWidth="md"
        onClose={() => { this.handleClose() }}
        minHeight="380px"
      >
        <Box>
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 3 }}>
            Stake {`${stakeToken.symbol}`}
          </Typography>

          <Input
            placeholder={`Amount to stake`}
            value={stakeValue}
            type="number"
            unit={stakeToken.symbol}
            maxValue={max_Float}
            onChange={i => { this.handleStakeValue(i.target.value) }}
            onUseMax={i => { this.handleStakeValue(max_Float) }}
            allowUseAll={true}
            newStyle
            variant="standard"
          />
        </Box>

        {!allowanceGTstake && stakeToken.symbol !== 'ETH' &&
          <>
            {stakeValueValid &&
              <Typography variant="body2" sx={{ mt: 2 }}>
                To stake {stakeValue} {stakeToken.symbol},
                you first need to approve this amount.
              </Typography>
            }
            <WrapperActionsModal>
              <Button
                onClick={() => { this.handleClose() }}
                color="neutral"
                size="large"
              >
                Cancel
              </Button>
              <Button
                onClick={() => { this.handleApprove() }}
                loading={loading}
                disabled={!stakeValueValid}
                color='primary'
                size="large"
                variant="contained"
              >
                Approve amount
              </Button>
            </WrapperActionsModal>
          </>
        }

        {stakeValueValid && allowanceGTstake &&
          <>
            {stakeToken.symbol !== 'ETH' &&
              <Typography variant="body2" sx={{ mt: 2 }}>
                Your allowance has been approved. You can now stake your funds.
              </Typography>
            }
            <WrapperActionsModal>
              <Button
                onClick={() => { this.handleClose() }}
                color="neutral"
                size="large"
              >
                Cancel
              </Button>
              <Button
                onClick={() => { this.handleConfirm() }}
                loading={loading}
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
}

const mapStateToProps = state => ({
  ui: state.ui,
  farm: state.farm,
  balance: state.balance,
  setup: state.setup,
})

export default connect(mapStateToProps)(FarmDepositModal)
