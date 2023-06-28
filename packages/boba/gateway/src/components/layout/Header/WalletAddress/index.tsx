import React from 'react'
import networkService from 'services/networkService'
import { AddressContainer, CircleIndicator } from './style'
import truncate from 'truncate-middle'
import { Heading } from 'components/global'

type Props = {}

export const WalletAddress = ({}: Props) => {
  return (
    <AddressContainer>
      <CircleIndicator />
      <Heading variant="h5">
        {truncate(networkService.account, 6, 4, '...')}
      </Heading>
    </AddressContainer>
  )
}
