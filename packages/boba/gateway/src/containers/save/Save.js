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

  async handleAddSave() {
    this.props.dispatch(openModal('saveDepositModal'))
  }

  render() {

    const {
      stakecount,
      stakeInfo,
      loading,
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
                <span style={{fontWeight: '700'}}>EARNINGS/APR:</span> You will earn an APR of 5%. 
                <br/>
                <span style={{fontWeight: '700'}}>UNSTAKING:</span> Each staking period lasts 2 weeks. 
                If you do not unstake after a staking period, your stake will be renewed in two week increments until you unstake. 
                The unstaking window lasts 2 days. You can only unstake in the unstaking window.
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
                <S.GridItemTag item xs={4} md={1}><Typography variant="body2">Amount</Typography></S.GridItemTag>
                <S.GridItemTag item xs={4} md={2}><Typography variant="body2">Deposited On</Typography></S.GridItemTag>
                <S.GridItemTag item xs={4} md={1}><Typography variant="body2">Earned</Typography></S.GridItemTag>
                <S.GridItemTag item xs={4} md={1}><Typography variant="body2">Status</Typography></S.GridItemTag>
                <S.GridItemTag item xs={4} md={2}><Typography variant="body2">Next Unstake Window</Typography></S.GridItemTag>
                <S.GridItemTag item xs={4} md={2}><Typography variant="body2">Actions</Typography></S.GridItemTag>
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
