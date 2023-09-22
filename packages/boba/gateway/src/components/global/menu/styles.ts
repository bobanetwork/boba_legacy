import MUIMenu from '@mui/material/Menu'
import MUIMenuItem from '@mui/material/MenuItem'
import styled, { css } from 'styled-components'
import { Typography } from '../typography'

export const StyleMenuButton = styled.div<{
  active?: boolean
  variant?: 'outline' | 'standard'
}>`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 24px;
  border-radius: 33px;
  cursor: pointer;
  gap: 10px;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  color: ${({ theme: { colors, name } }) =>
    name === 'light' ? colors.gray[800] : colors.gray[50]};
  border-radius: 28px;
  background: ${({ theme: { name, colors } }) =>
    name === 'light' ? colors.gray[50] : colors.gray[400]};

  ${({ variant, active, theme: { name, colors } }) =>
    variant &&
    variant === 'outline' &&
    css`
      color: ${name === 'light' ? colors.gray[600] : colors.gray[200]};
      border: 2px solid
        ${name === 'light'
          ? colors.gray[600]
          : active
          ? colors.green[300]
          : colors.gray[200]};

      background: transparent;

      &:hover {
        color: ${name === 'light' ? colors.gray[600] : colors.gray[100]};
        border: 2px solid
          ${name === 'light' ? colors.gray[600] : colors.green[300]};
      }
    `}

  ${({ active, variant, theme: { colors, name } }) =>
    active &&
    variant &&
    variant === 'outline' &&
    css`
      color: ${name === 'light' ? colors.gray[800] : colors.gray[100]};
    `}
`

export const StyledLabel = styled(Typography).attrs({
  variant: 'body3',
})`
  color: ${({ theme: { colors, name } }) =>
    name === 'light' ? colors.gray[800] : colors.gray[100]};
`

export const StyledMenuItem = styled(MUIMenuItem)`
  && {
    border-radius: 8px;
    margin: 5px;
    padding: 8px 16px;
    &:hover {
      background: ${({ theme: { colors } }) => colors.gray[400]};
    }
  }
`
export const StyledMenu = styled(MUIMenu)`
  && {
    .MuiMenu-paper {
      margin: ${({ anchorOrigin }) =>
          anchorOrigin?.vertical === 'bottom' ? '5px' : '-5px'}
        0px;
    }
    .MuiList-root {
      background: ${({ theme: { colors, name } }) =>
        name === 'light' ? colors.gray[50] : colors.gray[500]};
      border-radius: 8px;
      border: 1px solid ${({ theme: { colors } }) => colors.gray[400]};
    }
  }
`
