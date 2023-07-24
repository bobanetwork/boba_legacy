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
import { connect, useDispatch } from 'react-redux'
import { isEqual } from 'util/lodash'

import { getFS_Saves, getFS_Info, addFS_Savings } from 'actions/fixedAction'
import { openModal } from 'actions/uiAction'

import * as S from './Save.styles'

import Connect from 'containers/connect/Connect'

import { toWei_String } from 'util/amountConvert'
import networkService from 'services/networkService'
import { BigNumber, utils } from 'ethers'
import { Typography } from 'components/global/typography'
import { Button } from 'components/global/button'
import TransactionList from 'components/stake/transactionList'
import { PlaceholderConnect } from 'components/global/placeholderConnect'
import { ModalTypography } from 'components/global/modalTypography'
const Save = (props: any) => {
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

  const totalBOBAstaked = Object.keys(stakeInfo).reduce((accumulator, key) => {
    if (stakeInfo[key].isActive) {
      return accumulator + Number(stakeInfo[key].depositAmount)
    }
    return accumulator
  }, 0)

  const Loader = () => {
    const isLoading = state.fee === '0' ? true : false
    return (
      <PlaceholderConnect
        isLoading={accountEnabled && isLoading}
        preloader={<>{'loading'}</>}
      />
    )
  }
  return (
    <S.StakePageContainer>
      <Connect
        userPrompt={'Please connect to Boba to stake'}
        accountEnabled={accountEnabled}
        connectToBoba={true}
        layer={netLayer}
      />
      <S.GridContainer>
        <div>
          <S.BlockContainer>
            <S.Flex>
              <div>
                <Typography variant="head">Staked</Typography>
                <Typography variant="head">{totalBOBAstaked} BOBA</Typography>
              </div>
              <div>
                <Typography variant="head">Boba Balance</Typography>
                <Typography variant="head">
                  {state.max_Float_String} BOBA
                </Typography>
              </div>
            </S.Flex>
            <div>
              <div>
                <Typography variant="head">APY</Typography>
                <Typography variant="head">5.22%</Typography>
              </div>
            </div>
            <div>
              <div>
                {state.max_Float_String !== '0.0' && (
                  <Button
                    label="Stake"
                    onClick={() => dispatch(openModal('StakeDepositModal'))}
                  />
                )}
              </div>
            </div>
          </S.BlockContainer>
        </div>
        <div>
          <S.BlockContainer>
            <div>
              <Typography variant="head">Staking Period</Typography>
              <ModalTypography variant="body2">
                Each staking period lasts 2 weeks. If you do not unstake after a
                <br />
                staking period, your stake will be automatically renewed.
              </ModalTypography>
            </div>
            <div>
              <Typography variant="head">Unstaking Window</Typography>
              <ModalTypography variant="body2">
                The first two days of every staking period, except for the first
                <br />
                staking period, are the unstaking window. You can only unstake
                <br />
                during the unstaking window.
              </ModalTypography>
            </div>
          </S.BlockContainer>
        </div>
      </S.GridContainer>
      <div>
        <div>
          <S.TitleContainer>
            <Typography variant="head">Staking History</Typography>
          </S.TitleContainer>
          {!stakeInfo || !Object.keys(stakeInfo).length ? (
            <Loader />
          ) : (
            <>
              <S.StakeItemContainer>
                {Object.keys(stakeInfo).map((v, i) => {
                  if (stakeInfo[i].isActive) {
                    return <TransactionList stakeInfo={stakeInfo[i]} key={i} />
                  }
                  return null
                })}
              </S.StakeItemContainer>
            </>
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
