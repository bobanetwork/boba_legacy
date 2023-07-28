import { Typography } from 'components/global'
import styled, { css } from 'styled-components'

import ErrorOutline from '@mui/icons-material/ErrorOutline'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import ReportProblemOutlined from '@mui/icons-material/ReportProblemOutlined'

type AlertType = 'warning' | 'error' | 'info'

export const AlertContainer = styled.div<{ type?: AlertType }>`
  width: 100%;
  display: flex;
  padding: 12px 16px;
  justify-content: flex-start;
  align-items: center;
  gap: 16px;
  border-radius: 8px;
  ${({ type, theme: { name, colors } }) =>
    type === 'warning'
      ? css`
          border: 1px solid
            ${name === 'light' ? colors.yellow[100] : colors.yellow[200]};
          background: ${name === 'light'
            ? colors.yellow[50]
            : colors.yellow[500]};
          color: ${name === 'light' ? colors.yellow[500] : colors.yellow[200]};
        `
      : ''}

  ${({ type, theme: { name, colors } }) =>
    type === 'error'
      ? css`
          border: 1px solid
            ${name === 'light' ? colors.red[100] : colors.red[300]};
          background: ${name === 'light' ? colors.red[50] : colors.red[500]};
          color: ${name === 'light' ? colors.red[500] : colors.gray[100]};
        `
      : ''}
  ${({ type, theme: { name, colors } }) =>
    type === 'info'
      ? css`
          border: 1px solid
            ${name === 'light' ? colors.blue[200] : colors.blue[100]};
          background: ${name === 'light' ? colors.blue[50] : colors.blue[500]};
          color: ${name === 'light' ? colors.blue[500] : colors.blue[100]};
        `
      : ''}
`

export const ErrorIcon = styled(ErrorOutline)`
  color: ${({ theme: { colors } }) => colors.red[300]};
`
export const InfoIcon = styled(InfoOutlined)`
  color: ${({ theme: { colors } }) => colors.blue[100]};
`
export const WarningIcon = styled(ReportProblemOutlined)`
  color: ${({ theme: { colors } }) => colors.yellow[200]};
`

export const AlertText = styled(Typography).attrs({
  variant: 'body3',
})``
