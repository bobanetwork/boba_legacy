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

import { getFS_Saves, getFS_Info } from 'actions/fixedAction'

import ListSave from 'components/listSave/listSave'

import AlertIcon from 'components/icons/AlertIcon'

import { openModal } from 'actions/uiAction'
import Button from 'components/button/Button'

import * as S from './Save.styles'
import * as styles from './Save.module.scss'

import { Box, Typography, Grid } from '@material-ui/core'

import PageHeader from 'components/pageHeader/PageHeader'
import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'
import WalletPicker from 'components/walletpicker/WalletPicker'

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

    this.state = {
      stakeInfo,
      accountEnabled,
      netLayer, 
      loading: false,
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
    if(this.state.accountEnabled)
      this.props.dispatch(openModal('saveDepositModal'))
  }

  render() {

    const {
      stakeInfo,
      loading,
      accountEnabled,
      netLayer
    } = this.state

    const { isMobile } = this.props

    if(netLayer === 'L1') {
        return <div className={styles.container}>
            <PageHeader title="Staking" />
            <S.LayerAlert>
              <S.AlertInfo>
                <AlertIcon />
                <S.AlertText
                  variant="body2"
                  component="p"
                >
                  You are on Ethereum Mainnet. Staking@5% is only available on Boba. SWITCH to Boba
                </S.AlertText>
              </S.AlertInfo>
              <LayerSwitcher isButton={true}/>
            </S.LayerAlert>
        </div>
    }


    if(!netLayer) {
      return <div className={styles.container}>
          <PageHeader title="Staking" />
          <S.LayerAlert>
            <S.AlertInfo>
              <AlertIcon />
              <S.AlertText
                variant="body2"
                component="p"
              >
                You have not connected your wallet. To stake on BOBA, connect to MetaMask
              </S.AlertText>
            </S.AlertInfo>
            <WalletPicker />
          </S.LayerAlert>
      </div>
    }

    return (
      <>
        <PageHeader title="Staking" />

        <S.Wrapper>
          <Grid 
            container 
            spacing={2} 
          >
            <S.GridItemTag 
              item 
              xs={10} 
              md={10}
              style={{padding: 0, paddingLeft: '20px'}}
            >
              <Typography variant="body2" sx={{ mt: 2, fontSize: '0.8em' }}>
                <span style={{fontWeight: '700'}}>EARNINGS/APR</span>: You will earn an APR of 5%. 
                <br/>
                <span style={{fontWeight: '700'}}>STAKING PERIOD</span>: Each staking period lasts 2 weeks.  
                Your stake will be automatically renewed until you unstake.
                <br/>
                <span style={{fontWeight: '700'}}>UNSTAKING WINDOW</span>: You can 
                unstake in the two days after each staking window.
              </Typography>
            </S.GridItemTag>
          </Grid>
        </S.Wrapper>

        <Box sx={{ my: 3, width: '100%' }}>

          {accountEnabled &&
            <Button
              variant="contained"
              onClick={()=>{this.handleAddSave()}}
              disabled={loading}
              sx={{flex: 1, marginTop: '20px', marginBottom: '20px'}}
            >
              {loading ? 'Staking...' : 'Stake BOBA'}
            </Button>
          }

          {!isMobile ? (
            <S.TableHeading>
              <Grid 
                container 
                spacing={1}
              >
                <S.GridItemTag item md={1}><Typography variant="body2">Amount</Typography></S.GridItemTag>
                <S.GridItemTag item md={3}><Typography variant="body2">Deposited On</Typography></S.GridItemTag>
                <S.GridItemTag item md={1}><Typography variant="body2">Earned</Typography></S.GridItemTag>
                <S.GridItemTag item md={1}><Typography variant="body2">Status</Typography></S.GridItemTag>
                <S.GridItemTag item md={4}><Typography variant="body2">Next Unstake Window</Typography></S.GridItemTag>
                <S.GridItemTag item md={2}><Typography variant="body2">Actions</Typography></S.GridItemTag>
              </Grid>
            </S.TableHeading>
          ) : (null)}

            <S.ListContainer>
              {Object.keys(stakeInfo).map((v, i) => {
                return (
                  <ListSave
                    key={i}
                    stakeInfo={stakeInfo[i]}
                    isMobile={isMobile}
                  />
                )
              })}
            </S.ListContainer>

        </Box>
      </>
    )
  }
}

const mapStateToProps = state => ({
  fixed: state.fixed,
  setup: state.setup,
})

export default connect(mapStateToProps)(Save)
