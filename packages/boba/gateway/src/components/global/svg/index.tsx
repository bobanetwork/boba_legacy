import React from 'react'
import { ReactSVG } from 'react-svg'
import { SvgTypes } from './types'

export const Svg: React.FC<SvgTypes> = ({
  src,
  fill = 'current',
  stroke = 'current',
  onClick,
}) => (
  // @ts-ignore
  <ReactSVG
    src={src}
    onClick={onClick}
    beforeInjection={(svg: SVGElement) => {
      svg.setAttribute('fill', fill)
      svg.setAttribute('stroke', stroke)
    }}
  />
)
