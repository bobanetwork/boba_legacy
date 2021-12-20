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
import networkService from 'services/networkService'

import { openModal } from 'actions/uiAction'
import Button from 'components/button/Button'

import * as S from './Save.styles'
import * as styles from './Save.module.scss'

import { Box, Typography, Grid } from '@material-ui/core'

import PageHeader from 'components/pageHeader/PageHeader'
import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'

class Save extends React.Component {

  constructor(props) {

    super(props)

    const {
      stakeInfo,
    } = this.props.fixed

    this.state = {
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
      stakeInfo
    } = this.props.fixed

    if (!isEqual(prevState.fixed.stakeInfo, stakeInfo)) {
      this.setState({ stakeInfo })
    }

  }

  async handleAddSave() {
    this.props.dispatch(openModal('saveDepositModal'))
  }

  render() {

    const {
      stakeInfo,
      loading,
    } = this.state

    const { isMobile } = this.props
    const networkLayer = networkService.L1orL2

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
                  You are on Ethereum Mainnet. This function is only available on Boba. SWITCH to Boba
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

          <Grid 
            container 
            spacing={2} 
          >

            <S.GridItemTag 
              item 
              xs={10} 
              md={10}
            >
              <Typography variant="body2" sx={{ mt: 2, fontSize: '0.8em' }}>
                <span style={{fontWeight: '700'}}>EARNINGS/APR:</span> You will earn an APR of 5%. 
                <br/>
                <span style={{fontWeight: '700'}}>STAKING PERIOD:</span> Each staking period lasts 2 weeks. 
                If you do not unstake after a staking period, your stake will be automatically renewed.
                <br/>
                <span style={{fontWeight: '700'}}>UNSTAKING WINDOW:</span> The first two days of every 
                staking period, except for the first staking period, are the unstaking window. You can 
                only unstake during the unstaking window.
              </Typography>
            </S.GridItemTag>

          </Grid>

        </S.Wrapper>

        <Box sx={{ my: 3, width: '100%' }}>

          <Button
            variant="contained"
            onClick={()=>{this.handleAddSave()}}
            disabled={loading}
            sx={{flex: 1, marginTop: '20px', marginBottom: '20px'}}
          >
            {loading ? 'Depositing...' : 'Deposit BOBA'}
          </Button>

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
})

export default connect(mapStateToProps)(Save)
