import React, { useState } from 'react'
import { InputContainer, MaxButton, Input } from './styles'

export interface MaxInputProps {
  max: number
  initialValue: number
  onValueChange: (value: number) => void
}

export const MaxInput: React.FC<MaxInputProps> = ({
  max,
  initialValue,
  onValueChange,
}) => {
  const [value, setValue] = useState<string | number>(initialValue)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (newValue === '') {
      setValue('')
      return
    }
    const newValueNumber = parseFloat(newValue)
    if (isNaN(newValueNumber) || newValueNumber < 0 || newValueNumber > max) {
      return
    }
    setValue(newValueNumber)
    onValueChange(newValueNumber)
  }

  const handleMaxClick = () => {
    setValue(max)
    onValueChange(max)
  }

  return (
    <InputContainer>
      <Input
        type="number"
        value={value}
        onChange={handleInputChange}
        min={0}
        max={max}
        step={0.1}
        placeholder={'Enter Amount'}
      />
      <MaxButton onClick={handleMaxClick}>Max</MaxButton>
    </InputContainer>
  )
}
