/*
  Utility Functions for OMG Plasma
  Copyright (C) 2021 Enya Inc. Palo Alto, CA

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
import React, { useState, useEffect, useCallback } from 'react'
import { connect } from 'react-redux'
import { isEqual } from 'util/lodash'

import { getFS_Saves, getFS_Info, addFS_Savings } from 'actions/fixedAction'
import { openAlert } from 'actions/uiAction'

import * as S from './Save.styles'

import Input from 'components/input/Input'
import Connect from 'containers/connect/Connect'

import { toWei_String } from 'util/amountConvert'
import networkService from 'services/networkService'
import { BigNumber, utils } from 'ethers'
import { Typography } from 'components/global/typography'
import { Button } from 'components/global/button'
import TransactionList from 'components/stake/transactionList'
const Save = (props: any) => {
  const { stakeInfo } = props.fixed

  const { accountEnabled, netLayer, bobaFeeChoice, bobaFeePriceRatio } =
    props.setup

  const { layer2 } = props.balance

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
        layer2: props.balance.layer2,
        stakeInfo: props.fixed.stakeInfo,
        accountEnabled: props.setup.accountEnabled,
        netLayer: props.setup.netLayer,
        bobaFeeChoice: props.setup.bobaFeeChoice,
        bobaFeePriceRatio: props.setup.bobaFeePriceRatio,
      }
    }

    if (
      !isEqual(state.balance.layer2, props.balance.layer2) ||
      !isEqual(state.fixed.stakeInfo, props.fixed.stakeInfo) ||
      !isEqual(state.setup.accountEnabled, props.setup.accountEnabled) ||
      !isEqual(state.setup.netLayer, props.setup.netLayer) ||
      !isEqual(state.setup.bobaFeeChoice, props.setup.bobaFeeChoice) ||
      !isEqual(state.setup.bobaFeePriceRatio, props.setup.bobaFeePriceRatio) ||
      !isEqual(state.max_Float_String, props.max_Float_String)
    ) {
      console.log('updating state when not equal')
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
  }

  let totalBOBAstaked = 0
  Object.keys(stakeInfo).forEach((v, i) => {
    if (stakeInfo[i].isActive) {
      totalBOBAstaked = totalBOBAstaked + Number(stakeInfo[i].depositAmount)
    }
  })

  return (
    <S.StakePageContainer>
      <Connect
        userPrompt={'Please connect to Boba to stake'}
        accountEnabled={accountEnabled}
        connectToBoba={true}
        layer={netLayer}
      />
      <div>
        <div>
          <S.BlockContainer>
            <div>
              <div>
                <Typography variant="head">Staked</Typography>
                <Typography variant="head">{totalBOBAstaked} BOBA</Typography>
              </div>
            </div>
            <div>
              <div>
                <Typography variant="head">Boba Balance</Typography>
                <Typography variant="head">
                  {state.max_Float_String} BOBA
                </Typography>
              </div>
            </div>
            <div>
              <div>
                <Typography variant="head">APY</Typography>
                <Typography variant="head">5.22%</Typography>
              </div>
            </div>
            <div>
              <div>
                <Button label="Stake" />
              </div>
              <div>
                <Button label="Unstake" outline />
              </div>
            </div>
          </S.BlockContainer>
        </div>
        <div>
          <S.BlockContainer>
            <div>
              <Typography variant="head">Staking Period</Typography>
              <Typography variant="body3">
                Each staking period lasts 2 weeks. If you do not unstake after a
                staking period, your stake will be automatically renewed.
              </Typography>
            </div>
            <div>
              <Typography variant="head">Unstaking Window</Typography>
              <Typography variant="body3">
                The first two days of every staking period, except for the first
                staking period, are the unstaking window. You can only unstake
                during the unstaking window.
              </Typography>
            </div>
          </S.BlockContainer>
        </div>
      </div>
      <div>
        <div>
          <S.StakeInputContainer>
            <Input
              placeholder={`Amount to stake`}
              value={props.stakeValue}
              type="number"
              // unit={'BOBA'}
              maxValue={state.max_Float_String}
              onChange={(i: any) => {
                handleStakeValue(i.target.value)
              }}
              onUseMax={(i: any) => {
                handleStakeValue(state.max_Float_String)
              }}
              newStyle
              disabled={netLayer !== 'L2'}
              variant="standard"
              //FIX ME AFTER REFACTORY INPUT COMPONETNT TO TYPESCRIPT
              label={undefined}
              disabledExitAll={undefined}
              icon={undefined}
              unit={undefined}
              onSelect={undefined}
              sx={undefined}
              paste={undefined}
              fullWidth={undefined}
              size={undefined}
              loading={undefined}
              maxLength={undefined}
              selectOptions={undefined}
              defaultSelect={undefined}
              selectValue={undefined}
              style={undefined}
              isBridge={undefined}
              openTokenPicker={undefined}
            />

            {netLayer === 'L2' && bobaFeeChoice && state.fee && (
              <Typography variant="body2">Fee: {state.fee} BOBA</Typography>
            )}

            {netLayer === 'L2' && !bobaFeeChoice && state.fee && (
              <Typography variant="body2">Fee: {state.fee} ETH</Typography>
            )}

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
          </S.StakeInputContainer>
        </div>
        <div>
          {Object.keys(stakeInfo).length === 0 ? (
            <S.StakeContainer>
              <div>
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.1204 2.66504C7.51906 2.66504 5.37107 4.63837 5.37107 7.12371V24.8731C5.37107 27.3585 7.51906 29.3318 10.1204 29.3318H21.9551C24.5564 29.3318 26.7044 27.3585 26.7044 24.8731C26.7044 24.0051 26.7044 14.4757 26.7044 11.9984C26.7044 11.9851 26.7044 11.9704 26.7044 11.9571C26.7044 7.20638 22.1191 2.66504 17.3711 2.66504C11.7524 2.66504 11.7391 2.66504 10.1204 2.66504ZM10.1204 5.33171C11.4417 5.33171 12.9364 5.33171 16.0377 5.33171V8.87307C16.0377 11.3584 18.1857 13.3317 20.7871 13.3317H24.0377C24.0377 16.7144 24.0377 24.0944 24.0377 24.8731C24.0377 25.8251 23.1391 26.6651 21.9551 26.6651H10.1204C8.93639 26.6651 8.03773 25.8251 8.03773 24.8731V7.12371C8.03773 6.17171 8.93639 5.33171 10.1204 5.33171ZM18.7044 5.49838C21.0671 6.12505 23.2591 8.30906 23.8711 10.6651H20.7871C19.6017 10.6651 18.7044 9.82507 18.7044 8.87307V5.49838ZM12.0377 10.6651C11.3017 10.6651 10.7044 11.2624 10.7044 11.9984C10.7044 12.7344 11.3017 13.3317 12.0377 13.3317H13.3711C14.1071 13.3317 14.7044 12.7344 14.7044 11.9984C14.7044 11.2624 14.1071 10.6651 13.3711 10.6651H12.0377ZM12.0377 15.9984C11.3017 15.9984 10.7044 16.5957 10.7044 17.3318C10.7044 18.0678 11.3017 18.6651 12.0377 18.6651H20.0377C20.7737 18.6651 21.3711 18.0678 21.3711 17.3318C21.3711 16.5957 20.7737 15.9984 20.0377 15.9984H12.0377ZM12.0377 21.3318C11.3017 21.3318 10.7044 21.9291 10.7044 22.6651C10.7044 23.4011 11.3017 23.9984 12.0377 23.9984H20.0377C20.7737 23.9984 21.3711 23.4011 21.3711 22.6651C21.3711 21.9291 20.7737 21.3318 20.0377 21.3318H12.0377Z"
                    fill="white"
                    fillOpacity="0.65"
                  />
                </svg>
                <Typography variant="body3">
                  {accountEnabled
                    ? 'No Content'
                    : 'Please connect to wallet first'}
                </Typography>
              </div>
            </S.StakeContainer>
          ) : (
            <div>
              {Object.keys(stakeInfo).map((v, i) => {
                console.log('stakeInfo', stakeInfo[i])
                if (stakeInfo[i].isActive) {
                  return (
                    <S.StakeItemContainer key={i}>
                      <TransactionList stakeInfo={stakeInfo[i]} />
                    </S.StakeItemContainer>
                  )
                }
                return null
              })}
            </div>
          )}
        </div>
      </div>
    </S.StakePageContainer>
  )
}

const mapStateToProps = (state: any) => ({
  fixed: state.fixed,
  setup: state.setup,
  balance: state.balance,
})

export default connect(mapStateToProps)(Save)
