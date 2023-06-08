import { Box, IconButton } from '@mui/material'
import styled, { css } from 'styled-components'
import ModalUnstyled from '@mui/base/ModalUnstyled'

export const StyledModal = styled(ModalUnstyled)`
  position: fixed;
  z-index: 1300;
  right: 0;
  bottom: 0;
  top: 0;
  left: 0;
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);

  ${(props) =>
    props.theme.name === 'light' &&
    css`
      background: rgba(0, 0, 0, 0.6);
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      background: rgba(0, 0, 0, 0.4);
    `}
`

export const Backdrop = styled.div`
  z-index: -1;
  position: fixed;
  right: 0;
  bottom: 0;
  top: 0;
  left: 0;

  -webkit-tap-highlight-color: transparent;
`
interface StyleProps {
  transparent?: boolean
  shouldForwardProp?: (props: StyleProps) => boolean
}

export const Style = styled.div<StyleProps>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  ${(props) =>
    props.theme.name === 'light' &&
    css`
      background: ${props.theme.colors.gray[50]};
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      background: linear-gradient(
        151.67deg,
        rgba(48, 48, 48, 0.7) 7.91%,
        rgba(48, 48, 48, 0.7) 45.81%,
        rgba(37, 37, 37, 0.7) 85.18%
      );
    `}
  ${(props) =>
    props.transparent &&
    css`
      background: ${props.theme.palette.background.modalTransparent};
    `}
  


  backdrop-filter: ${(props) => (props.transparent ? 'none' : 'blur(66px)')};
  padding: 20px;
  border: 0;
  outline: 0;
  box-sizing: border-box;
  max-width: 100%;
  border-radius: 20px;

  ${(props) =>
    props.shouldForwardProp &&
    `
    ${props.shouldForwardProp(props)}
  `}
`

export const IconButtonTag = styled(IconButton)`
  @media (max-width: 980px) {
    position: absolute;
    top: 0;
    right: 20px;
  }
`

export const WrapperActionsModal = styled(Box)`
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 50px;
`

export const ModalHead = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 5px;
`

export const Content = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

export const BoxCenter = styled(Box)`
  display: flex;
  justify-content: space-around;
  align-items: center;
  cursor: pointer;
`
