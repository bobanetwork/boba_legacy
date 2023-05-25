import React from 'react'
import { ButtonContainer, SpinLoader } from './styles'

export interface ButtonTypes {
  disable?: boolean
  loading?: boolean
  label: string
  className?: string
  onClick?: () => void
}

export const Button = ({
  disable = false,
  loading = false,
  label,
  onClick,
  className,
}: ButtonTypes) => {
  if (loading) {
    return (
      <ButtonContainer
        type="button"
        disable={disable}
        loading={loading}
        className={className}
        onClick={onClick}
        label={label}
      >
        <SpinLoader /> {label}
      </ButtonContainer>
    )
  }

  return (
    <ButtonContainer
      type="button"
      disable={disable}
      loading={loading}
      className={className}
      onClick={onClick}
      label={label}
    >
      {label}
    </ButtonContainer>
  )
}
