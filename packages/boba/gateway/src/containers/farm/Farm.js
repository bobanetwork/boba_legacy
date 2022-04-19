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

import { getFarmInfo } from 'actions/farmAction'

import ListFarm from 'components/listFarm/listFarm'
import AlertIcon from 'components/icons/AlertIcon'
import networkService from 'services/networkService'

import * as S from './Farm.styles'

import { Box, FormControlLabel, Checkbox, Typography } from '@mui/material'
import Tooltip from 'components/tooltip/Tooltip';
import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'

import Connect from 'containers/connect/Connect'
import PageTitle from 'components/pageTitle/PageTitle'

import { HelpOutline } from '@mui/icons-material'

class Farm extends React.Component {

  constructor(props) {

    super(props)

    const {
      poolInfo,
      userInfo
    } = this.props.farm

    const {
      layer1,
      layer2
    } = this.props.balance

    const {
      baseEnabled,
      accountEnabled,
      layer
    } = this.props.setup

    let initialViewLayer = 'Ethereum Pool'
    let initialLayer = 'L1LP'

    if (networkService.L1orL2 === 'L2') {
      initialViewLayer = 'Boba L2 Pool'
      initialLayer = 'L2LP'
    }

    this.state = {
      poolInfo,
      userInfo,
      layer,
      layer1,
      layer2,
      lpChoice: initialLayer,
      poolTab: initialViewLayer,
      showMDO: false, //MDO = my deposits only
      showMSO: false, //MSO = my stakes only
      dropDownBox: false,
      dropDownBoxInit: true,
      // provider status
      baseEnabled,
      accountEnabled
    }

  }

  componentDidMount() {
    if (this.state.baseEnabled) {
      this.props.dispatch(getFarmInfo())
    }
  }

  componentDidUpdate(prevState) {

    const {
      poolInfo,
      userInfo,
    } = this.props.farm

    const {
      layer1,
      layer2
    } = this.props.balance

    const {
      baseEnabled,
      accountEnabled,
      layer
    } = this.props.setup

    if (!isEqual(prevState.farm.poolInfo, poolInfo)) {
      this.setState({ poolInfo })
    }

    if (!isEqual(prevState.farm.userInfo, userInfo)) {
      this.setState({ userInfo })
      if (accountEnabled) this.setState({ accountEnabled })
    }

    if (!isEqual(prevState.balance.layer1, layer1)) {
      this.setState({ layer1 })
    }

    if (!isEqual(prevState.balance.layer2, layer2)) {
      this.setState({ layer2 })
    }

    if (prevState.setup.baseEnabled !== baseEnabled) {
      this.props.dispatch(getFarmInfo())
      this.setState({ baseEnabled })
    }

    if (prevState.setup.accountEnabled !== accountEnabled) {
      this.props.dispatch(getFarmInfo())
      if (!accountEnabled) this.setState({ accountEnabled })
    }

    if (prevState.setup.layer !== layer) {
      this.setState({ layer })
    }
  }

