import React, { FC, ReactNode } from 'react'
import { TypographyProps } from './types'
import { StyledText } from './style'

/**
 *
 * @param
 * component : will have default as <p> since it'll propbably be our most used tag.
 * variant : can be one  | 'head' | 'title' | 'body1' | 'body2' | 'body3' | 'subtitle'
 *
 * @returns react component.
 */

const Typography: FC<TypographyProps> = ({
  children,
  component = 'p',
  variant,
  ...rest
}) => {
  return (
    <StyledText as={component} {...rest} variant={variant}>
      {children}
    </StyledText>
  )
}

export default Typography
