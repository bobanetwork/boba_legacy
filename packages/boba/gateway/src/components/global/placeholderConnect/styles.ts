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
`

export const Label = styled(Typography)`
  text-transform: capitalize;
  padding-bottom: 15px;
`
