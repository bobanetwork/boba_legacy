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
  style,
}) => {
  return (
    <ButtonContainer
      style={style}
      type="button"
      disable={disable}
      loading={loading}
      tiny={tiny}
      transparent={transparent}
      small={small}
      outline={outline}
      onClick={!disable ? onClick : () => {}}
      className={className}
      label={label}
    >
      {loading && <SpinLoader />} {label}
    </ButtonContainer>
  )
}
