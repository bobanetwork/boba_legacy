import React from 'react'
import { ButtonContainer, SpinLoader } from './styles'

export interface ButtonTypes {
  disable?: boolean
  loading?: boolean
  label: string
  onClick?: () => void
}

export const Button = ({
  disable = false,
  loading = false,
  label,
  onClick,
}: ButtonTypes) => {
  return (
    <ButtonContainer
      type="button"
      disable={disable}
      loading={loading}
      onClick={onClick}
      label={label}
    >
      {loading && <SpinLoader />} {label}
    </ButtonContainer>
  )
}
