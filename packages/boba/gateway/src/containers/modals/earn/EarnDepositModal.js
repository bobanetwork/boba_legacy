import React from 'react'
import { connect } from 'react-redux'
import { isEqual } from 'util/lodash';

import { closeModal, openAlert } from 'actions/uiAction'
import { addLiquidity, getEarnInfo } from 'actions/earnAction'

import Button from 'components/button/Button'
import Modal from 'components/modal/Modal'
import Input from 'components/input/Input'

import { powAmount, toWei_String } from 'util/amountConvert'
import BN from 'bignumber.js'

import { Box, Typography } from '@mui/material'
import { WrapperActionsModal } from 'components/modal/styles'

import { earnL1, earnL2 } from 'actions/networkAction'
import { fetchAllowance } from 'actions/earnAction'
import networkService from 'services/networkService'
import { BigNumber, utils } from 'ethers'
import { NETWORK } from 'util/network/network.util'

class EarnDepositModal extends React.Component {

  constructor(props) {

    super(props)

    const { open } = this.props
    const { stakeToken } = this.props.earn
    const { bobaFeeChoice, netLayer, bobaFeePriceRatio } = this.props.setup

    this.state = {
      open,
      stakeToken,
      stakeValue: '',
      stakeValueValid: false,
      value_Wei_String: '',
      loading: false,
      bobaFeeChoice,
      netLayer,
      netLayerNativeToken: networkService.networkGateway === NETWORK.ETHEREUM ? 'ETH' : netLayer === 'L1' ? networkService.L1NativeTokenSymbol : 'BOBA',
      bobaFeePriceRatio,
      max_Wei_String: '0',
      max_Float_String: '0.0',
      fee: '0'
    }
  }

  componentDidMount() {
    this.getMaxTransferValue()
  }

