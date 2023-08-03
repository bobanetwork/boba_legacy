import React from 'react'
import { ReactSVG } from 'react-svg'
import { SvgTypes } from './types'

export const Svg: React.FC<SvgTypes> = ({
  src,
  fill = 'current',
  stroke = 'current',
  onClick,
  className,
}) => (
  // @ts-ignore
  <ReactSVG
    src={src}
    onClick={onClick}
    className={className}
    beforeInjection={(svg: SVGElement) => {
      svg.setAttribute('fill', fill)
      svg.setAttribute('stroke', stroke)
    }}
  />
)
