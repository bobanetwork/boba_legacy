import { Typography } from 'components/global'
import styled from 'styled-components'

export const SuccessContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  gap: 25px;
`

export const TitleText = styled(Typography).attrs({
  variant: 'body1',
})`
  text-align: center;
`

export const MutedText = styled(Typography).attrs({
  variant: 'body3',
})`
  color: ${({ theme }) => theme.colors.gray[100]};
`

export const CircleOuter = styled.div`
  display: flex;
  border-radius: 50%;
  justify-content: center;
  align-items: center;
  height: 150px;
  width: 150px;
  background: ${({ theme }) => theme.colors.green[500]};
`
export const CircleInner = styled.div`
  display: flex;
  border-radius: 50%;
  justify-content: center;
  align-items: center;
  height: 120px;
  width: 120px;
  background: ${({ theme }) => theme.colors.green[400]};
`

export const SuccessCheck = styled.div`
  display: flex;
  border-radius: 50%;
  justify-content: center;
  align-items: center;
  height: 90px;
  width: 90px;
  background: ${({ theme }) => theme.colors.green[300]};
  position: relative;
  &:after {
    content: '✓';
    font-size: 60px;
    color: #fff;
    position: absolute;
    margin: auto;
  }
`

export const SuccessContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  gap: 8px;
`
