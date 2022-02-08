import React from 'react'
import { connect } from 'react-redux'

import { closeModal, openAlert, openError } from 'actions/uiAction'
import { addFS_Savings } from 'actions/fixedAction'

import Button from 'components/button/Button'
import Modal from 'components/modal/Modal'
import Input from 'components/input/Input'

import { logAmount, toWei_String } from 'util/amountConvert'

import { Box, Typography } from '@mui/material'
import { WrapperActionsModal } from 'components/modal/Modal.styles'

class SaveDepositModal extends React.Component {

  constructor(props) {
    super(props)

    const { 
      open,
      balance
     } = this.props

    this.state = {
      open,
      stakeValue: '',
      balance,
      stakeValueValid: false,
      value_Wei_String: '',
      loading: false,
    }
  }

  async componentDidUpdate(prevState) {

    const { open, balance } = this.props

    if (prevState.open !== open) {
      this.setState({ open })
    }
    if (prevState.balance !== balance) {
      this.setState({ balance })
    }

  }

  getMaxTransferValue () {

    const { balance } = this.state

    const bobaBalance = Object.keys(balance['layer2']).reduce((acc, cur) => {
      if (balance['layer2'][cur]['symbolL2'] === 'BOBA') {
        const bal = balance['layer2'][cur]['balance']
        acc = logAmount(bal, 18)
      }
      return acc
    }, 0)

    return bobaBalance
  }

  handleStakeValue(value) {

    if( value && 
      (Number(value) > 0.0) && 
      (Number(value) <= Number(this.getMaxTransferValue()))
      ) {
        this.setState({
          stakeValue: value,
          stakeValueValid: true,
          value_Wei_String: toWei_String(value, 18)
        })
    } else {
      this.setState({
        stakeValue: value,
        stakeValueValid: false,
        value_Wei_String: ''
      })
    }
  }

  async handleConfirm() {

    const { value_Wei_String } = this.state

    this.setState({ loading: true })

    const addTX = await this.props.dispatch(addFS_Savings(value_Wei_String))

    if (addTX) {
      this.props.dispatch(openAlert("Your BOBA was staked"))
      this.setState({ loading: false, stakeValue: '', value_Wei_String: ''})
      this.props.dispatch(closeModal("saveDepositModal"))
    } else {
      this.props.dispatch(openError("Failed to stake BOBA"))
      this.setState({ loading: false, stakeValue: '', value_Wei_String: ''})
      this.props.dispatch(closeModal("saveDepositModal"))
    }
  }

  handleClose() {
    this.props.dispatch(closeModal("saveDepositModal"))
  }

  render() {

    const {
      open,
      stakeValue,
      stakeValueValid,
      loading,
    } = this.state

    // const {approvedAllowance} = this.props.farm;

    // let allowanceGTstake = false

    // if ( Number(approvedAllowance) > 0 &&
    //      Number(stakeValue) > 0 &&
    //      new BN(approvedAllowance).gte(powAmount(stakeValue, stakeToken.decimals))
    // ) {
    //   allowanceGTstake = true
    // }

    // //do not need to approve ETH
    // if ( Number(stakeValue) > 0 && stakeToken.symbol === 'ETH' ) {
    //   allowanceGTstake = true
    // }

    return (
      <Modal
        open={open}
        maxWidth="md"
        onClose={()=>{this.handleClose()}}
        minHeight="380px"
      >
        <Box>
          <Typography variant="h2" sx={{fontWeight: 700, mb: 3}}>
            Stake BOBA
          </Typography>

          <Input
            placeholder={`Amount to stake`}
            value={stakeValue}
            type="number"
            unit={'BOBA'}
            maxValue={this.getMaxTransferValue()}
            onChange={i=>{this.handleStakeValue(i.target.value)}}
            onUseMax={i=>{this.handleStakeValue(this.getMaxTransferValue())}}
            newStyle
            variant="standard"
          />
        </Box>

        {stakeValueValid &&
          <>
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
  fixed: state.fixed,
  balance: state.balance,
})

export default connect(mapStateToProps)(SaveDepositModal)
