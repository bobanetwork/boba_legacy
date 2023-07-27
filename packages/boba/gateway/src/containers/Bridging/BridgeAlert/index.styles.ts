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
  justify-content: center;
  align-items: center;
  gap: 16px;
  border-radius: 8px;
  ${({ type, theme }) =>
    type === 'warning'
      ? css`
          border: 1px solid #f7c367;
          background: #413011;
          color: #f9d28d;
        `
      : ''}

  ${({ type }) =>
    type === 'error'
      ? css`
          border: 1px solid #d84f4f;
          background: var(--red-500, #562020);
          color: #d84f4f;
        `
      : ''}
  ${({ type }) =>
    type === 'info'
      ? css`
          border: 1px solid #b7c7f0;
          background: #1e2e57;
          color: #b7c7f0;
        `
      : ''}
`

export const ErrorIcon = styled(ErrorOutline)`
  color: ${(props) => props.theme.colors.red[300]};
`
export const InfoIcon = styled(InfoOutlined)`
  color: ${(props) => props.theme.colors.blue[100]};
`
export const WarningIcon = styled(ReportProblemOutlined)`
  color: ${(props) => props.theme.colors.yellow[200]};
`

export const AlertText = styled(Typography).attrs({
  variant: 'body3',
})``
