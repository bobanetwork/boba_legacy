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

import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@emotion/react';
import { Box, FormControlLabel, Checkbox, Typography, useMediaQuery } from '@mui/material'
import { HelpOutline } from '@mui/icons-material'

import { selectUserInfo, selectPoolInfo } from 'selectors/earnSelector'
import { selectlayer1Balance, selectlayer2Balance } from 'selectors/balanceSelector'
import { selectBaseEnabled, selectAccountEnabled, selectLayer } from 'selectors/setupSelector'
import { selectActiveNetworkName } from 'selectors/networkSelector'

import { getEarnInfo } from 'actions/earnAction'

import Connect from 'containers/connect/Connect'

import ListEarn from 'components/listEarn/ListEarn'
import AlertIcon from 'components/icons/AlertIcon'
import Tooltip from 'components/tooltip/Tooltip';
import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'
import PageTitle from 'components/pageTitle/PageTitle'

import networkService from 'services/networkService'

import * as S from './Earn.styles'

function Earn() {
  const [showMDO, setShowMDO] = useState(false)
  const [showMSO, setShowMSO] = useState(false)
  const [lpChoice, setLpChoice] = useState(networkService.L1orL2 === 'L1' ? 'L1LP' : 'L2LP')
  const [poolTab, setPoolTab] = useState(networkService.L1orL2 === 'L1' ? 'Ethereum Pool' : 'Boba L2 Pool')

  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const userInfo = useSelector(selectUserInfo())
  const poolInfo = useSelector(selectPoolInfo())

  const layer1Balance = useSelector(selectlayer1Balance)
  const layer2Balance = useSelector(selectlayer2Balance)

  const baseEnabled = useSelector(selectBaseEnabled())
  const accountEnabled = useSelector(selectAccountEnabled())
  const layer = useSelector(selectLayer())

  const activeNetworkName = useSelector(selectActiveNetworkName())

  useEffect(() => {
    if (baseEnabled) {
      dispatch(getEarnInfo())
    }
  }, [dispatch, baseEnabled])

  function getBalance(address, chain) {
    if (typeof (layer1Balance) === 'undefined') return [ 0, 0 ]
    if (typeof (layer2Balance) === 'undefined') return [ 0, 0 ]

    if (chain === 'L1') {
      let tokens = Object.entries(layer1Balance)
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[ i ][ 1 ].address.toLowerCase() === address.toLowerCase()) {
          return [ tokens[ i ][ 1 ].balance, tokens[ i ][ 1 ].decimals ]
        }
      }
    }
    else if (chain === 'L2') {
      let tokens = Object.entries(layer2Balance)
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[ i ][ 1 ].address.toLowerCase() === address.toLowerCase()) {
          return [ tokens[ i ][ 1 ].balance, tokens[ i ][ 1 ].decimals ]
        }
      }
    }

    return [ 0, 0 ]
  }

  return (
    <S.EarnPageContainer>
      <PageTitle title={'Earn'} />
      <Connect
        userPrompt={'Connect to MetaMask to see your balances and contribute to the liquidity pool '}
        accountEnabled={accountEnabled}
      />

      {layer === 'L2' && lpChoice === 'L1LP' &&
        <S.LayerAlert>
          <S.AlertInfo>
            <AlertIcon sx={{ flex: 1 }} />
            <S.AlertText
              variant="body2"
              component="p"
            >
              You are on L2. To transact on L1, SWITCH LAYER to L1
            </S.AlertText>
          </S.AlertInfo>
          <LayerSwitcher isButton={true}/>
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

      <Box sx={{ my: 1, width: '100%' }}>
        <S.EarnActionContainer sx={{ mb: 2, display: 'flex' }}>
          <S.PageSwitcher>
            <Typography
              className={poolTab === 'Ethereum Pool' ? 'active' : ''}
              onClick={() => {
                setLpChoice('L1LP')
                setPoolTab('Ethereum Pool')
              }}
              variant="body2"
              component="span">
              {activeNetworkName['l1']} Pools
            </Typography>
            <Typography
              className={poolTab === 'Boba L2 Pool' ? 'active' : ''}
              onClick={() => {
                setLpChoice('L2LP')
                setPoolTab('Boba L2 Pool')
              }}
              variant="body2"
              component="span">
              {activeNetworkName['l2']} Pools
            </Typography>
          </S.PageSwitcher>

          <S.EarnAction>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showMDO}
                  onChange={(e) => setShowMDO(e.target.checked)}
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
                  onChange={e => setShowMSO(e.target.checked)}
                  name="my stakes only"
                  color="primary"
                  icon={<S.BpIcon />}
                />
              }
              label="My Stakes Only"
            />
          </S.EarnAction>

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
          <S.EarnListContainer>
            {Object.keys(poolInfo.L1LP).map((v, i) => {
              const ret = getBalance(v, 'L1')
              if (showMDO && Number(ret[ 0 ]) === 0) return null
              return (
                <ListEarn
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
          </S.EarnListContainer>}

        {lpChoice === 'L2LP' &&
          <S.EarnListContainer>
            {Object.keys(poolInfo.L2LP).map((v, i) => {
              const ret = getBalance(v, 'L2')
              if (showMDO && Number(ret[ 0 ]) === 0) return null
              return (
                <ListEarn
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
          </S.EarnListContainer>
        }
      </Box>
    </S.EarnPageContainer>
  )
}

export default React.memo(Earn);