  getBalance(address, chain) {

    const { layer1, layer2 } = this.state

    if (typeof (layer1) === 'undefined') return [ 0, 0 ]
    if (typeof (layer2) === 'undefined') return [ 0, 0 ]

    if (chain === 'L1') {
      let tokens = Object.entries(layer1)
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[ i ][ 1 ].address.toLowerCase() === address.toLowerCase()) {
          return [ tokens[ i ][ 1 ].balance, tokens[ i ][ 1 ].decimals ]
        }
      }
    }
    else if (chain === 'L2') {
      let tokens = Object.entries(layer2)
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[ i ][ 1 ].address.toLowerCase() === address.toLowerCase()) {
          return [ tokens[ i ][ 1 ].balance, tokens[ i ][ 1 ].decimals ]
        }
      }
    }

    return [ 0, 0 ]

  }

  handleChange = (event, t) => {
    if (t === 'Ethereum Pool') {
      this.setState({
        lpChoice: 'L1LP',
        poolTab: t
      })
    } else if (t === 'Boba L2 Pool') {
      this.setState({
        lpChoice: 'L2LP',
        poolTab: t
      })
    }
  }

  handleCheckBox = (e) => {
    this.setState({
      showMDO: e.target.checked
    })
  }

  handleCheckBoxStakes = (e) => {
    this.setState({
      showMSO: e.target.checked
    })
  }

  render() {

    const {
      poolInfo,
      userInfo,
      lpChoice,
      poolTab,
      showMDO,
      showMSO,
      accountEnabled,
      layer,
    } = this.state

    const { isMobile } = this.props

    return (
      <S.EarnPageContainer>

        <PageTitle title={'Earn'} />

        <Connect 
          userPrompt={'Connect to MetaMask to see your balances and contribute to the liquidity pool '}
          accountEnabled={accountEnabled}
        />

        <Box sx={{ my: 1, width: '100%' }}>
          <S.EarnActionContainer sx={{ mb: 2, display: 'flex' }}>
            <S.PageSwitcher>
              <Typography
                className={poolTab === 'Ethereum Pool' ? 'active' : ''}
                onClick={() => this.handleChange(null, 'Ethereum Pool')}
                variant="body2"
                component="span">
                Ethereum Pools
              </Typography>
              <Typography
                className={poolTab === 'Boba L2 Pool' ? 'active' : ''}
                onClick={() => this.handleChange(null, 'Boba L2 Pool')}
                variant="body2"
                component="span">
                Boba Pools
              </Typography>
            </S.PageSwitcher>

            <S.FarmAction>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showMDO}
                    onChange={this.handleCheckBox}
                    name="my tokens only"
                    color="primary"
                    icon={<S.BpIcon />}
                  />
                }
                label="My Tokens Only"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showMSO}
                    onChange={this.handleCheckBoxStakes}
                    name="my stakes only"
                    color="primary"
                    icon={<S.BpIcon />}
                  />
                }
                label="My Stakes Only"
              />
            </S.FarmAction>

          </S.EarnActionContainer>

          <S.Help>
            
            <Typography variant="body3">
              Bridging fees are proportionally distributed to stakers. The bridges are not farms. 
              Your earnings only increase when someone uses the bridge you have staked into.
            </Typography>

            <Tooltip
              title={
                <Typography variant="body2" sx={{ mt: 1, fontSize: '0.9em' }}>
                  <span style={{ fontWeight: '700' }}>Staking example</span>. When you stake 10 OMG into the L2 pool, then the pool's liquidity and balance both increase by 10 OMG.
                  <br /><br />
                  <span style={{ fontWeight: '700' }}>Fast Bridge example</span>. When a user bridges 10 OMG from L1 to L2 using the fast bridge,
                  they send 10 OMG to the L1 pool, increasing its balance by 10 OMG. Next, 9.99 OMG flow out from the L2 pool to the user's L2 wallet, completing the bridge.
                  Note that bridge operations do not change the pool's liquidity, but only its balance.
                  The difference between what was deposited into the L1 pool (10 OMG) and what was sent
                  to the user on the L2 (9.99 OMG), equal to 0.01 OMG, is sent to the reward pool, for harvesting by stakers.
                  <br /><br />
                  <span style={{ fontWeight: '700' }}>Pool rebalancing</span>. In some circumstances, excess balances can accumulate on one chain. For example, if many people
                  bridge from L1 to L2, then L1 pool balances will increase, while L2 balances will decrease. When needed, the pool operator can
                  rebalance the pools, using 'classic' deposit and exit operations to move funds from one pool to another. Rebalancing takes 7 days, due to the 
                  7 day fraud proof window, which also applies to the operator.
                  <br /><br />
                  <span style={{ fontWeight: '700' }}>Dynamic fees</span>. The pools use an automatic supply-and-demand approach to setting the fees.
                  When a pool's liquidity is low, the fees are increased to attract more liquidity into that pool and vice-versa.
                </Typography>
              }
            >
              <HelpOutline fontSize="small" sx={{ opacity: 0.65 }} />
            </Tooltip>
          </S.Help>

          {layer === 'L2' && lpChoice === 'L1LP' &&
            <S.LayerAlert>
              <S.AlertInfo>
                <AlertIcon sx={{ flex: 1 }} />
                <S.AlertText
                  variant="body1"
                  component="p"
                >
                  You are on L2. To transact on L1, SWITCH LAYER to L1
                </S.AlertText>
              </S.AlertInfo>
              <LayerSwitcher isButton={true} size={isMobile ? "small" : "medium"} />
            </S.LayerAlert>
          }

          {layer === 'L1' && lpChoice === 'L2LP' &&
            <S.LayerAlert>
              <S.AlertInfo>
                <AlertIcon />
                <S.AlertText
                  variant="body2"
                  component="p"
                >
                  You are on L1. To transact on L2, SWITCH LAYER to L2
                </S.AlertText>
              </S.AlertInfo>
              <LayerSwitcher isButton={true} />
            </S.LayerAlert>
          }

          {!isMobile ? (
            <S.TableHeading>
              <S.GridItemTagContainer
                container spacing={1} direction="row" alignItems="center"
                sx={{
                  justifyContent: "space-around"
                }}
              >
                <S.GridItemTag item xs={4} md={2}>
                  <Typography variant="body2" sx={{
                    opacity: 0.65
                  }}>Token</Typography>
                </S.GridItemTag>
                <S.GridItemTag item xs={4} md={2}>
                  <Typography variant="body2" sx={{
                    opacity: 0.65
                  }} whiteSpace="nowrap">Available Balance
                  </Typography>
                  <Tooltip title="Available Balance refers to the amount of funds currently in each pool.">
                    <HelpOutline fontSize="small" sx={{ opacity: 0.65 }} />
                  </Tooltip>
                </S.GridItemTag>
                <S.GridItemTag item xs={4} md={2}>
                  <Typography variant="body2" sx={{
                    opacity: 0.65
                  }} whiteSpace="nowrap">Total Staked
                  </Typography>
                  <Tooltip title="Total staked denotes the funds staked by liquidity providers.">
                    <HelpOutline fontSize="small" sx={{ opacity: 0.65 }} />
                  </Tooltip>
                </S.GridItemTag>
                <S.GridItemTag item xs={4} md={2}>
                  <Typography variant="body2" sx={{
                    opacity: 0.65
                  }} whiteSpace="nowrap">Past APR %
                  </Typography>
                  <Tooltip title="The APR is the historical APR, which reflects the fees people paid to bridge and the previous usage patterns for each pool.">
                    <HelpOutline fontSize="small" sx={{ opacity: 0.65 }} />
                  </Tooltip>
                </S.GridItemTag>
                <S.GridItemTag item xs={3} md={2}>
                  <Typography variant="body2" sx={{
                    opacity: 0.65
                  }} whiteSpace="nowrap">Your Stake</Typography>
                </S.GridItemTag>
                <S.GridItemTag item xs={3} md={1}>
                  <Typography variant="body2" sx={{
                    opacity: 0.65
                  }}>Earned</Typography>
                </S.GridItemTag>
                <S.GridItemTag item xs={3} md={1}>
                  <Typography variant="body2" sx={{
                    opacity: 0.65
                  }}>Actions</Typography>
                </S.GridItemTag>
              </S.GridItemTagContainer>
            </S.TableHeading>
          ) : (null)}

          {lpChoice === 'L1LP' &&
            <S.FarmListContainer>
              {Object.keys(poolInfo.L1LP).map((v, i) => {
                const ret = this.getBalance(v, 'L1')
                if (showMDO && Number(ret[ 0 ]) === 0) return null
                return (
                  <ListFarm
                    key={i}
                    poolInfo={poolInfo.L1LP[ v ]}
                    userInfo={userInfo.L1LP[ v ]}
                    L1orL2Pool={lpChoice}
                    balance={ret[ 0 ]}
                    decimals={ret[ 1 ]}
                    isMobile={isMobile}
                    showStakesOnly={showMSO}
                    accountEnabled={accountEnabled}
                  />
                )
              })}
            </S.FarmListContainer>}

          {lpChoice === 'L2LP' &&
            <S.FarmListContainer>
              {Object.keys(poolInfo.L2LP).map((v, i) => {
                const ret = this.getBalance(v, 'L2')
                if (showMDO && Number(ret[ 0 ]) === 0) return null
                return (
                  <ListFarm
                    key={i}
                    poolInfo={poolInfo.L2LP[ v ]}
                    userInfo={userInfo.L2LP[ v ]}
                    L1orL2Pool={lpChoice}
                    balance={ret[ 0 ]}
                    decimals={ret[ 1 ]}
                    isMobile={isMobile}
                    showStakesOnly={showMSO}
                    accountEnabled={accountEnabled}
                  />
                )
              })}
            </S.FarmListContainer>
          }
        </Box>
      </S.EarnPageContainer>
    )
  }
}

const mapStateToProps = state => ({
  farm: state.farm,
  balance: state.balance,
  setup: state.setup,
})

export default connect(mapStateToProps)(Farm)
