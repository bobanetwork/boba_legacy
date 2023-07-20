import { Typography } from 'components/global'
import styled from 'styled-components'

import ErrorOutline from '@mui/icons-material/ErrorOutline'

export const AlertContainer = styled.div`
  width: 100%;
  display: flex;
  padding: 12px 16px;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  border: 1px solid #d84f4f;
  background: var(--red-500, #562020);
`
export const AlertIcon = styled(ErrorOutline)`
  color: ${(props) => props.theme.colors.red[300]};
`

export const AlertText = styled(Typography).attrs({
  variant: 'body2',
})`
  color: ${(props) => props.theme.colors.gray[100]};
`
