import React, { useState } from 'react'

interface Option {
  label: string
  value: string
}

interface DropdownProps {
  options: Option[]
}

const Dropdown = ({ options }: DropdownProps): JSX.Element => {
  const [selectedOption, setSelectedOption] = useState<string>('')

  const handleOptionClick = (optionValue: string): void => {
    setSelectedOption(optionValue)
  }

  return (
    <div>
      {options.map((option) => (
        <div
          key={option.value}
          onClick={() => handleOptionClick(option.value)}
          style={{
            fontWeight: option.value === selectedOption ? 'bold' : 'normal',
          }}
        >
          {option.label}
        </div>
      ))}
      <p>Has seleccionado: {selectedOption}</p>
    </div>
  )
}
