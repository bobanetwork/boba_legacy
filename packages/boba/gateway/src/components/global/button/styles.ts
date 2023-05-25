import styled, { keyframes } from 'styled-components'
import { ButtonTypes } from 'components/global/button'

export const ButtonContainer = styled.button<ButtonTypes>`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  min-width: 250px;
  -webkit-appearance: none;
  border-radius: 12px;
  cursor: pointer;
  border: 0px;
  outline: none;
  background: #aedb01;
  padding: 16px 25px;

  font-family: 'Montserrat';
  font-weight: 700;
  font-size: 18px;

  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.15);
  transition: background-color 0.25s ease;

  &:hover {
    background: #90b406;
  }

  ${(props) =>
    props.disable &&
    `
    background:#637A0D
    cursor:default;
  `}

  ${(props) =>
    props.loading &&
    `
    background:#AEDB01
    cursor:default;
  `}
`

const nk_spinner = keyframes`
  100% { transform: rotate(360deg); }
`

export const SpinLoader = styled.span`
  display: flex;
  margin-right: 5px;
  position: relative;
  box-sizing: border-box;
  width: 16px;
  height: 16px;
  border: 3px solid rgba(95, 95, 95, 0.3);
  border-left: 3px solid rgba(38, 38, 38, 1);
  border-radius: 50%;
  animation: ${nk_spinner} 1s infinite cubic-bezier(0.65, 0.54, 0.5, 0.93);
`
