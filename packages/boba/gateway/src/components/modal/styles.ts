import { Box } from '@mui/material'
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
  border: 1px solid ${(props) => props.theme.colors.gray[300]};
  background: ${(props) => props.theme.colors.popup};
  width: 100%;

  ${(props) =>
    props.transparent &&
    css`
      background: ${props.theme.palette.background.modalTransparent};
    `}

  backdrop-filter: ${(props) => (props.transparent ? 'none' : 'blur(15px)')};
  padding: 32px 24px;
  outline: 0;
  box-sizing: border-box;
  border-radius: 12px;

  ${(props) =>
    props.shouldForwardProp &&
    `
    ${props.shouldForwardProp(props)}
  `}
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
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: 5px;
`
export const IconButtonTag = styled.div`
  margin-left: auto;
  cursor: pointer;
`

export const Content = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 10px;
`

export const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: center;
  gap: 10px;
`

export const BoxCenter = styled(Box)`
  display: flex;
  justify-content: space-around;
  align-items: center;
  cursor: pointer;
`
