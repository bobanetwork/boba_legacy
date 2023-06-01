import React, { useState, useCallback } from 'react'
import {
  DropdownContainer,
  Header,
  IconContainer,
  Option,
  DefaultIcon,
  DropdownBody,
  Icon,
} from './styles'
interface IDropdownItem {
  value: string
  label: string
  imgSrc?: string
}

export interface IDropdownProps {
  items: IDropdownItem[]
  defaultItem: IDropdownItem
  onItemSelected?: (item: IDropdownItem) => void
}

export const Dropdown: React.FC<IDropdownProps> = ({
  items,
  defaultItem,
  onItemSelected,
}) => {
  const [selectedItem, setSelectedItem] = useState<IDropdownItem>(defaultItem)
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const handleDropdown = useCallback(() => {
    setIsOpen(!isOpen)
  }, [isOpen])

  const selectItem = useCallback(
    (item: IDropdownItem) => {
      setSelectedItem(item)
      setIsOpen(false)
      onItemSelected && onItemSelected(item)
    },
    [onItemSelected]
  )

  return (
    <DropdownContainer className="dropdown">
      <Header onClick={handleDropdown}>
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

          {isOpen ? ' ▲' : ' ▼'}
        </Option>
      </Header>
      {isOpen && (
        <DropdownBody>
          {items.map((item, index) => (
            <Option key={index} onClick={() => selectItem(item)}>
              {item.imgSrc && <img src={item.imgSrc} alt={item.label} />}
              {item.label}
            </Option>
          ))}
        </DropdownBody>
      )}
    </DropdownContainer>
  )
}
