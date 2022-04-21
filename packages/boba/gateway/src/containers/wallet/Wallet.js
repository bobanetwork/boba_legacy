import React, { useEffect, useState } from "react"
import { useDispatch, useSelector } from 'react-redux'

import Button from 'components/button/Button'

import { Info } from "@mui/icons-material"
import { Box, Icon, Typography } from '@mui/material'

import { getETHMetaTransaction } from 'actions/setupAction'
import { openAlert, openError } from 'actions/uiAction'
import { fetchTransactions } from 'actions/networkAction'

import Tabs from 'components/tabs/Tabs'
import Nft from 'containers/wallet/nft/Nft'
import Token from './token/Token'
import Connect from 'containers/connect/Connect'

import * as S from './wallet.styles'
import * as G from '../Global.styles'

import {
  setConnectETH,
  setConnectBOBA
} from 'actions/setupAction'


import {
  selectAccountEnabled,
  selectLayer,
  selectNetwork,
} from "selectors/setupSelector"

import { selectlayer2Balance } from 'selectors/balanceSelector'

import PageTitle from 'components/pageTitle/PageTitle'
import { isEqual } from 'lodash'

import { POLL_INTERVAL } from "util/constant"
import useInterval from "util/useInterval"

import BN from 'bignumber.js'
import { logAmount } from 'util/amountConvert.js'

function Wallet() {

  const [ page, setPage ] = useState('Token')
  const [ chain, setChain ] = useState('')
  const [ tooSmallETH, setTooSmallETH ] = useState(false)
  const [ tooSmallBOBA, setTooSmallBOBA ] = useState(false)

  const dispatch = useDispatch()

  const layer = useSelector(selectLayer())
  const accountEnabled = useSelector(selectAccountEnabled())
  const network = useSelector(selectNetwork())

  // low balance warnings
  const l2Balances = useSelector(selectlayer2Balance, isEqual)

  useEffect(()=>{
    if (accountEnabled)
      dispatch(fetchTransactions())
  },[ dispatch, accountEnabled ])

  useEffect(()=>{
    if (accountEnabled && l2Balances.length > 0)  {

      const l2BalanceETH = l2Balances.find((i) => i.symbol === 'ETH')
      const l2BalanceBOBA = l2Balances.find((i) => i.symbol === 'BOBA')

      if (l2BalanceETH && l2BalanceETH.balance) {
        setTooSmallETH(new BN(logAmount(l2BalanceETH.balance, 18)).lt(new BN(0.003)))
      } else {
        // in case of zero ETH balance we are setting tooSmallETH
        setTooSmallETH(true)
      }
      if (l2BalanceBOBA && l2BalanceBOBA.balance) {
        setTooSmallBOBA(new BN(logAmount(l2BalanceBOBA.balance, 18)).lt(new BN(4.0)))
      } else {
        // in case of zero BOBA balance we are setting tooSmallBOBA
        setTooSmallBOBA(true)
      }
    }
  },[ l2Balances, accountEnabled ])

  useEffect(() => {
    if (layer === 'L2') {
      if (tooSmallBOBA && tooSmallETH) {
        dispatch(openError('Wallet empty - please bridge in ETH or BOBA from L1'))
      }
    }
  },[tooSmallETH, tooSmallBOBA, layer, dispatch])

  useInterval(() => {
    if (accountEnabled) {
      dispatch(fetchTransactions())
    }
  }, POLL_INTERVAL)

  useEffect(() => {
    if (layer === 'L2') {
      setChain('Boba Wallet')
    } else if (layer === 'L1') {
      setChain('Ethereum Wallet')
    }
  }, [ layer ])

  const handleSwitch = (l) => {
    if (l === 'Token') {
      setPage('Token')
    } else if (l === 'NFT') {
      setPage('NFT')
    }
  }

  async function emergencySwap () {
    if(network !== 'rinkeby') return
    const res = await dispatch(getETHMetaTransaction())
    if (res) dispatch(openAlert('Emergency Swap submitted'))
  }

  return (
    <S.PageContainer>

      <PageTitle title={'Wallet'} />

      <Connect
        userPrompt={'Connect to MetaMask to see your balances, transfer, and bridge'}
        accountEnabled={accountEnabled}
      />

      {layer === 'L2' && tooSmallETH && network === 'rinkeby' &&
        <G.LayerAlert>
          <G.AlertInfo>
            <Icon as={Info} sx={{color:"#BAE21A"}}/>
            <Typography
              flex={4}
              variant="body2"
              component="p"
              ml={2}
              style={{ opacity: '0.6' }}
            >
              Using Boba requires a minimum ETH balance (of 0.002 ETH) regardless of your fee setting,
              otherwise MetaMask may incorrectly reject transactions. If you ran out of ETH, use
              EMERGENCY SWAP to swap BOBA for 0.05 ETH at market rates.
            </Typography>
          </G.AlertInfo>
          <Button
            onClick={()=>{emergencySwap()}}
            color='primary'
            variant='outlined'
          >
            EMERGENCY SWAP
          </Button>
        </G.LayerAlert>
      }

      <S.WalletActionContainer>
        <G.PageSwitcher>
          <Typography
            className={chain === 'Ethereum Wallet' ? 'active' : ''}
            onClick={() => {
              if (!!accountEnabled) {
                dispatch(setConnectETH(true))
              }
            }}
            variant="body2"
            component="span">
            Ethereum Wallet
          </Typography>
          <Typography
            className={chain === 'Boba Wallet' ? 'active' : ''}
            onClick={() => {
              if (!!accountEnabled) {
                dispatch(setConnectBOBA(true))
              }
            }}
            variant="body2"
            component="span">
            Boba Wallet
          </Typography>
        </G.PageSwitcher>
      </S.WalletActionContainer>

      <Box sx={{ mt: 2 }}>
        <Tabs
          activeTab={page}
          onClick={(t) => handleSwitch(t)}
          aria-label="Page Tab"
          tabs={[ "Token", "NFT" ]}
        />
      </Box>
      {page === 'Token' ? <Token /> : <Nft />}
    </S.PageContainer>
  )
}

export default React.memo(Wallet)
