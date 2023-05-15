import styled from 'styled-components'
import { Column, Row } from 'components/global/containers'

export const BanxaContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px 0px;
  background: rgba(255, 255, 255, 0.04);
  -webkit-backdrop-filter: blur(50px);
  backdrop-filter: blur(50px);
  border-radius: 20px;
  -webkit-filter: drop-shadow(0px 4px 20px rgba(35, 92, 41, 0.06));
  filter: drop-shadow(0px 4px 20px rgba(35, 92, 41, 0.06));
  padding: 24px;
  width: 100%;
  max-width: 600px;
`

export const Label = styled(Column)`
  position: relative;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.04);
  border: solid 1px rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  width: 100%;
  padding: 10px 15px;
`

export const LabelText = styled.label`
  font-size: 16px;
  color: #919191;
`

export const Input = styled.input`
  font-size: 20px;
  font-weight: 500;
  line-height: 1;
  background: transparent;
  color: #fff;
  border: 0px;
  margin-left: 5px;
  width: auto;
  outline: none;
  &:focus {
    outline-color: rgba(255, 255, 255, 0.1) !important;
  }
  @media (max-width: 767px) {
    max-width: 180px;
  }
`

export const SwapContainer = styled(Column)`
  width: 100%;
  gap: 10px 0px;
  padding: 15px 0px;
  flex-direction: column;
`

export const Fees = styled(Row)`
  font-size: 13px;
  color: #919191;
  margin-left: auto;
  width: auto;
`
export const Option = styled(Row)`
  cursor: pointer;
  padding: 5px 15px;
  border-top: 1px solid #25272d;
  border-bottom: 1px solid #25272d;
  img {
    margin-right: 5px;
  }
`

export const Check = styled.div`
  position: relative;
  display: flex;
  width: 20px;
  height: 20px;
  margin-left: 5px;
  border: 1px solid #25272d;
  border-radius: 50%;
  &:after {
    transition: background 0.5s ease;
    position: relative;
    border-radius: 50%;
    content: '';
    left: 4px;
    top: 4px;
    width: 10px;
    height: 10px;
  }
  &.active {
    &:after {
      background: #9eff00;
    }
  }
`

export const OptionContainer = styled(Column)`
  padding: 15px 0px;
  width: 100%;
`

export const ButtonContainer = styled(Column)`
  width: 100%;
  margin: 15px auto;
  align-items: center;
`

export const IconMethod = styled.img`
  filter: grayscale(1) invert(1);
  width: auto;
  position: relative;
  min-height: 10px;
  max-height: 15px;
`

export const OptionWrapper = styled.div`
  width: 100%;
`
