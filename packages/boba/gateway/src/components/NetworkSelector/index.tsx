import React, { useState } from 'react'
import { ChainLabel } from 'components/bridge/ChainLabel'
import { NetworkContainer, Arrow, Dropdown } from './styles'
import ArrowDown from 'assets/images/icons/arrowdown.svg'

export const NetworkSelector = () => {
  const [openDropdown, setOpenDropdown] = useState(false)

  const handleSelectNetwork = () => {
    setOpenDropdown((currentStatus) => !currentStatus)
  }
  return (
    <NetworkContainer onClick={handleSelectNetwork}>
      <ChainLabel direction="from" /> <Arrow src={ArrowDown} />
      {openDropdown && <Dropdown>Opened</Dropdown>}
    </NetworkContainer>
  )
}
