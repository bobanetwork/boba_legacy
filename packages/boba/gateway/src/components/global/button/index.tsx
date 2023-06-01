import React from 'react'
import { ButtonContainer, SpinLoader } from './styles'

export interface ButtonTypes {
  disable?: boolean
  loading?: boolean
  small?: boolean
  label: string
  onClick?: () => void
}

export const Button = ({
  disable = false,
  loading = false,
  small = false,
  label,
  onClick,
}: ButtonTypes) => {
  return (
    <ButtonContainer
      type="button"
      disable={disable}
      loading={loading}
      onClick={onClick}
      small={small}
      label={label}
    >
      {loading && <SpinLoader />} {label}
    </ButtonContainer>
  )
}
