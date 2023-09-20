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

import { HelpOutline } from '@mui/icons-material'

import {
  selectUserInfo,
  selectPoolInfo,
  selectlayer1Balance,
  selectlayer2Balance,
  selectBaseEnabled,
  selectAccountEnabled,
  selectLayer,
  selectActiveNetworkName,
  selectChainIdChanged
} from 'selectors'

import { getEarnInfo } from 'actions/earnAction'

import Connect from 'containers/connect'

import ListEarn from 'components/listEarn/ListEarn'
import AlertIcon from 'components/icons/AlertIcon'
import Tooltip from 'components/tooltip/Tooltip';
import Button from 'components/button/Button'

import networkService from 'services/networkService'

import * as S from './styles'
import { fetchBalances } from 'actions/networkAction';

import { TableHeader } from 'components/global/table'
import { CheckboxWithLabel } from 'components/global/checkbox'
import { tableHeaderOptions } from './consts'
import { Typography } from 'components/global/typography'
import { toLayer } from './types'

import { BridgeTooltip } from './tooltips'
import { setConnectBOBA, setConnectETH } from 'actions/setupAction';

const Earn = () => {
  const dispatch = useDispatch();

  const activeNetworkName = useSelector(selectActiveNetworkName())
  const layer = useSelector(selectLayer())

  const userInfo = useSelector(selectUserInfo())
  const poolInfo = useSelector(selectPoolInfo())

  const layer1Balance = useSelector(selectlayer1Balance)
  const layer2Balance = useSelector(selectlayer2Balance)

  const baseEnabled = useSelector(selectBaseEnabled())
  const accountEnabled = useSelector(selectAccountEnabled())
  const chainIdChanged = useSelector(selectChainIdChanged())
  const networkName = useSelector(selectActiveNetworkName())

  const [showMDO, setShowMDO] = useState(false)
  const [showMSO, setShowMSO] = useState(false)
  const [lpChoice, setLpChoice] = useState(
    networkService.L1orL2 === 'L1' ? 'L1LP' : 'L2LP'
  )

  const isLp1 = lpChoice === 'L1LP';
  const isLp2 = lpChoice === 'L2LP';

  const [poolTab, setPoolTab] = useState(
    activeNetworkName[layer?.toLowerCase()]
  )

  useEffect(()=> {
    setLpChoice(networkService.L1orL2 === 'L1' ? 'L1LP' : 'L2LP')
    setPoolTab(activeNetworkName[layer?.toLowerCase()])
  }, [layer, networkService, activeNetworkName])


  useEffect(() => {
    if (baseEnabled) {
      dispatch(getEarnInfo())
    }

    if (accountEnabled) {

      dispatch(fetchBalances())
    }
  }, [dispatch, baseEnabled, accountEnabled, activeNetworkName])


  const getBalance = (address, chain) => {
    const tokens =
      chain === 'L1'
        ? Object.values(layer1Balance)
        : chain === 'L2'
        ? Object.values(layer2Balance)
        : []
    const token = tokens.find(t => t.address.toLowerCase() === address.toLowerCase())
    return token ? [token.balance, token.decimals] : [0, 0]
  }


  const selectedPoolInfo = lpChoice === 'L1LP' ? poolInfo.L1LP : poolInfo.L2LP;

  const selectedNetworkConfig =
    lpChoice === 'L1LP'
      ? networkService?.networkConfig?.L1?.chainIdHex
      : networkService?.networkConfig?.L2?.chainIdHex

  useEffect(()=>{
    setLpChoice(networkService.L1orL2 === 'L1' ? 'L1LP' : 'L2LP')
  },[networkService.L1orL2])

  return (
    <S.EarnPageContainer>
      <Connect
        userPrompt={
          'Connect to MetaMask to see your balances and contribute to the liquidity pool '
        }
        accountEnabled={accountEnabled}
      />

      <S.Help>
        <Typography variant="body3">
          Bridging fees are proportionally distributed to stakers. The bridges
          are not farms. Your earnings only increase when someone uses the
          bridge you have staked into.
        </Typography>

        <Tooltip title={<BridgeTooltip />}>
          <HelpOutline fontSize="small" sx={{ opacity: 0.65 }} />
        </Tooltip>
      </S.Help>
      {((layer === 'L2' && isLp1) || (layer === 'L1' && isLp2)) && (
        <S.LayerAlert>
          <S.AlertInfo>
            <AlertIcon sx={{ flex: 1 }} />
            <S.AlertText variant="body2" component="p">
              You are on {layer}. To transact on {toLayer[layer]}, SWITCH LAYER to {toLayer[layer]}
            </S.AlertText>
          </S.AlertInfo>
          <Button
            type="primary"
            variant="contained"
            size="md"
            newStyle
            onClick={() => (layer === 'L1') ? dispatch(setConnectBOBA(true)) : dispatch(setConnectETH(true))}
            sx={{ fontWeight: '500;' }}
          >
            Connect to {networkName[ layer === 'L1' ? 'l2' : 'l1' ]}
          </Button>
        </S.LayerAlert>
      )}

      <div >
        <S.EarnActionContainer sx={{ mb: 2, display: 'flex' }}>
          <S.TabSwitcherContainer>
            <S.Tab
              active={poolTab === activeNetworkName['l1']}
              onClick={() => {
                setLpChoice('L1LP')
                setPoolTab(activeNetworkName['l1'])
              }}>
              <Typography variant="body1">{activeNetworkName['l1']} Pools</Typography>
            </S.Tab>
            <S.Tab
              active={poolTab === activeNetworkName['l2']}
              onClick={() => {
                setLpChoice('L2LP')
                setPoolTab(activeNetworkName['l2'])
              }}>
              <Typography variant="body1">{activeNetworkName['l2']} Pools</Typography>
            </S.Tab>
          </S.TabSwitcherContainer>

          <S.EarnAction>
            <CheckboxWithLabel
              label="My Stakes Only"
              checked={showMSO}
              onChange={(status) => setShowMSO(status)}
            />
          </S.EarnAction>
        </S.EarnActionContainer>

        <TableHeader options={tableHeaderOptions} />

        <S.EarnListContainer>
          {Object.keys(selectedPoolInfo).map((v, i) => {
            const ret = getBalance(v, lpChoice === 'L1LP' ? 'L1' : 'L2');
            if (showMDO && Number(ret[0]) === 0) {
              return null
            }
            return (
              <ListEarn
                chain={selectedNetworkConfig}
                key={i}
                poolInfo={selectedPoolInfo[v]}
                userInfo={
                  lpChoice === 'L1LP' ? userInfo.L1LP[v] : userInfo.L2LP[v]
                }
                L1orL2Pool={lpChoice}
                balance={ret[0]}
                decimals={ret[1]}
                showStakesOnly={showMSO}
                accountEnabled={accountEnabled}
              />
            );
          })}
        </S.EarnListContainer>
      </div>
    </S.EarnPageContainer>
  )
}

export default React.memo(Earn);
