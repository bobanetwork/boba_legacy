import React, { useState, useCallback } from 'react'
import ArrowDown from '../../../images/icons/arrowdown.svg'
import {
  DropdownContainer,
  Header,
  IconContainer,
  Option,
  DefaultIcon,
  DropdownBody,
  Icon,
  DropdownContent,
  Arrow,
} from './styles'
interface IDropdownItem {
  value: string
  label: string
  imgSrc?: string
}

export interface IDropdownProps {
  error: boolean
  items: IDropdownItem[]
  defaultItem: IDropdownItem
  onItemSelected?: (item: IDropdownItem) => void
}

export const Dropdown: React.FC<IDropdownProps> = ({
  items,
  defaultItem,
  error = false,
  onItemSelected,
}) => {
  const [selectedItem, setSelectedItem] = useState<IDropdownItem>(defaultItem)
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const handleDropdown = useCallback(() => {
    setIsOpen(!isOpen)
  }, [isOpen])

  const selectItem = useCallback((item: IDropdownItem) => {
    onItemSelected && onItemSelected(item)
    setSelectedItem(item)
    setIsOpen(false)
  }, [])

  return (
    <DropdownContainer className="dropdown">
      <Header onClick={handleDropdown} error={error}>
        <Option>
          {selectedItem.imgSrc && (
            <IconContainer>
              {selectedItem.imgSrc !== 'default' && (
                <Icon src={selectedItem.imgSrc} alt={selectedItem.label} />
              )}
              {selectedItem.imgSrc === 'default' && <DefaultIcon />}
            </IconContainer>
          )}
          {selectedItem.label}

          <Arrow src={ArrowDown} />
        </Option>
      </Header>
      {isOpen && (
        <DropdownBody>
          <DropdownContent>
            {items.map((item, index) => (
              <Option key={index} onClick={() => selectItem(item)}>
                {item.imgSrc && (
                  <IconContainer>
                    <img src={item.imgSrc} alt={item.label} />
                  </IconContainer>
                )}
                {item.label}
              </Option>
            ))}
          </DropdownContent>
        </DropdownBody>
      )}
    </DropdownContainer>
  )
}
