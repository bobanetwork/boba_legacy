import React from 'react'
import { generateAvatarURL } from '@cfx-kit/wallet-avatar'

import networkService from 'services/networkService'
import { CircleIndicator, MenuItemStyle, ProfileIndicator } from './style'
import truncate from 'truncate-middle'
import { Heading } from 'components/global'
import Menu from 'components/global/menu'
import CopyIcon from './icons/copy'
import DisconnectIcon from './icons/disconnect'
import useDisconnect from 'hooks/useDisconnect'

interface Props {}

const CopyElement = () => {
  return (
    <MenuItemStyle>
      <CopyIcon /> Copy
    </MenuItemStyle>
  )
}

const DisconnectElement = () => {
  return (
    <MenuItemStyle>
      <DisconnectIcon />
      Disconnect
    </MenuItemStyle>
  )
}

export const WalletAddress = ({}: Props) => {
  const { disconnect } = useDisconnect()

  const onCopyAddress = () => {
    navigator.clipboard.writeText(networkService.account as string)
  }
  const onDisconnect = () => {
    disconnect()
  }

  const profile = generateAvatarURL(networkService.account as string)

  return (
    <Menu
      name="walletAddress"
      options={[
        {
          component: <CopyElement />,
          onClick: onCopyAddress,
        },
        {
          component: <DisconnectElement />,
          onClick: onDisconnect,
        },
      ]}
    >
      <>
        <ProfileIndicator src={profile} />
        <Heading variant="h5">
          {truncate(networkService.account, 6, 4, '...')}
        </Heading>
      </>
    </Menu>
  )
}