  async componentDidUpdate(prevState) {

    const { open } = this.props
    const { stakeToken } = this.props.earn
    const { bobaFeeChoice, netLayer } = this.props.setup

    if (prevState.open !== open) {
      this.setState({ open })
    }

    if (!isEqual(prevState.setup.netLayer, netLayer)) {
      this.setState({ netLayer })
    }

    if (!isEqual(prevState.setup.bobaFeeChoice, bobaFeeChoice)) {
      this.setState({ bobaFeeChoice })
    }

    if (!isEqual(prevState.earn.stakeToken, stakeToken)) {

      if ( stakeToken.symbol !== this.state.netLayerNativeToken ) {
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

    const {
      stakeToken,
      bobaFeeChoice,
      bobaFeePriceRatio,
      netLayer,
      netLayerNativeToken
    } = this.state

    let max_BN = BigNumber.from(stakeToken.balance.toString())

    if (netLayer === 'L2') {

      let cost_BN = await networkService
        .liquidityEstimate(
          stakeToken.currency
        )

      let fee = '0'

      // both ETH and BOBA have 18 decimals so this is safe
      if (stakeToken.symbol === netLayerNativeToken) {
        // we are staking ETH
        // since MetaMask does not know about BOBA, we need to subtract the ETH fee
        // regardless of how we are paying, otherwise will get an error in MetaMask
        max_BN = max_BN.sub(cost_BN)
        // minimum ETH in account
        max_BN = max_BN.sub(BigNumber.from(toWei_String(0.002, 18)))
      }
      else if (stakeToken.symbol === 'BOBA' && bobaFeeChoice) {
        // we are staking BOBA and paying in BOBA
        // so need to subtract the BOBA fee
        max_BN = max_BN.sub(cost_BN.mul(BigNumber.from(bobaFeePriceRatio)))
        // make sure user maintains minimum BOBA in account
        max_BN = max_BN.sub(BigNumber.from(toWei_String(3.0, 18)))
      }
      else if (stakeToken.symbol === 'BOBA' && !bobaFeeChoice) {
        // make sure user maintains minimum BOBA in account
        max_BN = max_BN.sub(BigNumber.from(toWei_String(3.0, 18)))
      }
      else {
        // do not adjust max_BN
      }

      if (bobaFeeChoice && networkService.networkGateway === NETWORK.ETHEREUM) {
        fee = utils.formatUnits(cost_BN.mul(BigNumber.from(bobaFeePriceRatio)), stakeToken.decimals)
      }
      else {
        fee = utils.formatUnits(cost_BN, stakeToken.decimals)
      }

      // if the max amount is less than the gas,
      // set the max amount to zero
      if (max_BN.lt(BigNumber.from('0'))) {
        max_BN = BigNumber.from('0')
      }

      this.setState({
        max_Float_String: utils.formatUnits(max_BN, stakeToken.decimals),
        fee
      })

    }
    else {
      this.setState({
        max_Float_String: utils.formatUnits(max_BN, stakeToken.decimals)
      })
    }
  }

  handleClose() {
    this.props.dispatch(closeModal("EarnDepositModal"))
  }

  handleStakeValue( value ) {

    const {
      stakeToken,
      max_Float_String
    } = this.state

    if (value &&
      Number(value) > 0.0 &&
      Number(value) <= Number(max_Float_String)
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

    const {
      stakeToken,
      value_Wei_String
    } = this.state

    this.setState({ loading: true })

    let approveTX

    if (stakeToken.L1orL2Pool === 'L2LP') {
      approveTX = await this.props.dispatch(earnL2(
        value_Wei_String,
        stakeToken.currency,
      ))
    }
    else if (stakeToken.L1orL2Pool === 'L1LP') {
      approveTX = await this.props.dispatch(earnL1(
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

    const {
      stakeToken,
      value_Wei_String
    } = this.state

    this.setState({ loading: true })

    const addLiquidityTX = await this.props.dispatch(addLiquidity(
      stakeToken.currency,
      value_Wei_String,
      stakeToken.L1orL2Pool,
    ))

    if (addLiquidityTX) {
      this.props.dispatch(openAlert("Your liquidity was added"))
      this.props.dispatch(getEarnInfo())
    }

    this.setState({ loading: false, stakeValue: '', value_Wei_String: '' })
    this.props.dispatch(closeModal("EarnDepositModal"))
  }

  render() {

    const {
      open,
      stakeToken,
      stakeValue,
      stakeValueValid,
      loading,
      max_Float_String,
      netLayer,
      bobaFeeChoice,
      fee,
      netLayerNativeToken
    } = this.state

    const { approvedAllowance } = this.props.earn

    let allowanceGTstake = false

    if (Number(approvedAllowance) > 0 &&
      Number(stakeValue) > 0 &&
      new BN(approvedAllowance).gte(powAmount(stakeValue, stakeToken.decimals))
    ) {
      allowanceGTstake = true
    } else if (Number(stakeValue) > 0 &&
      stakeToken.symbol === netLayerNativeToken
    ) {
      //do not need to approve ETH
      allowanceGTstake = true
    }

    // we do this because there is no fee estimation logic (yet) for this
    // on L1
    let allowUseAll = netLayer === 'L2' ? true : false

    return (
      <Modal
        open={open}
        maxWidth="md"
        onClose={() => { this.handleClose() }}
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
            maxValue={max_Float_String}
            onChange={i => { this.handleStakeValue(i.target.value) }}
            onUseMax={i => { this.handleStakeValue(max_Float_String) }}
            allowUseAll={allowUseAll}
            newStyle
            variant="standard"
          />

          {netLayer === 'L2' && bobaFeeChoice && fee &&
            <Typography variant="body2" sx={{ mt: 2 }}>
              Fee: {fee} BOBA
            </Typography>
          }

          {netLayer === 'L2' && !bobaFeeChoice && fee &&
            <Typography variant="body2" sx={{ mt: 2 }}>
              Fee: {fee} {networkService.L1NativeTokenSymbol}
            </Typography>
          }
        </Box>

        {!allowanceGTstake && stakeToken.symbol !== netLayerNativeToken &&
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
                variant='outlined'
                color='primary'
                size='large'
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
            {stakeToken.symbol !== netLayerNativeToken &&
              <Typography variant="body2" sx={{ mt: 2 }}>
                Your allowance has been approved. You can now stake your funds.
              </Typography>
            }
            <WrapperActionsModal>
              <Button
                onClick={() => { this.handleClose() }}
                variant='outlined'
                color='primary'
                size='large'
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
  earn: state.earn,
  balance: state.balance,
  setup: state.setup,
})

export default connect(mapStateToProps)(EarnDepositModal)
