import React from 'react'
import { useDispatch } from 'react-redux'
import AlertIcon from 'components/icons/AlertIcon'
import { Button } from 'components/global/button'

import { setConnectBOBA, setConnect } from 'actions/setupAction'

import styled, { css } from 'styled-components'
import { Typography } from 'components/global'
import { mobile } from 'themes/screens'

export const AlertContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.bg.glassy};
  border: 1px solid ${({ theme }) => theme.bg.glassy};

  ${mobile(css`
    flex-direction: column;
    justify-content: flex-start;
  `)}
`
export const AlertBody = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
`
export const AlertDescription = styled(Typography).attrs({
  variant: 'body2',
})``
export const AlertAction = styled.div``

const Connect = ({
  userPrompt,
  accountEnabled,
  connectToBoba = false,
  layer = '',
}) => {
  const dispatch = useDispatch<any>()

  const onConnect = () => {
    if (!accountEnabled && !connectToBoba) {
      dispatch(setConnect(true))
    } else if (layer !== 'L2' && connectToBoba) {
      dispatch(setConnectBOBA(true))
    }
  }

  if (
    (!accountEnabled && !connectToBoba) ||
    (layer !== 'L2' && connectToBoba)
  ) {
    return (
      <AlertContainer>
        <AlertBody>
          <AlertIcon />
          <AlertDescription>{userPrompt}</AlertDescription>
        </AlertBody>
        <AlertAction>
          <Button
            onClick={onConnect}
            label={layer !== 'L2' ? 'Connect to Boba' : 'Connect'}
            small
          />
        </AlertAction>
      </AlertContainer>
    )
  }

  return null
}

export default Connect
