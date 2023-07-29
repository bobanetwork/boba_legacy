import React, { FC } from 'react'
import { BobaLogo } from '../styles'
import {
  DrawerContainer,
  DrawerHeader,
  CloseIcon,
  ActionContainer,
  ActionItem,
  ActionLabel,
  ActionValue,
  NavList,
  NavItem,
} from './styles'

interface Props {
  onClose: () => void
}

const NavDrawer: FC<Props> = ({ onClose }) => {
  return (
    <DrawerContainer>
      <DrawerHeader>
        <BobaLogo />
        <CloseIcon onClick={onClose} />
      </DrawerHeader>
      <ActionContainer>
        <ActionItem>
          <ActionLabel>Light Mode</ActionLabel>
          <ActionValue>Switch</ActionValue>
        </ActionItem>
      </ActionContainer>
      <NavList>
        <NavItem>Bridge</NavItem>
        <NavItem>History</NavItem>
        <NavItem>Stake</NavItem>
        <NavItem>DAO</NavItem>
      </NavList>
    </DrawerContainer>
  )
}

export default NavDrawer
