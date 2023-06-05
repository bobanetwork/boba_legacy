import React from 'react'
import { ReactSVG } from 'react-svg'

export interface SvgProps {
  src: string
  fill: string
}

export const Svg = ({ src, fill }: SvgProps) => (
  <ReactSVG
    src={src}
    beforeInjection={(svg) => {
      svg.setAttribute('style', `fill: ${fill}`)
    }}
  />
)
