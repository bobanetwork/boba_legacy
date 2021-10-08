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

import { getFarmInfo, getFee } from 'actions/farmAction'

import ListFarm from 'components/listFarm/listFarm'
import Tabs from 'components/tabs/Tabs'
import AlertIcon from 'components/icons/AlertIcon'
import networkService from 'services/networkService'

import * as S from './Farm.styles'
import { Box, FormControlLabel, Checkbox, Typography, Fade, Grid } from '@material-ui/core'
import PageHeader from 'components/pageHeader/PageHeader'
import { tableHeadList } from './tableHeadList'
import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

class Farm extends React.Component {

  constructor(props) {

    super(props)

    const {
      totalFeeRate,
      userRewardFeeRate,
      poolInfo,
      userInfo,
    } = this.props.farm

    const {
      layer1,
      layer2
    } = this.props.balance


    let initialViewLayer = 'L1 Liquidity Pool'
    let initialLayer = 'L1LP'

    if(networkService.L1orL2 === 'L2') {
      initialViewLayer = 'L2 Liquidity Pool'
      initialLayer = 'L2LP'
    }

    this.state = {
      totalFeeRate,
      userRewardFeeRate,
      poolInfo,
      userInfo,
      layer1,
      layer2,
      lpChoice: initialLayer,
      poolTab: initialViewLayer,
      showMDO: false, //MDO = my deposits only
      showMSO: false, //MSO = my stakes only
      dropDownBox: false,
      dropDownBoxInit: true
    }

  }

  componentDidMount() {

    const { totalFeeRate, userRewardFeeRate } = this.props.farm

    if (!totalFeeRate || !userRewardFeeRate) {
      this.props.dispatch(getFee())
    }

    this.props.dispatch(getFarmInfo())

  }

  componentDidUpdate(prevState) {

    const {
      totalFeeRate,
      userRewardFeeRate,
      poolInfo,
      userInfo,
    } = this.props.farm

    const {
      layer1,
      layer2
    } = this.props.balance

    if (prevState.farm.totalFeeRate !== totalFeeRate) {
      this.setState({ totalFeeRate })
    }

    if (prevState.farm.userRewardFeeRate !== userRewardFeeRate) {
      this.setState({ userRewardFeeRate })
    }

    if (!isEqual(prevState.farm.poolInfo, poolInfo)) {
      this.setState({ poolInfo })
    }

    if (!isEqual(prevState.farm.userInfo, userInfo)) {
      this.setState({ userInfo })
    }

    if (!isEqual(prevState.balance.layer1, layer1)) {
      this.setState({ layer1 })
    }

    if (!isEqual(prevState.balance.layer2, layer2)) {
      this.setState({ layer2 })
    }

  }


