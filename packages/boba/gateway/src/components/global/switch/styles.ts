import styled from 'styled-components'

export const Slider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  will-change: background-color;
  transform: translateZ(0);
  background-color: ${(props) => props.theme.colors.gray[200]};
  -webkit-transition: 0.4s;
  transition: 0.2s;
  border-radius: 34px;
  border: 0px;
  background-clip: content-box;

  &:before {
    position: absolute;
    border-radius: 17px;
    content: '';
    height: 17px;
    width: 17px;
    left: 2px;
    bottom: 2px;
    transform: translateZ(0);
    background-color: ${(props) => props.theme.colors.gray[50]};
    -webkit-transition: 0.4s;
    transition: 0.4s;
  }
`

export const Input = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  outline: none;
  border: none;

  &:checked + ${Slider} {
    background-color: ${(props) => props.theme.colors.green[300]};
    border-color: ${(props) => props.theme.colors.green[300]};

    &:before {
      -webkit-transform: translateX(14px);
      -ms-transform: translateX(14px);
      transform: translateX(14px);
    }
  }

  &:disabled + ${Slider} {
    background-color: ${(props) => props.theme.colors.gray[200]};
    border-color: ${(props) => props.theme.colors.green[200]};
  }

  &:disabled {
    & + ${Slider}:before {
      background-color: ${(props) => props.theme.colors.gray[500]};
    }
    &:checked + ${Slider} {
      background-color: ${(props) => props.theme.colors.green[500]};
      border-color: ${(props) => props.theme.colors.green[500]};
    }
  }

  &:focus + ${Slider} {
    outline: none;
    box-shadow: 0 0 1px #2196f3;
  }
`

export const Switch = styled.label`
  position: relative;
  display: flex;
  width: 35px;
  height: 21px;
  border: 0px;
  background-clip: content-box;
  border-radius: 34px;
`
