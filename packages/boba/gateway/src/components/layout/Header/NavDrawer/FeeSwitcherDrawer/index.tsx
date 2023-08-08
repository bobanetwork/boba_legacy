import Drawer from '@mui/material/Drawer'
import { Button } from 'components/global'
import React, { FC } from 'react'

import {
  AccountContainer,
  Action,
  Content,
  ItemLabel,
  MenuItemStyle,
} from '../styles'

interface Props {
  open: boolean
  onClose: () => void
  onCloseNav: () => void
}

const FeeSwitcherDrawer: FC<Props> = ({
  onClose,
  onCloseNav,
  open = false,
}) => {
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
            <MenuItemStyle>
              <ItemLabel>ETH</ItemLabel>
            </MenuItemStyle>
            <MenuItemStyle>
              <ItemLabel>BOBA</ItemLabel>
            </MenuItemStyle>
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

export default FeeSwitcherDrawer
