import HelpOutlineOutlined from '@mui/icons-material/HelpOutlineOutlined'
import { openModal } from 'actions/uiAction'
import { Heading, Typography } from 'components/global'
import Tooltip from 'components/tooltip/Tooltip'
import React from 'react'
import { useDispatch } from 'react-redux'
import styled, { useTheme } from 'styled-components'
import { BridgeHeaderWrapper, GearIcon, IconWrapper } from './styles'

type Props = {}

export const LabelStyle = styled.span`
  color: var(--Gray-50, #eee);
  font-family: Roboto;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  line-height: 138.3%;
`

export const ValueStyle = styled.span`
  color: var(--Gray-50, #eee);
  font-family: Roboto;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 138.3%;
`

const BridgeHeader = (props: Props) => {
  const dispatch = useDispatch<any>()
  const theme: any = useTheme()

  const iconColor =
    theme.name === 'light' ? theme.colors.gray[600] : theme.colors.gray[100]

  const openSettingModal = () => {
    dispatch(openModal('settingsModal'))
  }

  return (
    <BridgeHeaderWrapper>
      <Heading variant="h2">
        Bridge
        <Tooltip
          title={
            <>
              <LabelStyle>Classic Bridge</LabelStyle> <br />
              <ValueStyle>
                Although this option is always available, it takes 7 days to
                receive your funds when withdrawing from L2 to L1.
              </ValueStyle>
              <br />
              <br />
              <LabelStyle>Fast Bridge</LabelStyle>
              <br />
              <ValueStyle>
                A swap-based bridge to Boba L2. This option is only available if
                the pool balance is sufficient.
              </ValueStyle>
            </>
          }
        >
          <IconWrapper inline={true} style={{ marginLeft: '5px' }}>
            <HelpOutlineOutlined
              fontSize="small"
              sx={{ cursor: 'pointer', color: iconColor }}
            />
          </IconWrapper>
        </Tooltip>
      </Heading>
      <IconWrapper>
        <GearIcon sx={{ color: iconColor }} onClick={openSettingModal} />
      </IconWrapper>
    </BridgeHeaderWrapper>
  )
}

export default BridgeHeader
