import styled from 'styled-components'
import { Typography } from 'components/global/typography'

export const PlaceholderContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px 0px;
  width: 100%;
  margin: 25px auto;
`

export const Label = styled(Typography)`
  text-transform: capitalize;
  padding-bottom: 15px;
  color: ${({ theme }) =>
    theme.name === 'light' ? theme.colors.gray[600] : theme.colors.gray[100]};
`
