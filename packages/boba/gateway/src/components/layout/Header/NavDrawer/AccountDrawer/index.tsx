import Drawer from '@mui/material/Drawer'
import { Button, Typography } from 'components/global'
import React, { FC } from 'react'

import CopyIcon from './icons/copy'
import DisconnectIcon from './icons/disconnect'
import {
  AccountContainer,
  Action,
  Content,
  ItemLabel,
  MenuItemStyle,
} from './style'
import networkService from 'services/networkService'
import useDisconnect from 'hooks/useDisconnect'

interface Props {
  open: boolean
  onClose: () => void
  onCloseNav: () => void
}

const CopyElement = () => {
  const onCopyAddress = () => {
    navigator.clipboard.writeText(networkService.account as string)
  }

  return (
    <MenuItemStyle onClick={() => onCopyAddress()}>
      <CopyIcon />
      <ItemLabel>Copy Address</ItemLabel>
    </MenuItemStyle>
  )
}

const DisconnectElement = ({ onDisconnect }: { onDisconnect: any }) => {
  return (
    <MenuItemStyle onClick={onDisconnect}>
      <DisconnectIcon />
      <ItemLabel>Disconnect</ItemLabel>
    </MenuItemStyle>
  )
}

const AccountDrawer: FC<Props> = ({ onClose, onCloseNav, open = false }) => {
  const { disconnect } = useDisconnect()
  const onDisconnect = () => {
    disconnect()
    onClose()
    onCloseNav()
  }
  return (
    <>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        style={{ background: 'transperant' }}
      >
        <AccountContainer>
          <Content>
            <CopyElement />
            <DisconnectElement onDisconnect={onDisconnect} />
          </Content>
          <Action>
            <Button
              onClick={() => onClose()}
              style={{ width: '100%' }}
              label="Cancel"
            />
          </Action>
        </AccountContainer>
      </Drawer>
    </>
  )
}

export default AccountDrawer
