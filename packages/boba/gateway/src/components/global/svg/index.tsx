import React from 'react'
import { ReactSVG } from 'react-svg'

export interface SvgProps {
  src: string
  fill: string
}

export const Svg: React.FC<SvgProps> = ({ src, fill }) => (
  // @ts-ignore
  <ReactSVG
    src={src}
    beforeInjection={(svg: SVGElement) => {
      svg.setAttribute('fill', fill)
    }}
  />
)