  getBalance(address, chain) {

    const { layer1, layer2 } = this.state;

    if (typeof (layer1) === 'undefined') return [0, 0]
    if (typeof (layer2) === 'undefined') return [0, 0]

    if (chain === 'L1') {
      let tokens = Object.entries(layer1)
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i][1].address.toLowerCase() === address.toLowerCase()) {
          return [tokens[i][1].balance, tokens[i][1].decimals]
        }
      }
    }
    else if (chain === 'L2') {
      let tokens = Object.entries(layer2)
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i][1].address.toLowerCase() === address.toLowerCase()) {
          return [tokens[i][1].balance, tokens[i][1].decimals]
        }
      }
    }

    return [0, 0]

  }

  handleChange = (event, t) => {
    if( t === 'L1 Liquidity Pool' )
      this.setState({ 
        lpChoice: 'L1LP',
        poolTab: t  
      })
    else if(t === 'L2 Liquidity Pool')
      this.setState({ 
        lpChoice: 'L2LP',
        poolTab: t 
      })
  }

  handleCheckBox = (e) =>{
    this.setState({
      showMDO: e.target.checked
    })
  }

  handleCheckBoxStakes = (e) =>{
    this.setState({
      showMSO: e.target.checked
    })
  }

  render() {
    const {
      // Pool
      poolInfo,
      // user
      userInfo,
      lpChoice,
      poolTab,
      showMDO,
      showMSO,
      dropDownBox,
    } = this.state

    const { isMobile } = this.props

    const networkLayer = networkService.L1orL2
    
    return (
      <>
        <PageHeader title="Earn" />

      <S.Wrapper dropDownBox={dropDownBox}>
          
          <Grid container spacing={2} direction="row" justifyContent="left" alignItems="center" >
        
            <S.GridItemTag item xs={10} md={10}>
              <Typography variant="body2" sx={{mt: 2, fontSize: '0.8em'}}>
                The supply of tokens in the pools reflects the staking and bridging activities of all users.
                {' '}<span style={{fontWeight: '700'}}>LIQUIDITY</span> denotes the funds staked by liquidity providers, while the 
                {' '}<span style={{fontWeight: '700'}}>BALANCE</span> refers to the amount of funds currently in each pool.
              </Typography>
            </S.GridItemTag>

            <S.GridItemTag 
              item 
              xs={2} 
              md={2}
              onClick={()=>{this.setState({ dropDownBox: !dropDownBox, dropDownBoxInit: false })}}
              sx={{color: "#0ebf9a"}}
            >
              Learn More
              <Box sx={{display: 'flex', cursor: 'pointer', transform: dropDownBox ? "rotate(-180deg)" : ""}}>
                <ExpandMoreIcon />
              </Box>
            </S.GridItemTag>
          </Grid>

        {/*********************************************/
        /**************  Drop Down Box ****************/
        /**********************************************/
        }
        {dropDownBox ? (
          <Fade in={dropDownBox}>
            <S.DropdownContent>
              <S.DropdownWrapper>
                <Typography variant="body2" sx={{mt: 1, fontSize: '0.7em'}}>
                  <span style={{fontWeight: '700'}}>Staking example</span>. When you stake 10 OMG into the L2 pool, then the pool's liquidity and balance both increase by 10 OMG. 
                  <br/><br/>
                  <span style={{fontWeight: '700'}}>Fast Bridge example</span>. When a user bridges 10 OMG from L1 to L2 using the fast bridge,  
                  they send 10 OMG to the L1 pool, increasing its balance by 10 OMG. Next, 9.99 OMG flow out from the L2 pool to the user's L2 wallet, completing the bridge. 
                  Note that bridge operations do not change the pool's liquidity, but only its current balance. 
                  The difference between what was deposited into the L1 pool (10 OMG) and what was sent 
                  to the user on the L2 (9.99 OMG), equal to 0.01 OMG, is sent to the reward pool, for later harvesting by liquidity providers. 
                  <br/><br/>
                  <span style={{fontWeight: '700'}}>Pool rebalancing</span>. In some circumstances, excess balances can accumulate on one chain. For example, if many people 
                  bridge from L1 to L2, then L1 pool balances will increase, while L2 balances will decrease. In the current (v1) system, the pool operator is responsible 
                  for pool rebalancing, when and if needed, using 'classic' deposit and exit operations to move funds from one pool to another.
                  <br/><br/> 
                  <span style={{fontWeight: '700'}}>Future work</span>. A more elegant approach to pool balancing is an 'automatic' 
                  supply-and-demand approach, in which staking rewards scale inversely (and non-linearly) with pool balances. Thus, when pool balances 
                  are very low, a spike in rewards would attract new liquidity into low-balance pools.
                </Typography>
              </S.DropdownWrapper>
            </S.DropdownContent>
          </Fade>
        ) : null }

      </S.Wrapper>

        <Box sx={{ my: 3, width: '100%' }}>
          <Box sx={{ mb: 2, display: 'flex' }}>
            <Tabs
              activeTab={poolTab}
              onClick={(t)=>this.handleChange(null, t)}
              aria-label="Liquidity Pool Tab"
              tabs={["L1 Liquidity Pool", "L2 Liquidity Pool"]}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={showMDO}
                  onChange={this.handleCheckBox}
                  name="my tokens only"
                  color="primary"
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
                />
              }
              label="My Stakes Only"
            />
          </Box>

          {networkLayer === 'L2' && lpChoice === 'L1LP' &&
            <S.LayerAlert>
              <S.AlertInfo>
                <AlertIcon sx={{flex: 1}} />
                <S.AlertText
                  variant="body1"
                  component="p"
                >
                  You are on L2. To transact on L1, SWITCH LAYER to L1
                </S.AlertText>
              </S.AlertInfo>
              <LayerSwitcher isButton={true} size={isMobile ? "small" : "medium"}/>
            </S.LayerAlert>
          }

          {networkLayer === 'L1' && lpChoice === 'L2LP' &&
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
              {tableHeadList.map((item) => {
                return (
                  <S.TableHeadingItem key={item.label} variant="body2" component="div">
                    {item.label}
                  </S.TableHeadingItem>
                )
              })}
            </S.TableHeading>
          ) : (null)}

          {lpChoice === 'L1LP' &&
            <Box>
              {Object.keys(poolInfo.L1LP).map((v, i) => {
                const ret = this.getBalance(v, 'L1')
                return (
                  <ListFarm
                    key={i}
                    poolInfo={poolInfo.L1LP[v]}
                    userInfo={userInfo.L1LP[v]}
                    L1orL2Pool={lpChoice}
                    balance={ret[0]}
                    decimals={ret[1]}
                    isMobile={isMobile}
                    showAll={!showMDO}
                    showStakes={!showMSO}
                  />
                )
              })}
            </Box>}

          {lpChoice === 'L2LP' &&
            <Box>
              {Object.keys(poolInfo.L2LP).map((v, i) => {
                const ret = this.getBalance(v, 'L2')
                return (
                  <ListFarm
                    key={i}
                    poolInfo={poolInfo.L2LP[v]}
                    userInfo={userInfo.L2LP[v]}
                    L1orL2Pool={lpChoice}
                    balance={ret[0]}
                    decimals={ret[1]}
                    isMobile={isMobile}
                    showAll={!showMDO}
                    showStakes={!showMSO}
                  />
                )
              })}
            </Box>
          }
        </Box>
      </>
    )
  }
}

const mapStateToProps = state => ({
  farm: state.farm,
  balance: state.balance
})

export default connect(mapStateToProps)(Farm)
