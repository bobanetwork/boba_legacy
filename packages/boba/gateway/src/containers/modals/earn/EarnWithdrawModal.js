import React from 'react'
import { connect } from 'react-redux'
import { isEqual } from 'util/lodash';

import { closeModal, openAlert } from 'actions/uiAction'
import {
  fetchL1LPBalance,
  fetchL2LPBalance,
  getEarnInfo,
} from 'actions/earnAction'

import Modal from 'components/modal/Modal'
import { logAmount, toWei_String } from 'util/amountConvert'

import { WrapperActionsModal } from 'components/modal/styles'

import BN from 'bignumber.js'
import { withdrawLiquidity } from 'actions/networkAction'

import { MaxInput } from 'components/global/InputMax'
import { Button } from 'components/global/button'
import { ModalTypography } from 'components/global/modalTypography'

import {
  EarnInputContainer,
  EarnContent,
  Flex,
  EarnDetails,
  ContainerMessage,
} from './styles'

class EarnWithdrawModal extends React.Component {

  constructor(props) {
    super(props)

    const {
      open
    } = this.props

    const {
      withdrawToken,
      userInfo
    } = this.props.earn

    this.state = {
      open,
      withdrawToken,
      disableSubmit: true,
      userInfo,
      loading: false,
      //each value has an approximate version and a precise version
      value: '',
      value_Wei_String: '',
      maxValue: 0,
      maxValue_Wei_String: '',
      LPBalance: 0,
      LPBalance_Wei_String: '',
    }
  }

  async componentDidMount() {

    const { withdrawToken } = this.props.earn

    let LPBalance_Wei_String = ''

    if (withdrawToken.L1orL2Pool === 'L1LP') {
      this.props.dispatch(fetchL1LPBalance(withdrawToken.currency));
    } else {
      this.props.dispatch(fetchL2LPBalance(withdrawToken.currency));
    }

    this.setState({
      LPBalance: logAmount(LPBalance_Wei_String, withdrawToken.decimals),
      LPBalance_Wei_String
    })

    this.setMaxTransferValue()

  }

  async componentDidUpdate(prevState) {

    const { open } = this.props

    const { withdrawToken, userInfo , lpBalanceWeiString} = this.props.earn

    if (prevState.open !== open) {
      this.setState({ open })
    }

    if (!isEqual(prevState.earn.withdrawToken, withdrawToken)) {
      this.setState({ withdrawToken })
    }

    if (!isEqual(prevState.earn.userInfo, userInfo)) {
      this.setState({ userInfo })
    }

    if (!isEqual(prevState.earn.lpBalanceWeiString, lpBalanceWeiString)) {
      this.setState({
        LPBalance: logAmount(lpBalanceWeiString, withdrawToken.decimals),
        LPBalance_Wei_String: lpBalanceWeiString
      }, ()=>{
        this.setMaxTransferValue()
      })
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
    this.props.dispatch(closeModal("EarnWithdrawModal"))
  }

  async handleConfirm() {

    const { withdrawToken, value_Wei_String } = this.state;

    this.setState({ loading: true })

    console.log("Dispatch withdraw")

    const withdrawLiquidityTX = await this.props.dispatch(withdrawLiquidity(
      withdrawToken.currency,
      value_Wei_String,
      withdrawToken.L1orL2Pool,
    ))

    if (withdrawLiquidityTX) {
      this.props.dispatch(openAlert("Your liquidity was withdrawn."))
      this.props.dispatch(getEarnInfo())
    }
    this.setState({
      loading: false,
      value: '',
      value_Wei_String: ''
    })
    this.props.dispatch(closeModal("EarnWithdrawModal"))

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
        maxWidth="md"
        title={`Unstake`}

      >
        <EarnInputContainer>
          <EarnContent>
            <Flex>
              <div>
                <ModalTypography variant="body2">Amount</ModalTypography>
              </div>
              <div>
                <ModalTypography variant="body3">
                  Balance: {maxValue} {withdrawToken.symbol}
                </ModalTypography>
              </div>
            </Flex>
            <MaxInput
              initialValue={value}
              max={maxValue_Wei_String}
              onValueChange={(val) =>
                this.setAmount(val, toWei_String(val, withdrawToken.decimals))
              }
            />
            {Number(value) > Number(LPBalance) &&
              <ContainerMessage>
                  <ModalTypography variant="body3">
                  Insufficient {withdrawToken.symbol} in the {' '}
                  {withdrawToken.L1orL2Pool === 'L1LP' ? 'L1' : 'L2'} liquidity
                  pool to withdraw your full stake. At this time, you can only
                  withdraw up to
                  {Number(LPBalance).toFixed(2)} {withdrawToken.symbol}.
                </ModalTypography>
              </ContainerMessage>
            }


            <WrapperActionsModal>
              <Button
                onClick={()=>{this.handleConfirm()}}
                label="Unstake"
                loading={loading}
                disable={!!disableSubmit}
                style={{
                  width: '100%'
                }}
              />
              <Button
                onClick={() => { this.handleClose() }}
                label="Cancel"
                transparent
                style={{
                  width: '100%'
                }}
              />

            </WrapperActionsModal>
          </EarnContent>
        </EarnInputContainer>
      </Modal>
    )
  }
};

const mapStateToProps = state => ({
  ui: state.ui,
  earn: state.earn,
  balance: state.balance,
});

export default connect(mapStateToProps)(EarnWithdrawModal)
