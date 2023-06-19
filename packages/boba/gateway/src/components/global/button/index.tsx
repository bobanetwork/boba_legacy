import React, { FC } from 'react'
import { ButtonContainer, SpinLoader } from './styles'
import { ButtonTypes } from './types'

export const Button: FC<ButtonTypes> = ({
  disable = false,
  loading = false,
  small = false,
  label,
  onClick,
}) => {
  return (
    <ButtonContainer
      type="button"
      disable={disable}
      loading={loading}
      onClick={onClick}
      small={small}
    >
      {loading && <SpinLoader />} {label}
    </ButtonContainer>
  )
}
