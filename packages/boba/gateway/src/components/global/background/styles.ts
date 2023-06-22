import styled, { keyframes } from 'styled-components'
import { BackgroundProps } from './types'
const gridHeight = '200vh'

const linesColor = (theme: string) => {
  if (theme === 'light') {
    return 'rgba(0, 0, 0, 0.025)'
  } else {
    return 'rgba(255, 255, 255, 0.025)'
  }
}

const gradientColor = (theme: string) => {
  if (theme === 'light') {
    return 'radial-gradient(45% 45% at 50% 50%, rgba(174, 219, 1, 0.4) 19.79%, rgba(174, 219, 1, 0.125) 50%, rgba(174, 219, 1, 0) 70%);'
  } else {
    return 'radial-gradient(45% 45% at 50% 50%, rgba(174, 219, 1, 0.32) 19.79%, rgba(174, 219, 1, 0.1) 50%, rgba(174, 219, 1, 0) 70%);'
  }
}

export const BackgroundContainer = styled.div`
  height: 100vh;
  width: 100%;
  display: block;
  overflow: hidden;
  position: fixed;
  z-index: 0;
`

export const GridBackground = styled.div`
  width: 100%;
  height: ${gridHeight};
  overflow: hidden;
  perspective: calc(${gridHeight} * 90);
`

export const GridFade = styled.div<BackgroundProps>`
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 1;
  transform: translateY(-50vh);
  will-change: translateY;
  transition: transform 1s ease;
  background-image: ${(props) => gradientColor(props.theme.name)};
  background-clip: padding-box;
  background-origin: content-box;

  ${({ position }) =>
    position === 'top' &&
    `
    transform: translateY(-100vh);
  `}
`

const playAnimation = keyframes`
	0% {
		transform: rotateX(45deg) translateY(-50%);
	}
	100% {
		transform: rotateX(45deg) translateY(0%);
	}
`

export const GridLines = styled.div`
  width: 100%;
  height: 200%;
  background-image: linear-gradient(
      to right,
      ${(props) => linesColor(props.theme.name)} 1px,
      transparent 0
    ),
    linear-gradient(
      to bottom,
      ${(props) => linesColor(props.theme.name)} 1px,
      transparent 0
    );
  background-size: 45px 30px;
  background-repeat: repeat;
  transform-origin: 100% 0 0;
  will-change: transform;
  animation: ${playAnimation} 15s linear infinite;
`
