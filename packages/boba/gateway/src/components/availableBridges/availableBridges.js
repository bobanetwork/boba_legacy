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
