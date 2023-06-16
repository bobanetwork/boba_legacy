import React, { FC, ReactNode } from 'react'
import { HeadingProps } from './types'
import { StyledHeading } from './style'

/**
 *
 * @param
 * variant : can be one of 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
 *
 * @returns react component.
 */

export const Heading: FC<HeadingProps> = ({ children, variant, ...rest }) => {
  return (
    <StyledHeading {...rest} as={variant} variant={variant}>
      {children}
    </StyledHeading>
  )
}
