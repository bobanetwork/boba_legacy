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

import { openAlert, openError, openModal } from 'actions/uiAction'

import * as S from './Save.styles'

import { Box, Typography, Grid } from '@mui/material'
import { Circle } from '@mui/icons-material'

import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'
import WalletPicker from 'components/walletpicker/WalletPicker'
import PageTitle from 'components/pageTitle/PageTitle'
import BobaGlassIcon from 'components/icons/BobaGlassIcon'
import Input from 'components/input/Input'
import Button from 'components/button/Button'
import ListSave from 'components/listSave/listSave'

import { logAmount, toWei_String } from 'util/amountConvert'

class Save extends React.Component {

  constructor(props) {

    super(props)

    const {
      stakeInfo,
    } = this.props.fixed

    const {
      accountEnabled,
      netLayer
    } = this.props.setup

    const {
      layer2,
    } = this.props.balance

    this.state = {
      stakeInfo,
      accountEnabled,
      netLayer,
      loading: false,
      layer2,
      stakeValue: '',
      stakeValueValid: false,
      value_Wei_String: ''
    }

  }

  componentDidMount() {
    this.props.dispatch(getFS_Saves())
    this.props.dispatch(getFS_Info())
  }

  componentDidUpdate(prevState) {

    const {
      stakeInfo
    } = this.props.fixed

    const {
      accountEnabled,
      netLayer
    } = this.props.setup

    const { layer2 } = this.props.balance

    if (!isEqual(prevState.balance.layer2, layer2)) {
      this.setState({ layer2 })
    }

    if (!isEqual(prevState.fixed.stakeInfo, stakeInfo)) {
      this.setState({ stakeInfo })
    }

    if (!isEqual(prevState.setup.accountEnabled, accountEnabled)) {
      this.setState({ accountEnabled })
    }

    if (!isEqual(prevState.setup.netLayer, netLayer)) {
      this.setState({ netLayer })
    }

  }

  async handleAddSave() {
    if (this.state.accountEnabled)
      this.props.dispatch(openModal('saveDepositModal'))
  }


  getMaxTransferValue () {
    const { layer2 } = this.state
    const bobaBalance = Object.keys(layer2).reduce((acc, cur) => {
      if (layer2[cur]['symbolL2'] === 'BOBA') {
        const bal = layer2[cur]['balance']
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
    } else {
      this.props.dispatch(openError("Failed to stake BOBA"))
      this.setState({ loading: false, stakeValue: '', value_Wei_String: ''})
    }
  }


  render() {

    const {
      stakeInfo,
      accountEnabled,
      netLayer,
      layer2,
      stakeValue,
      loading

    } = this.state


    let bobaBalance = layer2.filter((i) => {
      if (i.symbol === 'BOBA') return true
      return false
    })

    let bobaWeiString = '0'
    if (typeof (bobaBalance[ 0 ]) !== 'undefined') {
      bobaWeiString = bobaBalance[ 0 ].balance.toString()
    }

    let l2BalanceBOBA = Number(logAmount(bobaWeiString, 18))

    let totalBOBAstaked = 0
    Object.keys(stakeInfo).forEach((v, i) => {
      // console.log("Stakeinfo:",stakeInfo[i])
      // only count active stakes
      if(stakeInfo[i].isActive) {
        totalBOBAstaked = totalBOBAstaked + Number(stakeInfo[ i ].depositAmount)
      }
    })

    return (
      <S.StakePageContainer>
        <Box sx={{ my: 1 }}>
          <PageTitle title="Stake" />
          {(netLayer !== 'L2') ?
            <Typography variant="body2" sx={{ color: '#FF6A55' }}><Circle sx={{ height: "10px", width: "10px" }} /> Not connected to Boba L2</Typography>
            : <Typography variant="body2" sx={{ color: '#BAE21A' }}><Circle sx={{ height: "10px", width: "10px" }} /> Connected </Typography>
          }
        </Box>
        <Grid container spacing={1} sx={{ my: 2 }}>
          <Grid item sm={6} xs={12}>
            <S.StakeEarnContainer>
              <Box sx={{ my: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Typography variant="body2" sx={{ opacity: 0.65 }}> Stake Boba Earn Boba </Typography>
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
                    {totalBOBAstaked} Boba
                  </Typography>
                  {/*<Typography variant="body2" sx={{ opacity: 0.65 }}>
                    ≈ $0
                  </Typography>*/}
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
                <Typography variant="body2"> Boba Balance:</Typography>
                <Typography variant="body2"> {l2BalanceBOBA} </Typography>
              </Box>
              <Input
                placeholder={`Amount to stake`}
                value={stakeValue}
                type="number"
                // unit={'BOBA'}
                maxValue={this.getMaxTransferValue()}
                onChange={i=>{this.handleStakeValue(i.target.value)}}
                onUseMax={i=>{this.handleStakeValue(this.getMaxTransferValue())}}
                newStyle
                disabled={netLayer !== 'L2'}
                variant="standard"
              />
              {!netLayer ?
                <WalletPicker fullWidth={true} label="Connect" /> :
                netLayer === 'L2' ?
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
                  :
                  <S.LayerAlert>
                    <S.AlertInfo>
                      <AlertIcon />
                      <S.AlertText
                        variant="body3"
                        component="p"
                      >
                        You are on Ethereum. To stake, SWITCH to Boba
                      </S.AlertText>
                    </S.AlertInfo>
                    <LayerSwitcher fullWidth={true} isButton={true} />
                  </S.LayerAlert>
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
                  Stake Boba
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
                  No Content
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
