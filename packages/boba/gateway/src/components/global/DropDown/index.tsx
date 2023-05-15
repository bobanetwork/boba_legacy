import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import ArrowIcon from 'images/arrow-down.svg'
interface Option {
  label: string
  value: string
}

interface DropdownProps {
  options: Option[]
  onOptionSelect: (optionValue: string) => void
}

const DropDownContainer = styled.div`
  display: flex;
  margin-left: auto;
  margin-top: -20px;
  z-index: 2;
  position: relative;
`
const DefaultOption = styled.div`
  position: relative;
  cursor: pointer;
  z-index: 2;
  background: #1a1c1e;
  padding: 5px 10px;
  border-radius: 10px;
`
const DropDownOptions = styled.div`
  position: absolute;
  padding: 45px 20px 15px 25px;
  top: -10px;
  right: -10px;
  z-index: 1;
  line-height: 1;
  background: #111315;
  border-radius: 10px;
  max-height: 200px;
  overflow: auto;

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #9eff00;
    border-radius: 2px;
    border-radius: 10px;
  }

  &::-webkit-scrollbar {
    width: 2px;
    background-color: transparent;
  }
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
  &:hover {
    opacity: 0.9;
  }
`

export const DropDown = ({
  options,
  onOptionSelect,
}: DropdownProps): JSX.Element => {
  const [isVisible, setIsVisible] = useState<boolean>(false)
  const [selectedOption, setSelectedOption] = useState<string>(
    options?.[0]?.label
  )

  const handleOpenDropdown = () => setIsVisible((current) => !current)

  const handleOptionClick = (optionValue: string): void => {
    setSelectedOption(optionValue)
    setIsVisible(false)
    onOptionSelect(optionValue)
  }

  useEffect(() => {
    setSelectedOption(options?.[0]?.label)
  }, [options])

  return (
    <DropDownContainer>
      <DefaultOption onClick={handleOpenDropdown}>
        {selectedOption}
        <Arrow src={ArrowIcon} />
      </DefaultOption>
      {isVisible && (
        <DropDownOptions>
          {options.map((option, index) => (
            <Options
              key={index}
              onClick={() => handleOptionClick(option?.label)}
              style={{
                fontWeight:
                  option?.value === selectedOption ? 'bold' : 'normal',
              }}
            >
              {option?.label}
            </Options>
          ))}
        </DropDownOptions>
      )}
    </DropDownContainer>
  )
}
