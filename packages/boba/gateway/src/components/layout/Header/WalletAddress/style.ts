import { Typography } from 'components/global'
import styled from 'styled-components'

export const CircleIndicator = styled.div`
  height: 24px;
  width: 24px;
  border-radius: 50%;
  background: #0787af;
`

export const MenuItemStyle = styled(Typography).attrs({
  variant: 'body3',
})`
  padding: 5px 10px;
  gap: 10px !important;
  width: 100%;
  display: flex !important;
  align-items: center;
  justify-content: flex-start;
  color: ${({ theme: { colors, name } }) =>
    name === 'light' ? colors.gray[800] : colors.gray[100]};

  svg {
    fill: ${({ theme: { colors, name } }) =>
      name === 'light' ? colors.gray[800] : colors.gray[100]};
  }
`

export const ProfileIndicator = styled.img.attrs({
  alt: 'profile image',
})`
  height: 24px;
  width: 24px;
  border-radius: 50%;
`
