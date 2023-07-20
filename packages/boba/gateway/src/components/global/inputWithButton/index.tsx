import { InputContainer, Input, InputActionButton } from './styles'
import React, { FC } from 'react'

interface Props {
  placeholder: string
  buttonLabel: string
  name: string
  disabled?: boolean
  type?: string
  value?: any
  onButtonClick: (e: any) => void
  onChange: (e: any) => void
}

const InputWithButton: FC<Props> = ({
  onButtonClick,
  buttonLabel,
  name,
  type,
  value,
  disabled,
  onChange,
  placeholder,
}) => {
  return (
    <InputContainer>
      <Input
        type={type}
        value={value}
        disabled={disabled}
        id={name}
        name={name}
        placeholder={placeholder}
        onChange={onChange}
      />
      <InputActionButton disabled={disabled} onClick={onButtonClick}>
        {buttonLabel}
      </InputActionButton>
    </InputContainer>
  )
}

export default InputWithButton
