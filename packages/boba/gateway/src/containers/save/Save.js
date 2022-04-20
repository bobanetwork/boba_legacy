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

import React from 'react'
import { connect } from 'react-redux'
import { isEqual } from 'lodash'

import { getFS_Saves, getFS_Info, addFS_Savings } from 'actions/fixedAction'

import AlertIcon from 'components/icons/AlertIcon'

import { openAlert } from 'actions/uiAction'

import * as S from './Save.styles'

import { Box, Typography, Grid } from '@mui/material'
import { Circle } from '@mui/icons-material'
import PageTitle from 'components/pageTitle/PageTitle'

import BobaGlassIcon from 'components/icons/BobaGlassIcon'
import Input from 'components/input/Input'
import Button from 'components/button/Button'
import ListSave from 'components/listSave/listSave'
import Connect from 'containers/connect/Connect'

import { toWei_String } from 'util/amountConvert'
import networkService from 'services/networkService'
import { BigNumber, utils } from 'ethers'

class Save extends React.Component {

  constructor(props) {

    super(props)

    const {
      stakeInfo,
    } = this.props.fixed

    const {
      accountEnabled,
      netLayer,
      bobaFeeChoice,
      bobaFeePriceRatio
    } = this.props.setup

    const {
      layer2,
    } = this.props.balance

    this.state = {
      stakeInfo,
      accountEnabled,
      netLayer,
      bobaFeeChoice,
      bobaFeePriceRatio,
      layer2,
      loading: false,
      stakeValue: '',
      stakeValueValid: false,
      value_Wei_String: '',
      max_Wei_String: '0',
      max_Float_String: '0.0',
      fee: '0'
    }

  }

  componentDidMount() {
    this.props.dispatch(getFS_Saves())
    this.props.dispatch(getFS_Info())
    this.getMaxTransferValue()
  }

  componentDidUpdate(prevState) {

    const {
      stakeInfo
    } = this.props.fixed

    const {
      accountEnabled,
      netLayer,
      bobaFeeChoice,
      bobaFeePriceRatio
    } = this.props.setup

    const {
      layer2
    } = this.props.balance

    if (!isEqual(prevState.balance.layer2, layer2)) {
      this.setState({ layer2 },() => this.getMaxTransferValue())
    }

    if (!isEqual(prevState.fixed.stakeInfo, stakeInfo)) {
      this.setState({ stakeInfo })
    }

    if (!isEqual(prevState.setup.accountEnabled, accountEnabled)) {
      this.setState({ accountEnabled })
    }

    if (!isEqual(prevState.setup.bobaFeeChoice, bobaFeeChoice)) {
      this.setState({ bobaFeeChoice })
    }

    if (!isEqual(prevState.setup.bobaFeePriceRatio, bobaFeePriceRatio)) {
      this.setState({ bobaFeePriceRatio })
    }

    if (!isEqual(prevState.setup.netLayer, netLayer)) {
      this.setState({ netLayer })
    }

  }

  async getMaxTransferValue () {

    const {
      layer2,
      bobaFeeChoice,
      bobaFeePriceRatio,
      netLayer
    } = this.state

    // as staking BOBA check the bobabalance
    const token = Object.values(layer2).find((t) => t[ 'symbolL2' ] === 'BOBA')

    // BOBA available prepare transferEstimate
    if (token) {

      let max_BN = BigNumber.from(token.balance.toString())
      let fee = '0'

      if (netLayer === 'L2') {
        let cost_BN = await networkService.savingEstimate()
        console.log([ `cost_BN`, cost_BN ])
        if (bobaFeeChoice) {
          // we are staking BOBA and paying in BOBA
          // so need to subtract the BOBA fee
          max_BN = max_BN.sub(cost_BN.mul(BigNumber.from(bobaFeePriceRatio)))
        }

        // make sure user maintains minimum BOBA in account
        max_BN = max_BN.sub(BigNumber.from(toWei_String(3.0, 18)))

        if (bobaFeeChoice)
          fee = utils.formatUnits(cost_BN.mul(BigNumber.from(bobaFeePriceRatio)), token.decimals)
        else
          fee = utils.formatUnits(cost_BN, token.decimals)
      }
      // if the max amount is less than the gas,
      // set the max amount to zero
      if (max_BN.lt(BigNumber.from('0'))) {
        max_BN = BigNumber.from('0')
      }

      this.setState({
        max_Float_String: utils.formatUnits(max_BN, token.decimals),
        fee
      })

    }

  }

