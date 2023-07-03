import React, { useState, useCallback } from 'react'
import ArrowDown from '../../../../images/icons/arrowdown.svg'
import {
  DropdownContainer,
  Header,
  IconContainer,
  Option,
  DefaultIcon,
  DropdownBody,
  Icon,
  DropdownContent,
} from '../themes/networkStyles'
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

          {isOpen ? <img src={ArrowDown} /> : <img src={ArrowDown} />}
        </Option>
      </Header>
      {isOpen && (
        <DropdownBody>
          <DropdownContent>
            {items.map((item, index) => (
              <Option
                key={index}
                onClick={() => selectItem(item)}
                style={{
                  flexDirection: 'row',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}
              >
                {item.imgSrc && (
                  <IconContainer style={{ alignContent: 'center' }}>
                    {item.imgSrc !== 'default' && (
                      <Icon
                        style={{ alignContent: 'center' }}
                        src={item.imgSrc}
                        alt={item.label}
                      />
                    )}
                    {item.imgSrc === 'default' && <DefaultIcon />}
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
