import React, { useState } from 'react'
import { ChainLabel } from 'components/bridge/ChainLabel'
import { NetworkContainer, Arrow, Dropdown } from './styles'
import ArrowDown from 'assets/images/icons/arrowdown.svg'
import { NetworkList } from 'components/bridge/NetworkPickerList'
import { Typography } from 'components/global/'

export const NetworkSelector = () => {
  const [openDropdown, setOpenDropdown] = useState(false)

  const handleSelectNetwork = () => {
    setOpenDropdown((currentStatus) => !currentStatus)
  }
  return (
    <NetworkContainer onClick={handleSelectNetwork}>
      <ChainLabel direction="from" /> <Arrow src={ArrowDown} />
      {openDropdown && (
        <Dropdown>
          <Typography variant="body2">Networks</Typography>
          <NetworkList />
        </Dropdown>
      )}
    </NetworkContainer>
  )
}
