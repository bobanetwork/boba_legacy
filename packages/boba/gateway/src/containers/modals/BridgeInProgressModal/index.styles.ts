import { Typography } from 'components/global'
import styled, { keyframes } from 'styled-components'

export const InprogressContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  gap: 8px;
  text-align: center;
`

const circleAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg);
`

export const ProgressLoader = styled.div`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  border: 10px solid ${({ theme }) => theme.colors.green[500]};
  border-top: 10px solid ${({ theme }) => theme.colors.green[300]};
  animation-name: ${circleAnimation};
  animation-duration: 1s;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
  margin-bottom: 10px;
`

export const MutedText = styled(Typography).attrs({
  variant: 'subtitle',
})`
  color: ${({ theme }) => theme.colors.gray[100]};
`
