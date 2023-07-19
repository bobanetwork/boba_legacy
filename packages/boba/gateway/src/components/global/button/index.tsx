import React, { FC } from 'react'
import { ButtonContainer, SpinLoader } from './styles'
import { ButtonTypes } from './types'

export const Button: FC<ButtonTypes> = ({
  disable = false,
  loading = false,
  small = false,
  outline = false,
  transparent = false,
  className,
  label,
  onClick,
}) => {
  return (
    <ButtonContainer
      type="button"
      disable={disable}
      loading={loading}
      onClick={onClick}
      outline={outline}
      transparent={transparent}
      small={small}
      className={className}
    >
      {loading && <SpinLoader />} {label}
    </ButtonContainer>
  )
}
