import React, { useEffect, useState } from "react"
import { useDispatch, useSelector } from 'react-redux'

import Button from 'components/button/Button'

import { Circle } from "@mui/icons-material"
import { Box, CircularProgress, Typography } from '@mui/material'
import Link from 'components/icons/LinkIcon'

import { switchChain, getETHMetaTransaction } from 'actions/setupAction'
import { openAlert, setActiveHistoryTab, setPage as setPageAction } from 'actions/uiAction'
import { fetchTransactions } from 'actions/networkAction'

import Tabs from 'components/tabs/Tabs'
import Nft from "containers/wallet/nft/Nft"
import Token from './token/Token'
import * as S from './wallet.styles'

import {
  selectAccountEnabled,
  selectLayer,
  selectBobaFeeChoice
} from "selectors/setupSelector"

import { selectlayer2Balance } from 'selectors/balanceSelector'
import { selectTransactions } from 'selectors/transactionSelector'

import WalletPicker from 'components/walletpicker/WalletPicker'
import PageTitle from 'components/pageTitle/PageTitle'
import AlertIcon from 'components/icons/AlertIcon'
import { isEqual, orderBy } from 'lodash'

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

  const feeUseBoba = useSelector(selectBobaFeeChoice())

  const unorderedTransactions = useSelector(selectTransactions, isEqual)
  const orderedTransactions = orderBy(unorderedTransactions, i => i.timeStamp, 'desc')

  // low balance warnings
  const l2Balances = useSelector(selectlayer2Balance, isEqual)

  const now = Math.floor(Date.now() / 1000)

  const pendingL1 = orderedTransactions.filter((i) => {
    if (i.chain === 'L1pending' && //use the custom API watcher for fast data on pending L1->L2 TXs
      i.crossDomainMessage &&
      i.crossDomainMessage.crossDomainMessage === 1 &&
      i.crossDomainMessage.crossDomainMessageFinalize === 0 &&
      i.action.status === "pending" &&
      (now - i.timeStamp) < 20
    ) {
      return true
    }
    return false
  })

  const pendingL2 = orderedTransactions.filter((i) => {
    if (i.chain === 'L2' &&
      i.crossDomainMessage &&
      i.crossDomainMessage.crossDomainMessage === 1 &&
      i.crossDomainMessage.crossDomainMessageFinalize === 0 &&
      i.action.status === "pending" &&
      (now - i.timeStamp) < 20
    ) {
      return true
    }
    return false
  })

  const pending = [
    ...pendingL1,
    ...pendingL2
  ]

  useEffect(()=>{
    if (accountEnabled)
      dispatch(fetchTransactions())
  },[ dispatch, accountEnabled ])

  useEffect(()=>{
    if (accountEnabled && l2Balances.length > 0)  {
      console.log("l2Balances",l2Balances)
      const l2BalanceETH = l2Balances.find((i) => i.symbol === 'ETH')
      const l2BalanceBOBA = l2Balances.find((i) => i.symbol === 'BOBA')
      if (l2BalanceETH && l2BalanceETH[0]) {
        setTooSmallETH(new BN(logAmount(l2BalanceETH[0].balance, 18)).lt(new BN(0.003)))
      }
      if (l2BalanceBOBA && l2BalanceBOBA[0]) {
        setTooSmallBOBA(new BN(logAmount(l2BalanceBOBA[0].balance, 18)).lt(new BN(4.0)))
      }
    }
  },[ l2Balances, accountEnabled ])

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
      setPage('Token');
    } else if (l === 'NFT') {
      setPage('NFT');
    }
  }

  async function emergencySwap () {
    const res = await dispatch(getETHMetaTransaction())
    if (res) dispatch(openAlert('Emergency Swap submitted'))
  }

// disable hisding the EMERGENCY SWAP for testing
// 

  return (
    <S.PageContainer>
      <PageTitle title="Wallet" />
      {layer === 'L2' && tooSmallETH &&
        <S.LayerAlert>
          <S.AlertInfo>
            <AlertIcon />
            <S.AlertText
              variant="body3"
              component="p"
            >
              <span style={{opacity: '1.0'}}>NOTE: ETH balance</span>.
              {' '}
              <span style={{opacity: '0.6'}}>Using Boba requires a minimum ETH balance (of 0.002 ETH)
              regardless of your fee setting, otherwise MetaMask may incorrectly reject transactions.
              <br/><br/>If you are stuck because you ran out of ETH, use EMERGENCY SWAP to swap BOBA for
              0.05 ETH at market rates.
              <br/><br/>EMERGENCY SWAPs are metatransactions and are not shown in 
              the history tab, but can be looked up in the blockexplorer token transfers for BOBA.
              </span>
            </S.AlertText>
          </S.AlertInfo>
          <Button
            onClick={()=>{emergencySwap()}}
            color='primary'
            variant='contained'
          >
            EMERGENCY SWAP
          </Button>
        </S.LayerAlert>
      }

      {!accountEnabled &&
        <S.LayerAlert>
          <S.AlertInfo>
            <AlertIcon />
            <S.AlertText
              variant="body2"
              component="p"
            >
              Connect to MetaMask to see your balances, transfer, and bridge
            </S.AlertText>
          </S.AlertInfo>
          <WalletPicker />
        </S.LayerAlert>
      }
      <S.WalletActionContainer
      >
        <S.PageSwitcher>
          <Typography
            className={chain === 'Ethereum Wallet' ? 'active' : ''}
            onClick={() => {
              if (!!accountEnabled) {
                dispatch(switchChain('L1'))
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
                dispatch(switchChain('L2'))
              }
            }}
            variant="body2"
            component="span">
            Boba Wallet
          </Typography>
        </S.PageSwitcher>
        {!!accountEnabled && pending.length > 0 ? <S.PendingIndicator
        >
          <CircularProgress color="primary" size="20px"/>
          <Typography
            sx={{ cursor: 'pointer' }}
            onClick={() => {
              dispatch(setPageAction('History'))
              dispatch(setActiveHistoryTab("Pending"))
            }}
            variant="text"
            component="span">
            Transaction in progress...
          </Typography>
        </S.PendingIndicator> : null}
      </S.WalletActionContainer>
      {
        !accountEnabled ?
          <Typography variant="body2" sx={{ color: '#FF6A55' }}><Circle sx={{ height: "10px", width: "10px" }} /> Disconnected</Typography>
          : <Typography variant="body2" sx={{ color: '#BAE21A' }}><Circle sx={{ height: "10px", width: "10px" }} /> Connected</Typography>
      }
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
