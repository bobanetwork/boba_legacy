import { Drawer } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { SwitchButton } from 'components/global'
import React, { FC } from 'react'
import { BobaLogo } from '../styles'
import {
  ActionContainer,
  ActionIcon,
  ActionItem,
  ActionLabel,
  ActionValue,
  CloseIcon,
  DrawerHeader,
  HeaderDivider,
  NavLinkItem,
  NavList,
  StyleDrawer,
  WrapperCloseIcon,
} from './styles'
import { MENU_LIST } from '../Navigation/constant'

interface Props {
  onClose: () => void
  open: boolean
}

const useStyles = makeStyles({
  root: {
    width: '100%',
    color: 'f00',
    borderRadius: '0px',
  },
})

const NavDrawer: FC<Props> = ({ onClose, open }) => {
  const classes = (useStyles as any)()

  return (
    <Drawer open={open} classes={{ paper: classes.root }}>
      <StyleDrawer>
        <DrawerHeader>
          <BobaLogo />
          <WrapperCloseIcon>
            <CloseIcon onClick={onClose} />
          </WrapperCloseIcon>
        </DrawerHeader>
        <HeaderDivider />
        <ActionContainer>
          <ActionItem>
            <ActionIcon />
            <ActionLabel>Account</ActionLabel>
            <ActionValue>0x8321....A4E1</ActionValue>
          </ActionItem>
          <ActionItem>
            <ActionIcon />
            <ActionLabel>Account</ActionLabel>
            <ActionValue>0x8321....A4E1</ActionValue>
          </ActionItem>
          <ActionItem>
            <ActionIcon />
            <ActionLabel>Account</ActionLabel>
            <ActionValue>0x8321....A4E1</ActionValue>
          </ActionItem>
        </ActionContainer>
        <HeaderDivider />
        <NavList>
          {MENU_LIST.map((menu) => {
            return (
              <NavLinkItem
                key={menu.label}
                to={menu.path}
                activeclassname="active"
              >
                {menu.label}
              </NavLinkItem>
            )
          })}
        </NavList>
      </StyleDrawer>
    </Drawer>
  )
}

export default NavDrawer
