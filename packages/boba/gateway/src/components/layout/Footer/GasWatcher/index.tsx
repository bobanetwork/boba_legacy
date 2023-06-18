import React, { FC } from 'react'
import {
  GasListContainer,
  GasListItem,
  GasListItemLabel,
  GasListItemValue,
} from './style'

interface GasWatcherProps {}

const GasWatcher: FC<GasWatcherProps> = (props) => {
  return (
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
  )
}

export default GasWatcher
