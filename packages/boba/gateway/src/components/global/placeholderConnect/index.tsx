import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setConnectBOBA, setConnect } from 'actions/setupAction'
import { useLocation } from 'react-router-dom'
import { selectAccountEnabled, selectLayer } from 'selectors'

import { Svg } from 'components/global/svg'
import { Button } from 'components/global/button'

import { PlaceholderContainer, Label } from './styles'
import placehoderIcon from 'assets/images/icons/no-data.svg'
import { LAYER } from 'util/constant'
import { PlaceholderConnectInterface } from './types'
import styled from 'styled-components'

export const StyledSvg = styled(Svg)`
  div {
    display: flex;
  }

  svg {
    fill: ${({ theme }) =>
      theme.name === 'light' ? theme.colors.gray[600] : theme.colors.gray[100]};
  }
`

export const PlaceholderConnect = ({
  isLoading = false,
  preloader = null,
}: PlaceholderConnectInterface) => {
  const layer = useSelector<any>(selectLayer())
  const accountEnabled = useSelector<any>(selectAccountEnabled())

  const location = useLocation()
  const dispatch = useDispatch<any>()

  const handdleConnect = () => {
    dispatch(layer === LAYER.L2 ? setConnectBOBA(true) : setConnect(true))
  }

  const DefaultLabel = () => {
    return (
      <>
        <StyledSvg src={placehoderIcon} />
        <Label variant="body2">No {location?.pathname?.substring(1)}</Label>
      </>
    )
  }

  return (
    <PlaceholderContainer>
      {isLoading && preloader}
      {accountEnabled && !isLoading && <DefaultLabel />}
      {!accountEnabled && (
        <>
          <DefaultLabel />
          <Button small label="Connect Wallet" onClick={handdleConnect} />
        </>
      )}
    </PlaceholderContainer>
  )
}
