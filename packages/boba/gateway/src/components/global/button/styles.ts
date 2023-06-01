import styled, { keyframes } from 'styled-components'
import { ButtonTypes } from 'components/global/button'

export const ButtonContainer = styled.button<ButtonTypes>`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  min-width: 290px;
  -webkit-appearance: none;
  border-radius: 12px;
  cursor: pointer;
  border: 0px;
  outline: none;
  background: ${(props) => props.theme.colors.green[300]};
  padding: 16px 25px;

  font-family: 'Montserrat';
  font-weight: 700;
  font-size: ${(props) => props.theme.text.heading1};

  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.15);
  transition: background-color 0.25s ease;

  ${(props) =>
    props.disable &&
    `
    background:${props.theme.colors.green[500]};
    cursor:default;
  `}

  ${(props) =>
    props.loading &&
    `
    background:${props.theme.colors.green[300]};
    cursor:default;
  `}

  ${(props) =>
    !props.disable &&
    `
    &:hover {
      background: ${props.theme.colors.green[400]};
    }
  `}
    ${(props) =>
      props.small &&
      `
    font-size: ${props.theme.text.body2};
    border-radius: 33px;
    min-width:auto;
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
