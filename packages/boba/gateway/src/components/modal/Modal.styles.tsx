import { Box, IconButton } from '@mui/material'
import styled from 'styled-components'
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
  backdrop-filter: ${(props) => (props.ismobile ? 'blur(20px)' : 'none')};
`

export const Backdrop = styled('div')`
  z-index: -1;
  position: fixed;
  right: 0;
  bottom: 0;
  top: 0;
  left: 0;
  background-color: #111315;
  opacity: 0.8;
  backdrop-filter: blur(10px);
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
  background: ${(props) =>
    props.transparent
      ? props.theme.palette.background.modalTransparent
      : props.theme.palette.background.modal};
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
