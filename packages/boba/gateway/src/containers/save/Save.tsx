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
import { useDispatch, useSelector } from 'react-redux'

import { getFS_Saves, getFS_Info } from 'actions/fixedAction'
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
import { Preloader } from 'components/dao/preloader'

import { selectFixed, selectSetup, selectBalance, selectLayer } from 'selectors'

const Save = () => {
  const layer = useSelector(selectLayer())
  const { stakeInfo } = useSelector(selectFixed())
  const { accountEnabled, netLayer, bobaFeeChoice, bobaFeePriceRatio } =
    useSelector(selectSetup())
  const balance = useSelector(selectBalance())
  const { layer2 } = balance

  const dispatch = useDispatch<any>()

  const [state, setState] = useState({
    max_Float_String: '0.0',
    fee: '0',
  })

  useEffect(() => {
    dispatch(getFS_Saves())
    dispatch(getFS_Info())
    getMaxTransferValue()
  }, [])

  useEffect(() => {
    getMaxTransferValue()
  }, [layer2])

  const getMaxTransferValue = async () => {
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
        preloader={<Preloader />}
      />
    )
  }
  return (
    <S.StakePageContainer>
      <S.PaddingContainer>
        <Connect
          userPrompt={'Please connect to Boba to stake'}
          accountEnabled={accountEnabled}
          connectToBoba={true}
          layer={netLayer}
        />
      </S.PaddingContainer>
      <S.GridContainer>
        <S.PaddingContainer>
          <S.BlockContainer>
            <S.Flex>
              <div>
                <Typography variant="head">Staked</Typography>
                <Typography variant="title">{totalBOBAstaked} BOBA</Typography>
              </div>
              <div>
                <Typography variant="head">Boba Balance</Typography>
                <Typography variant="title">
                  {state.max_Float_String} BOBA
                </Typography>
              </div>
            </S.Flex>
            <div>
              <div>
                <Typography variant="head">APY</Typography>
                <Typography variant="title">5.22%</Typography>
              </div>
            </div>
            {layer === 'L2' && (
              <div>
                <Button
                  label="Stake"
                  small
                  disable={!Boolean(state.max_Float_String !== '0.0')}
                  onClick={() => dispatch(openModal('StakeDepositModal'))}
                />
              </div>
            )}
          </S.BlockContainer>
        </S.PaddingContainer>
        <S.PaddingContainer>
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
        </S.PaddingContainer>
      </S.GridContainer>
      <div>
        <div>
          <S.PaddingContainer>
            <S.TitleContainer>
              <Typography variant="head">Staking History</Typography>
            </S.TitleContainer>
          </S.PaddingContainer>
          <S.MobileTableContainer>
            {(!stakeInfo && layer === 'L2') ||
            (!Object.keys(stakeInfo).length && layer === 'L2') ? (
              <Loader />
            ) : (
              <>
                <S.StakeItemContainer>
                  {Object.keys(stakeInfo).map((v, i) => {
                    if (stakeInfo[i].isActive) {
                      return (
                        <TransactionList stakeInfo={stakeInfo[i]} key={i} />
                      )
                    }
                    return null
                  })}
                </S.StakeItemContainer>
              </>
            )}
          </S.MobileTableContainer>
        </div>
      </div>
    </S.StakePageContainer>
  )
}

export default Save
