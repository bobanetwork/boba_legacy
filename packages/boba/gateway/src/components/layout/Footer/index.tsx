import React, { FC } from 'react'
import { FooterProps } from './types'
import {
  DividerLine,
  GasListContainer,
  GasListItem,
  GasListItemLabel,
  GasListItemValue,
  StyledFooter,
} from './style'

export const Footer: FC<FooterProps> = (props) => {
  return (
    <StyledFooter>
      <GasListContainer>
        <GasListItem>
          <GasListItemLabel>Ethereum</GasListItemLabel>
          <GasListItemValue>10 Gwei</GasListItemValue>
        </GasListItem>
        <GasListItem>
          <GasListItemLabel>Boba</GasListItemLabel>
          <GasListItemValue>10 Gwei</GasListItemValue>
        </GasListItem>
        <GasListItem>
          <GasListItemLabel>Savings</GasListItemLabel>
          <GasListItemValue>0x</GasListItemValue>
        </GasListItem>
        <GasListItem>
          <GasListItemLabel>L1</GasListItemLabel>
          <GasListItemValue>9190546</GasListItemValue>
        </GasListItem>
        <GasListItem>
          <GasListItemLabel>L2</GasListItemLabel>
          <GasListItemValue>39317</GasListItemValue>
        </GasListItem>
        <GasListItem>
          <GasListItemLabel>Last Verified Block</GasListItemLabel>
          <GasListItemValue>38412</GasListItemValue>
        </GasListItem>
      </GasListContainer>

      <DividerLine />
    </StyledFooter>
  )
}
