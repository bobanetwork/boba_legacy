import React from 'react'
import { InputContainer, InputStyle } from './styles'
import { InputProps } from './types'

export const Input = ({
  placeholder,
  type,
  onChange,
  value,
  label,
}: InputProps) => {
  return (
    <InputContainer>
      {label && label}{' '}
      <InputStyle
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
    </InputContainer>
  )
}
