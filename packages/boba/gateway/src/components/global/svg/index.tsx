import React from 'react'
import { ReactSVG } from 'react-svg'
import { SvgTypes } from './types'

export const Svg: React.FC<SvgTypes> = ({ src, className, fill, alt }) => (
  // @ts-ignore
  <ReactSVG
    src={src}
    className={className}
    beforeInjection={(svg: SVGElement) => {
      if (fill) {
        svg.setAttribute('fill', fill)
      }
    }}
    alt={alt ? alt : ''}
  />
)
