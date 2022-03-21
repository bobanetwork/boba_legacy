import { Circle } from "@mui/icons-material"
import { Box, CircularProgress, Typography } from '@mui/material'
import { switchChain } from "actions/setupAction"
import { setActiveHistoryTab, setPage as setPageAction } from 'actions/uiAction'

import Tabs from 'components/tabs/Tabs'
import Nft from "containers/wallet/nft/Nft"
import React, { useEffect, useState } from "react"
import { useDispatch, useSelector } from 'react-redux'
import { selectAccountEnabled, selectLayer } from "selectors/setupSelector"
import Token from "./token/Token"
import * as S from './wallet.styles'

import WalletPicker from 'components/walletpicker/WalletPicker'
import PageTitle from 'components/pageTitle/PageTitle'
import AlertIcon from 'components/icons/AlertIcon'
import { isEqual, orderBy } from 'lodash'
import { selectTransactions } from 'selectors/transactionSelector'

function Wallet() {

  const [ page, setPage ] = useState('Token')
  const [ chain, setChain ] = useState('')

  const dispatch = useDispatch()

  const layer = useSelector(selectLayer());
  const accountEnabled = useSelector(selectAccountEnabled())

  const unorderedTransactions = useSelector(selectTransactions, isEqual)

  const orderedTransactions = orderBy(unorderedTransactions, i => i.timeStamp, 'desc')

  const now = Math.floor(Date.now() / 1000)

  const pendingL1 = orderedTransactions.filter((i) => {
    if (i.chain === 'L1pending' && //use the custom API watcher for fast data on pending L1->L2 TXs
      i.crossDomainMessage &&
      i.crossDomainMessage.crossDomainMessage === 1 &&
      i.crossDomainMessage.crossDomainMessageFinalize === 0 &&
      i.action.status === "pending" &&
      (now - i.timeStamp) < 500
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
      (now - i.timeStamp) < 500
    ) {
      return true
    }
    return false
  })

  const pending = [
    ...pendingL1,
    ...pendingL2
  ]

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

  return (
    <S.PageContainer>
      <PageTitle title="Wallet" />

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
            Bridging in progress...
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