  handleStakeValue(value) {

    const {
      max_Float_String
    } = this.state

    if( value &&
      (Number(value) > 0.0) &&
      (Number(value) <= Number(max_Float_String))
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

    if (addTX) this.props.dispatch(openAlert("Your BOBA were staked"))

    this.setState({ loading: false, stakeValue: '', value_Wei_String: ''})

  }

  render() {

    const {
      stakeInfo,
      accountEnabled,
      netLayer,
      stakeValue,
      loading,
      max_Float_String,
      bobaFeeChoice,
      fee
    } = this.state

    let totalBOBAstaked = 0
    Object.keys(stakeInfo).forEach((v, i) => {
      // only count active stakes
      if(stakeInfo[i].isActive) {
        totalBOBAstaked = totalBOBAstaked + Number(stakeInfo[ i ].depositAmount)
      }
    })

    return (
      <S.StakePageContainer>

        <PageTitle title={'Stake'} />

        <Connect 
          userPrompt={'Please connect to Boba to stake'}
          accountEnabled={accountEnabled}
          connectToBoba={true}
          layer={netLayer}
        />
        
        <Grid container spacing={1} sx={{ my: 2 }}>
          <Grid item sm={6} xs={12}>
            <S.StakeEarnContainer>
              <Box sx={{ my: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Typography variant="body2" sx={{ opacity: 0.65 }}> Stake BOBA Earn BOBA </Typography>
                <Typography variant="h1"
                  sx={{
                    background: '-webkit-linear-gradient(269deg, #CBFE00 15.05%, #1CD6D1 79.66%)',
                    'WebkitBackgroundClip': 'text',
                    'WebkitTextFillColor': 'transparent'
                  }}
                > 5% Fixed APY </Typography>
                <S.DividerLine sx={{ width: '60%' }} />
              </Box>
              <S.StakeItem sx={{ my: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', flexDirection: 'column' }}>
                  <Typography variant="body2" sx={{ opacity: 0.65 }}>
                    Active stakes
                  </Typography>
                  <Typography variant="h3" >
                    {totalBOBAstaked} BOBA
                  </Typography>
                </Box>
              </S.StakeItem>
            </S.StakeEarnContainer>
            <S.StakeInputContainer>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body2"> BOBA Balance:</Typography>
                <Typography variant="body2"> {max_Float_String} </Typography>
              </Box>
              <Input
                placeholder={`Amount to stake`}
                value={stakeValue}
                type="number"
                // unit={'BOBA'}
                maxValue={max_Float_String}
                onChange={i=>{this.handleStakeValue(i.target.value)}}
                onUseMax={i=>{this.handleStakeValue(max_Float_String)}}
                newStyle
                disabled={netLayer !== 'L2'}
                variant="standard"
              />
              {netLayer === 'L2' && bobaFeeChoice && fee &&
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Fee: {fee} BOBA
                </Typography>
              }

              {netLayer === 'L2' && !bobaFeeChoice && fee &&
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Fee: {fee} ETH
                </Typography>
              }

              { netLayer === 'L2' &&
                  <Button
                    color="primary"
                    variant="outlined"
                    onClick={() => {this.handleConfirm()}}
                    loading={loading}
                    disabled={!accountEnabled}
                    fullWidth={true}
                  >
                    Stake
                  </Button>
              }
            </S.StakeInputContainer>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px', p: '24px' }} style={{lineHeight: '1.0em'}}>
              <Box>
                <Typography variant="body2">
                  <Circle sx={{ height: "6px", color: '#BAE21A', mr: 1, width: "6px" }} /> STAKING PERIOD
                </Typography>
                <Typography variant="body3" sx={{ opacity: 0.65 }}>
                  Each staking period lasts 2 weeks. If you do not unstake after a staking period, your stake will be automatically renewed.
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" >
                  <Circle sx={{ height: "6px", color: '#BAE21A', mr: 1, width: "6px" }} /> UNSTAKING WINDOW
                </Typography>
                <Typography variant="body3" sx={{ opacity: 0.65 }}>
                  The first two days of every staking period, except for the first staking period, are the unstaking window. You can only unstake during the unstaking window.
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item sm={6} xs={12}>
            <S.StakeHeadContainer>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BobaGlassIcon />
                <Typography variant="body1" >
                  Stake BOBA
                </Typography>
              </Box>
            </S.StakeHeadContainer>
            {Object.keys(stakeInfo).length === 0 ? <S.StakeContainer>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                }}
              >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.1204 2.66504C7.51906 2.66504 5.37107 4.63837 5.37107 7.12371V24.8731C5.37107 27.3585 7.51906 29.3318 10.1204 29.3318H21.9551C24.5564 29.3318 26.7044 27.3585 26.7044 24.8731C26.7044 24.0051 26.7044 14.4757 26.7044 11.9984C26.7044 11.9851 26.7044 11.9704 26.7044 11.9571C26.7044 7.20638 22.1191 2.66504 17.3711 2.66504C11.7524 2.66504 11.7391 2.66504 10.1204 2.66504ZM10.1204 5.33171C11.4417 5.33171 12.9364 5.33171 16.0377 5.33171V8.87307C16.0377 11.3584 18.1857 13.3317 20.7871 13.3317H24.0377C24.0377 16.7144 24.0377 24.0944 24.0377 24.8731C24.0377 25.8251 23.1391 26.6651 21.9551 26.6651H10.1204C8.93639 26.6651 8.03773 25.8251 8.03773 24.8731V7.12371C8.03773 6.17171 8.93639 5.33171 10.1204 5.33171ZM18.7044 5.49838C21.0671 6.12505 23.2591 8.30906 23.8711 10.6651H20.7871C19.6017 10.6651 18.7044 9.82507 18.7044 8.87307V5.49838ZM12.0377 10.6651C11.3017 10.6651 10.7044 11.2624 10.7044 11.9984C10.7044 12.7344 11.3017 13.3317 12.0377 13.3317H13.3711C14.1071 13.3317 14.7044 12.7344 14.7044 11.9984C14.7044 11.2624 14.1071 10.6651 13.3711 10.6651H12.0377ZM12.0377 15.9984C11.3017 15.9984 10.7044 16.5957 10.7044 17.3318C10.7044 18.0678 11.3017 18.6651 12.0377 18.6651H20.0377C20.7737 18.6651 21.3711 18.0678 21.3711 17.3318C21.3711 16.5957 20.7737 15.9984 20.0377 15.9984H12.0377ZM12.0377 21.3318C11.3017 21.3318 10.7044 21.9291 10.7044 22.6651C10.7044 23.4011 11.3017 23.9984 12.0377 23.9984H20.0377C20.7737 23.9984 21.3711 23.4011 21.3711 22.6651C21.3711 21.9291 20.7737 21.3318 20.0377 21.3318H12.0377Z" fill="white" fillOpacity="0.65" />
                </svg>
                <Typography variant="body3" sx={{ opacity: 0.65 }}>
                  {accountEnabled ? 'No Content': 'Please connect to wallet first'}
                </Typography>
              </Box>
            </S.StakeContainer>
              :
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'center',
                gap: '10px'
              }}>
                {Object.keys(stakeInfo).map((v, i) => {
                  if(stakeInfo[i].isActive) {
                    return (
                      <S.StakeItemContainer key={i}>
                        <ListSave stakeInfo={stakeInfo[i]} />
                      </S.StakeItemContainer>
                    )
                  }
                  return null;
                })}
              </Box>
            }
          </Grid>
        </Grid>
      </S.StakePageContainer>
    )
  }
}

const mapStateToProps = state => ({
  fixed: state.fixed,
  setup: state.setup,
  balance: state.balance,
})

export default connect(mapStateToProps)(Save)
