import React from 'react'
import { connect } from 'react-redux'
import { isEqual } from 'lodash'

import { closeModal, openAlert } from 'actions/uiAction'
import { getFarmInfo } from 'actions/farmAction'

import Button from 'components/button/Button'
import Modal from 'components/modal/Modal'
import Input from 'components/input/Input'
import { logAmount, toWei_String } from 'util/amountConvert'

import networkService from 'services/networkService'

import { Typography } from '@material-ui/core'
import { WrapperActionsModal } from 'components/modal/Modal.styles'

import BN from 'bignumber.js'
import { withdrawLiquidity } from 'actions/networkAction'

class FarmWithdrawModal extends React.Component {

  constructor(props) {
    super(props)

    const {
      open
    } = this.props

    const {
      withdrawToken,
      userInfo
    } = this.props.farm

    this.state = {
      open,
      withdrawToken,
      disableSubmit: true,
      userInfo,
      loading: false,
      //each value has an approximate version and a precise version
      value: 0,
      value_Wei_String: '',
      maxValue: 0,
      maxValue_Wei_String: '',
      LPBalance: 0,
      LPBalance_Wei_String: '',
    }
  }

  async componentDidMount() {

    const { withdrawToken } = this.props.farm

    let LPBalance_Wei_String = ''

    if (withdrawToken.L1orL2Pool === 'L1LP') {
      LPBalance_Wei_String = await networkService.L1LPBalance(withdrawToken.currency)
    } else {
      LPBalance_Wei_String = await networkService.L2LPBalance(withdrawToken.currency)
    }

    //console.log("LPBalance current", LPBalance_Wei_String)

    this.setState({
      LPBalance: logAmount(LPBalance_Wei_String, withdrawToken.decimals),
      LPBalance_Wei_String
    })

    this.setMaxTransferValue()

  }

  async componentDidUpdate(prevState) {

    const { open } = this.props

    const { withdrawToken, userInfo } = this.props.farm

    if (prevState.open !== open) {
      this.setState({ open })
    }

    if (!isEqual(prevState.farm.withdrawToken, withdrawToken)) {
      this.setState({ withdrawToken })
    }

    if (!isEqual(prevState.farm.userInfo, userInfo)) {
      this.setState({ userInfo })
    }

  }

  setAmount(value, value_Wei_String) {

    const { maxValue } = this.state

    const tooSmall = new BN(value).lte(new BN(0.0))
    const tooBig = new BN(value).gt(new BN(maxValue))

    if (tooSmall || tooBig) {
      this.setState({
        value : 0,
        value_Wei_String: '',
        disableSubmit: true
      })
    } else {
      this.setState({
        value,
        value_Wei_String,
        disableSubmit: false
      })
    }

  }

  setMaxTransferValue() {

    const { userInfo, withdrawToken, LPBalance_Wei_String } = this.state

    let balance_Wei_String = ''

    if (typeof userInfo[withdrawToken.L1orL2Pool][withdrawToken.currency] !== 'undefined') {
      balance_Wei_String = userInfo[withdrawToken.L1orL2Pool][withdrawToken.currency].amount
    }

    //BUT, if the current balance is lower than what you staked, can only withdraw the balance
    const poolTooSmall = new BN(LPBalance_Wei_String).lt(new BN(balance_Wei_String))

    if (poolTooSmall) {
      console.log("pool smaller than stake",balance_Wei_String)
      this.setState({
        maxValue: logAmount(LPBalance_Wei_String, withdrawToken.decimals),
        maxValue_Wei_String: LPBalance_Wei_String
      })
    } else {
      //pool big enough to cover entire withdrawal
      console.log("pool large enough",LPBalance_Wei_String)
      this.setState({
        maxValue: logAmount(balance_Wei_String, withdrawToken.decimals),
        maxValue_Wei_String: balance_Wei_String
      })
    }

  }

  handleClose() {
    this.props.dispatch(closeModal("farmWithdrawModal"))
  }

  async handleConfirm() {

    const { withdrawToken, value_Wei_String } = this.state;

    this.setState({ loading: true })

    const withdrawLiquidityTX = await this.props.dispatch(withdrawLiquidity(
      withdrawToken.currency,
      value_Wei_String,
      withdrawToken.L1orL2Pool,
    ))

    if (withdrawLiquidityTX) {
      this.props.dispatch(openAlert("Your liquidity was withdrawn."))
      this.props.dispatch(getFarmInfo())
      this.setState({
        loading: false,
        value: '',
        value_Wei_String: ''
      })
      this.props.dispatch(closeModal("farmWithdrawModal"))
    } else {
      this.setState({
        loading: false,
        value: '',
        value_Wei_String: ''
      })
      this.props.dispatch(closeModal("farmWithdrawModal"))
    }
  }

  render() {

    const {
      open,
      withdrawToken,
      value,
      LPBalance,
      loading,
      disableSubmit,
      maxValue,
      maxValue_Wei_String
    } = this.state

    return (

      <Modal
        open={open}
        onClose={()=>{this.handleClose()}}
      >

        <Typography variant="h2" sx={{fontWeight: 700, mb: 3}}>
          Withdraw {`${withdrawToken.symbol}`}
        </Typography>

        <Input
          placeholder={`Amount to withdraw`}
          value={value}
          type="number"
          unit={withdrawToken.symbol}
          maxValue={maxValue}
          onChange={(i)=>{
            this.setAmount(i.target.value, toWei_String(i.target.value, withdrawToken.decimals))
          }}
          allowUseAll={true}
          onUseMax={(i)=>{
            this.setAmount(maxValue, maxValue_Wei_String)
          }}
          disabledSelect={true}
          variant="standard"
          newStyle
        />

        {Number(value) > Number(LPBalance) &&
          <Typography variant="body2" sx={{mt: 2}}>
            Note: There is currently insufficient {withdrawToken.symbol} in the {' '}
            {withdrawToken.L1orL2Pool === 'L1LP' ? 'L1' : 'L2'} liquidity pool
            to withdraw your full stake. At this time, you can only withdraw up to
            {Number(LPBalance).toFixed(2)} {withdrawToken.symbol}.
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
            color='primary'
            size="large"
            variant="contained"
            disabled={!!disableSubmit}
            loading={loading}
          >
            Confirm
          </Button>
        </WrapperActionsModal>
      </Modal>
    )
  }
};

const mapStateToProps = state => ({
  ui: state.ui,
  farm: state.farm,
  balance: state.balance,
});

export default connect(mapStateToProps)(FarmWithdrawModal)
