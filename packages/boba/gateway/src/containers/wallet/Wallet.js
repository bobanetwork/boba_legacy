import { Circle } from "@mui/icons-material"
import { Box, Typography } from '@mui/material'
import { switchChain } from "actions/setupAction"
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

function Wallet() {

  const [ page, setPage ] = useState('Token')
  const [ chain, setChain ] = useState('')

  const dispatch = useDispatch();

  const layer = useSelector(selectLayer());
  const accountEnabled = useSelector(selectAccountEnabled())

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

  console.log([ 'page', page ])
  console.log([ 'chain', chain ])

  return (
    <S.PageContainer>
      <PageTitle title="Wallet"/>

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
