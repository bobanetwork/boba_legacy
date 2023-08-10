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
import networkService from 'services/networkService'
import { getCoinImage } from 'util/coinImage'
import BobaLogo from 'assets/images/Boba_Logo_White_Circle.png'
import useFeeSwitcher from 'hooks/useFeeSwitcher'

interface Props {
  open: boolean
  onClose: () => void
}

const FeeSwitcherDrawer: FC<Props> = ({ onClose, open = false }) => {
  const { switchFeeUse } = useFeeSwitcher()

  const onFeeSwitch = async (target: any) => {
    await switchFeeUse(target)
    onClose()
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
            <MenuItemStyle
              onClick={() => onFeeSwitch(networkService.L1NativeTokenSymbol)}
            >
              <img
                src={getCoinImage(networkService.L1NativeTokenSymbol)}
                alt=""
                width="30px"
              />
              <ItemLabel>{networkService.L1NativeTokenSymbol}</ItemLabel>
            </MenuItemStyle>
            <MenuItemStyle onClick={() => onFeeSwitch('BOBA')}>
              <img src={BobaLogo} alt="" width="30px" />
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
