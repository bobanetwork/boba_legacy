import React, { useState } from 'react'
import styled from 'styled-components'
import ArrowIcon from 'images/arrow-down.svg'
interface Option {
  label: string
  value: string
}

interface DropdownProps {
  options: Option[]
}

const DropDownContainer = styled.div`
  z-index: 2;
  position: relative;
`
const DefaultOption = styled.div`
  position: relative;
  cursor: pointer;
  z-index: 2;
`
const DropDownOptions = styled.div`
  position: absolute;
  padding: 45px 20px 15px 15px;
  top: -10px;
  right: -10px;
  z-index: 1;
  line-height: 1;
  background: #111315;
  border-radius: 10px;
`

const Arrow = styled.img`
  margin-left: 5px;
`
const Options = styled.div`
  text-align: right;
  opacity: 0.5;
  cursor: pointer;
  padding: 5px;
  &:first-of-type {
    padding-top: 10px;
    border-top: 1px dashed rgba(255, 255, 255, 0.06);
  }
`

export const DropDown = ({ options }: DropdownProps): JSX.Element => {
  const [isVisible, setIsVisible] = useState<boolean>(false)
  const [selectedOption, setSelectedOption] = useState<string>(
    options?.[0].label
  )

  const handleOpenDropdown = () => setIsVisible((current) => !current)

  const handleOptionClick = (optionValue: string): void => {
    setSelectedOption(optionValue)
    setIsVisible(false)
  }

  return (
    <DropDownContainer>
      <DefaultOption onClick={handleOpenDropdown}>
        {selectedOption}
        <Arrow src={ArrowIcon} />
      </DefaultOption>
      {isVisible && (
        <DropDownOptions>
          {options.map((option) => (
            <Options
              key={option.value}
              onClick={() => handleOptionClick(option.label)}
              style={{
                fontWeight: option.value === selectedOption ? 'bold' : 'normal',
              }}
            >
              {option.label}
            </Options>
          ))}
        </DropDownOptions>
      )}
    </DropDownContainer>
  )
}
