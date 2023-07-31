import React from 'react'
import { ReactSVG } from 'react-svg'
import { SvgTypes } from './types'

export const Svg: React.FC<SvgTypes> = ({ src, fill }) => (
  // @ts-ignore
  <ReactSVG
    src={src}
    beforeInjection={(svg: SVGElement) => {
      svg.setAttribute('fill', fill)
    }}
  />
)
