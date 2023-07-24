import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setConnectBOBA, setConnect } from 'actions/setupAction'
import { useLocation } from 'react-router-dom'
import { selectAccountEnabled, selectLayer } from 'selectors'

import { Svg } from 'components/global/svg'
import { Button } from 'components/global/button'

import { PlaceholderContainer, Label } from './styles'
import placehoderIcon from 'images/icons/no-data.svg'
import { LAYER } from 'util/constant'
import { PlaceholderConnectInterface } from './types'
import { getNullableType } from 'graphql'
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
        <Svg src={placehoderIcon} fill="" />
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
