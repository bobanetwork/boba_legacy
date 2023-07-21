import React, { FC } from 'react'
import { ButtonContainer, SpinLoader } from './styles'
import { ButtonTypes } from './types'

export const Button: FC<ButtonTypes> = ({
  disable = false,
  loading = false,
  small = false,
  outline = false,
  transparent = false,
  tiny = false,
  className,
  label,
  onClick,
}) => {
  return (
    <ButtonContainer
      type="button"
      disable={disable}
      loading={loading}
      tiny={tiny}
      transparent={transparent}
      small={small}
      outline={outline}
      onClick={onClick}
      className={className}
    >
      {loading && <SpinLoader />} {label}
    </ButtonContainer>
  )
}
