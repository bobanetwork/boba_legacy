import React, { useEffect, useState } from 'react'
import * as S from './availableBridges.styles'
import {useSelector } from 'react-redux'

import { selectActiveNetwork } from 'selectors'

import { Link, Typography } from '@mui/material'

import networkService from 'services/networkService'
import { BANXA_URL } from 'util/constant'
import { NETWORK } from 'util/network/network.util'

function AvailableBridges({ token = null, walletAddress = "" }) {

  const currentNetwork = useSelector(selectActiveNetwork());
  const isAvailableOnBanxa = token?.symbol === 'ETH' || token?.symbol === 'BOBA'

  const [ bridges, setBridges ] = useState([])
  const banxaUrl = () => {
    const banxaUrl = BANXA_URL;
    const config = {
      coinType: 'BOBA',
      fiatType: 'USD',
      fiatAmount: '',
      blockChain: 'Boba Network',
      walletAddress: walletAddress
    }
    return `${banxaUrl}coinType=${config.coinType}&fiatType=${config.fiatType}&blockchain=${config.blockChain}&walletAddress=${walletAddress}`
  }

  useEffect(() => {
    if (token) {
      let res = networkService.getTokenSpecificBridges(token.symbol)
      setBridges(res)
    }
  }, [ token ])

  return <S.BridgesContainer>
    <S.LabelContainer>
      <Typography variant="body2">
        Third party bridges
      </Typography>
    </S.LabelContainer>
    <S.Wrapper>
      {currentNetwork === NETWORK.ETHEREUM && isAvailableOnBanxa && (
        <S.BridgeContent key={'banxa'}>
          <Link color="inherit"
            variant="body2"
            href={banxaUrl()}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ textDecoration: 'none' }}
          >
            <Typography variant="body1" component="span" my={1}> Banxa</Typography>
          </Link>
        </S.BridgeContent>
        )
      }
      {bridges.map((bridge) => {
        return <S.BridgeContent key={bridge.type}>
          <Link color="inherit"
            variant="body2"
            href={bridge.link}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ textDecoration: 'none' }}
          >
            <Typography variant="body1" component="span" my={1}> {bridge.name}</Typography>
          </Link>
        </S.BridgeContent>
      })}
    </S.Wrapper>
  </S.BridgesContainer>
}

export default React.memo(AvailableBridges)
