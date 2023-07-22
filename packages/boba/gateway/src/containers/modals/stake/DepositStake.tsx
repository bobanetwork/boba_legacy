import React, { useEffect, useState } from 'react'
import { connect, useDispatch } from 'react-redux'

import { openAlert, closeModal } from 'actions/uiAction'

import Modal from 'components/modal/Modal'
import { isEqual } from 'util/lodash'

import { Button } from 'components/global/button'

import { StakeInputContainer, Flex, StakeContent, StakeDetails } from './styles'

import { getFS_Saves, getFS_Info, addFS_Savings } from 'actions/fixedAction'

import { toWei_String } from 'util/amountConvert'
import networkService from 'services/networkService'
import { BigNumber, utils } from 'ethers'
import { MaxInput } from 'components/global/InputMax'

import { ModalTypography } from 'components/global/modalTypography'

const DepositStake = (props: any) => {
  const { stakeInfo } = props.fixed

  const { accountEnabled, netLayer, bobaFeeChoice, bobaFeePriceRatio } =
    props.setup

  const { layer2 } = props.balance
  const dispatch = useDispatch<any>()
  const [state, setState] = useState({
    stakeInfo,
    accountEnabled,
    netLayer,
    bobaFeeChoice,
    bobaFeePriceRatio,
    layer2,
    stakeValue: '',
    stakeValueValid: false,
    value_Wei_String: '',
    max_Wei_String: '0',
    max_Float_String: '0.0',
    fee: '0',
    balance: props.balance,
    fixed: props.fixed,
    setup: props.setup,
  })

  useEffect(() => {
    props.dispatch(getFS_Saves())
    props.dispatch(getFS_Info())
    getMaxTransferValue()
  }, [])

  useEffect(() => {
    const { stakeInfo } = props.fixed

    const { accountEnabled, netLayer, bobaFeeChoice, bobaFeePriceRatio } =
      props.setup

    const { layer2 } = props.balance

    const updateState = (prevState: any) => {
      return {
        ...prevState,
        layer2,
        stakeInfo,
        accountEnabled,
        netLayer,
        bobaFeeChoice,
        bobaFeePriceRatio,
      }
    }

    if (
      !isEqual(state.balance.layer2, layer2) ||
      !isEqual(state.fixed.stakeInfo, stakeInfo) ||
      !isEqual(state.setup.accountEnabled, accountEnabled) ||
      !isEqual(state.setup.netLayer, netLayer) ||
      !isEqual(state.setup.bobaFeeChoice, bobaFeeChoice) ||
      !isEqual(state.setup.bobaFeePriceRatio, bobaFeePriceRatio) ||
      !isEqual(state.max_Float_String, props.max_Float_String)
    ) {
      setState(updateState)
    }
    getMaxTransferValue()
  }, [props])

  const getMaxTransferValue = async () => {
    const { layer2, bobaFeeChoice, bobaFeePriceRatio, netLayer } = state

    // as staking BOBA check the bobabalance
    const token: any = Object.values(layer2).find(
      (t: any) => t['symbolL2'] === 'BOBA'
    )

    // BOBA available prepare transferEstimate
    if (token) {
      let max_BN = BigNumber.from(token.balance.toString())
      let fee = '0'

      if (netLayer === 'L2') {
        const cost_BN: any = await networkService.savingEstimate()

        if (bobaFeeChoice) {
          // we are staking BOBA and paying in BOBA
          // so need to subtract the BOBA fee
          max_BN = max_BN.sub(cost_BN.mul(BigNumber.from(bobaFeePriceRatio)))
        }

        // make sure user maintains minimum BOBA in account
        max_BN = max_BN.sub(BigNumber.from(toWei_String(3.0, 18)))

        if (bobaFeeChoice) {
          fee = utils.formatUnits(
            cost_BN.mul(BigNumber.from(bobaFeePriceRatio)),
            token.decimals
          )
        } else {
          fee = utils.formatUnits(cost_BN, token.decimals)
        }
      }

      if (max_BN.lt(BigNumber.from('0'))) {
        max_BN = BigNumber.from('0')
      }

      setState((prevState) => ({
        ...prevState,
        max_Float_String: utils.formatUnits(max_BN, token.decimals),
        fee,
      }))
    }
  }

  const handleStakeValue = (value: any) => {
    const { max_Float_String } = state

    if (
      value &&
      Number(value) > 0.0 &&
      Number(value) <= Number(max_Float_String)
    ) {
      setState((prevState) => ({
        ...prevState,
        stakeValue: value,
        stakeValueValid: true,
        value_Wei_String: toWei_String(value, 18),
      }))
    } else {
      setState((prevState) => ({
        ...prevState,
        stakeValue: value,
        stakeValueValid: false,
        value_Wei_String: '',
      }))
    }
  }

  const handleConfirm = async () => {
    const { value_Wei_String } = state

    setState((prevState) => ({ ...prevState, loading: true }))

    const addTX = await props.dispatch(addFS_Savings(value_Wei_String))

    if (addTX) {
      props.dispatch(openAlert('Your BOBA were staked'))
    }

    setState((prevState) => ({
      ...prevState,
      loading: false,
      stakeValue: '',
      value_Wei_String: '',
    }))
    handleClose()
  }

  let totalBOBAstaked = 0
  Object.keys(stakeInfo).forEach((v, i) => {
    if (stakeInfo[i].isActive) {
      totalBOBAstaked = totalBOBAstaked + Number(stakeInfo[i].depositAmount)
    }
  })

  const handleClose = () => {
    props.dispatch(closeModal('StakeDepositModal'))
  }

  return (
    <Modal
      open={open}
      maxWidth="md"
      onClose={() => {
        handleClose()
      }}
      title="Stake"
    >
      <StakeInputContainer>
        <ModalTypography variant="body2">
          Stake Boba and earn rewards.
        </ModalTypography>

        <StakeContent>
          <Flex>
            <div>
              <ModalTypography variant="body2">Amount</ModalTypography>
            </div>
            <div>
              <ModalTypography variant="body3">
                Balance: {state.max_Float_String} BOBA
              </ModalTypography>
            </div>
          </Flex>
          <MaxInput
            max={Number(state.max_Float_String)}
            onValueChange={(value: any) => {
              handleStakeValue(value)
            }}
          />
        </StakeContent>
        <StakeDetails>
          <Flex>
            <ModalTypography variant="body3">Fees</ModalTypography>
            <ModalTypography variant="body3">
              Fee: {state.fee} {bobaFeeChoice ? 'BOBA' : 'ETH'}
            </ModalTypography>
          </Flex>
          <Flex>
            <ModalTypography variant="body3">APY</ModalTypography>
            <ModalTypography variant="body3">5.0%</ModalTypography>
          </Flex>
          <Flex>
            <ModalTypography variant="body3">Amount</ModalTypography>
            <ModalTypography variant="body3">
              {state.stakeValue || '-'}
            </ModalTypography>
          </Flex>
        </StakeDetails>

        {netLayer === 'L2' && (
          <Button
            onClick={() => {
              handleConfirm()
            }}
            loading={props.loading}
            disable={!accountEnabled}
            label="Stake"
          />
        )}
      </StakeInputContainer>
      <Button
        onClick={() => {
          handleClose()
        }}
        transparent
        label="Cancel"
      />
    </Modal>
  )
}

const mapStateToProps = (state: any) => ({
  ui: state.ui,
  fixed: state.fixed,
  setup: state.setup,
  balance: state.balance,
})

export default connect(mapStateToProps)(DepositStake)
