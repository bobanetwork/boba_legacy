import styled, { css, keyframes } from 'styled-components'

const pulseLightAnimation = keyframes`
  0% {
    background-color: rgba(255,255,255,0.1);
  }
  100% {
    background-color: rgba(255,255,255,0.2);
  }
`

const pulseDarkAnimation = keyframes`
  0% {
    background-color: rgba(0,0,0,0.1);
  }
  100% {
    background-color: rgba(0,0,0,0.2);
  }
`

const BasePreloader = styled.div`
  height: 22px;
  background: rgba(255, 255, 255, 0.2);
  ${(props) =>
    props.theme.name === 'light' &&
    css`
      animation: ${pulseDarkAnimation} 0.65s infinite alternate;
    `}
  ${(props) =>
    props.theme.name === 'dark' &&
    css`
      animation: ${pulseLightAnimation} 0.65s infinite alternate;
    `}
  width: 100%;
`
export const Number = styled(BasePreloader)`
  width: 25px;
`
export const Title = styled(BasePreloader)`
  width: 100%;
`
export const Label = styled(BasePreloader)`
  width: 70px;
`
export const Arrow = styled(BasePreloader)`
  width: 12px;
`

export const PreloaderContainer = styled.div`
  width: 100%;
  gap: 15px 0px;
  padding-right: 15px;
  display: flex;
  flex-direction: column;
`
export const Preload = styled.div`
  border: 1px solid ${(props) => props.theme.colors.box.border};
  border-radius: 12px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0px 10px;
  padding: 20px;
  background: ${(props) => props.theme.colors.box.background};
`
