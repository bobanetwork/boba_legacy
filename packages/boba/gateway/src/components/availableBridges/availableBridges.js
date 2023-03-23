import React, { useEffect, useState } from 'react'
import * as S from './availableBridges.styles'

import { Link, Typography } from '@mui/material'

import networkService from 'services/networkService'

function AvailableBridges({ token = null, walletAddress = "" }) {

  const [ bridges, setBridges ] = useState([])

  const banxaUrl = () => {
    const banxaUrl = 'https://boba.banxa.com/iframe?';
    const config = {
      coinType:'ETH',
      fiatType: 'USD',
      fiatAmount: '',
      blockChain: 'BOBA',
      walletAddress:walletAddress
    }
    
    return `${banxaUrl}coinType=${config.coinType}&fiatType=${config.fiatType}&fiatAmount=${config.fiatAmount}&blockchain=${config.blockChain}&walletAddress=${walletAddress}`
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
