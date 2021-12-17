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

import React from 'react';
import { connect } from 'react-redux';
import { isEqual } from 'lodash';

import { getFS_Saves, getFS_Info } from 'actions/fixedAction'

import ListSave from 'components/listSave/listSave'
import Tabs from 'components/tabs/Tabs'
import AlertIcon from 'components/icons/AlertIcon'
import networkService from 'services/networkService'

import { openAlert, openModal } from 'actions/uiAction'

import * as S from './Save.styles'
import * as styles from './Save.module.scss'

import { Box, FormControlLabel, Checkbox, Typography, Fade, Button } from '@material-ui/core'
import PageHeader from 'components/pageHeader/PageHeader'
import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

class Save extends React.Component {

  constructor(props) {

    super(props)

    const {
      stakeCount,
      stakeInfo
    } = this.props.fixed

    this.state = {
      stakeCount,
      stakeInfo,
      loading: false,
    }

  }

  componentDidMount() {
    this.props.dispatch(getFS_Saves())
    this.props.dispatch(getFS_Info())
  }

  componentDidUpdate(prevState) {

    const {
      stakeCount,
      stakeInfo
    } = this.props.fixed

    if (!isEqual(prevState.fixed.stakeCount, stakeCount)) {
      this.setState({ stakeCount })
    }

    if (!isEqual(prevState.fixed.stakeInfo, stakeInfo)) {
      this.setState({ stakeInfo })
    }

  }

  // getBalance(address, chain) {

  //   const { layer1, layer2 } = this.state

  //   if (typeof (layer1) === 'undefined') return [0, 0]
  //   if (typeof (layer2) === 'undefined') return [0, 0]

  //   if (chain === 'L1') {
  //     let tokens = Object.entries(layer1)
  //     for (let i = 0; i < tokens.length; i++) {
  //       if (tokens[i][1].address.toLowerCase() === address.toLowerCase()) {
  //         return [tokens[i][1].balance, tokens[i][1].decimals]
  //       }
  //     }
  //   }
  //   else if (chain === 'L2') {
  //     let tokens = Object.entries(layer2)
  //     for (let i = 0; i < tokens.length; i++) {
  //       if (tokens[i][1].address.toLowerCase() === address.toLowerCase()) {
  //         return [tokens[i][1].balance, tokens[i][1].decimals]
  //       }
  //     }
  //   }

  //   return [0, 0]

  // }

  // handleChange = (event, t) => {
  //   if (t === 'L1 Liquidity Pool')
  //     this.setState({
  //       lpChoice: 'L1LP',
  //       poolTab: t
  //     })
  //   else if (t === 'L2 Liquidity Pool')
  //     this.setState({
  //       lpChoice: 'L2LP',
  //       poolTab: t
  //     })
  // }

  // handleCheckBox = (e) => {
  //   this.setState({
  //     showMDO: e.target.checked
  //   })
  // }

  // handleCheckBoxStakes = (e) => {
  //   this.setState({
  //     showMSO: e.target.checked
  //   })
  // }


  async handleAddSave() {
    this.props.dispatch(openModal('saveDepositModal'))
  }

  render() {

    const {
      stakecount,
      stakeInfo,
      loading,
      // userInfo,
      // lpChoice,
      // poolTab,
      // showMDO,
      // showMSO,
      //dropDownBox,
    } = this.state

    const { isMobile } = this.props
    const networkLayer = networkService.L1orL2

    console.log("stakeInfo:",stakeInfo)

    if(networkLayer === 'L1') {
        return <div className={styles.container}>
            <PageHeader title="Fixed Rate Staking" />
            <S.LayerAlert>
              <S.AlertInfo>
                <AlertIcon />
                <S.AlertText
                  variant="body2"
                  component="p"
                >
                  You are on Ethereum Mainnet. To use stake your BOBA, SWITCH to Boba
                </S.AlertText>
              </S.AlertInfo>
              <LayerSwitcher isButton={true} />
            </S.LayerAlert>
        </div>
    }

    return (
      <>
        <PageHeader title="Fixed Rate Staking" />

        <S.Wrapper>

          <S.GridItemTagContainer container spacing={2} direction="row" justifyContent="left" alignItems="center" >

            <S.GridItemTag 
              item xs={10} 
              md={10}
            > 
              <Typography variant="body2" sx={{ mt: 2, fontSize: '0.8em' }}>
                <span style={{fontWeight: '700'}}>EARNINGS/APR:</span> The bridges collect fees and then immediately distribute 
                them to stakers. The bridges are not farms. Your earnings only increase when someone uses the 
                bridge you have staked into. The <span style={{fontWeight: '700'}}>APR</span> is the historical APR, which 
                reflects the fees people paid to bridge and the previous usage patterns for each pool.
                <br/>
                <br/>
                The supply of tokens in the pools reflects the staking and bridging activities of all users.
                {' '}<span style={{fontWeight: '700'}}>LIQUIDITY</span> denotes the funds staked by liquidity providers, while the
                {' '}<span style={{fontWeight: '700'}}>AVAILABLE BALANCE</span> refers to the amount of funds currently in each pool.
              </Typography>
            </S.GridItemTag>

          </S.GridItemTagContainer>

        </S.Wrapper>

        <Box sx={{ my: 3, width: '100%' }}>

          <Button
            variant="contained"
            onClick={()=>{this.handleAddSave()}}
            disabled={loading}
            sx={{flex: 1, marginTop: '20px', marginBottom: '20px'}}
          >
            {loading ? 'Depositing...' : 'Add Stake'}
          </Button>

          {!isMobile ? (
            <S.TableHeading>
              <S.GridItemTagContainer container spacing={1} direction="row" justifyContent="left" alignItems="center" >
                <S.GridItemTag item xs={4} md={3}><Typography variant="body2">Amount</Typography></S.GridItemTag>
                <S.GridItemTag item xs={4} md={3}><Typography variant="body2">Staked</Typography></S.GridItemTag>
                <S.GridItemTag item xs={4} md={3}><Typography variant="body2">Status</Typography></S.GridItemTag>
                <S.GridItemTag item xs={12} md={3}><Typography variant="body2">Actions</Typography></S.GridItemTag>
              </S.GridItemTagContainer>
            </S.TableHeading>
          ) : (null)}

            <S.FarmListContainer>
              {Object.keys(stakeInfo).map((v, i) => {
                return (
                  <ListSave
                    key={i}
                    stakeInfo={stakeInfo[i]}
                  />
                )
              })}
            </S.FarmListContainer>

        </Box>
      </>
    )
  }
}

const mapStateToProps = state => ({
  fixed: state.fixed,
})

export default connect(mapStateToProps)(Save)
