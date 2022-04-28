import React, { useEffect, useState } from 'react'
import * as S from './availableBridges.styles'
import * as G from 'containers/Global.styles'

import AvailableBridgeBg from 'images/boba2/available_bridges_bg.svg'
import { Link, Typography } from '@mui/material'
import { selectBridgeType } from 'selectors/bridgeSelector'
import { useSelector } from 'react-redux'

import networkService from 'services/networkService'

function AvailableBridges({ token = null, children }) {
  const [ bridges, setBridges ] = useState([])

  const bridgeType = useSelector(selectBridgeType())

  useEffect(() => {
    if (token) {
      let res = networkService.getTokenSpecificBridges(token.symbol);
      setBridges(res);
    }
  }, [ token ])

  if (!token) {
    return <S.BridgesContainer>
      <S.LabelContainer>
        <G.DividerLine flex={1} />
        <Typography variant="body2">
          Aggregate available bridges
        </Typography>
        <G.DividerLine flex={1} />
      </S.LabelContainer>
      <img src={AvailableBridgeBg} alt="agregate bridges" width="100%" />
    </S.BridgesContainer>
  }

  if (!bridges.length) {
   return <S.BridgesContainer my={2}>
      <S.Wrapper>
        <S.BridgeContent border={1}>
          <Typography variant="body1"> Boba {bridgeType.toLowerCase().split('_').join(' ')} </Typography>
          {children}
        </S.BridgeContent>
      </S.Wrapper>
    </S.BridgesContainer>
  }

  return <S.BridgesContainer>
    <S.LabelContainer>
      <G.DividerLine flex={1} />
      <Typography variant="body2">
        {bridges.length} bridge found!
      </Typography>
      <G.DividerLine flex={1} />
    </S.LabelContainer>
    <S.Wrapper>
      {bridges.map((bridge) => {
        if (bridge.type === 'BOBA') {
          return <S.BridgeContent key={bridge.type} border={1}>
            <Typography variant="body1"> {bridge.name} {bridgeType.toLowerCase().split('_').join(' ')} </Typography>
            {children}
          </S.BridgeContent>
        } else {
          return <S.BridgeContent key={bridge.type}>
            <Link color="inherit"
              variant="body2"
              href={bridge.link}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ textDecoration: 'none' }}
            >
              <Typography variant="body1" component="span" my={1}> {bridge.name}
                <Typography variant="body2" component="span" sx={{ opacity: 0.6, display: 'inline-block', ml: 1 }}>
                  (Third party)
                </Typography>
              </Typography>
            </Link>
          </S.BridgeContent>
        }
      })}
    </S.Wrapper>
  </S.BridgesContainer>
}

export default React.memo(AvailableBridges)
