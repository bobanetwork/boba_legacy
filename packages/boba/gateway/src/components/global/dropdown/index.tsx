import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react'
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
export interface IDropdownItem {
  value?: string
  label: string | ReactNode
  imgSrc?: string
}

export interface IDropdownProps {
  error: boolean
  items: IDropdownItem[]
  defaultItem: IDropdownItem
  onItemSelected?: (item: IDropdownItem) => void
  className?: string
}

export const Dropdown: React.FC<IDropdownProps> = ({
  items,
  defaultItem,
  error = false,
  onItemSelected,
  className,
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

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownRef])

  useEffect(() => {
    setSelectedItem(defaultItem)
  }, [defaultItem])

  return (
    <DropdownContainer className={`dropdown ${className}`} ref={dropdownRef}>
      <Header
        onClick={handleDropdown}
        error={error}
        className={
          isOpen ? `dropdown ${className} active` : `dropdown ${className}`
        }
      >
        <Option isSelected={false}>
          {selectedItem.imgSrc && (
            <IconContainer>
              {selectedItem.imgSrc !== 'default' && (
                <Icon src={selectedItem.imgSrc} />
              )}
              {selectedItem.imgSrc === 'default' && <DefaultIcon />}
            </IconContainer>
          )}
          <div>{selectedItem.label}</div>

          <Arrow src={ArrowDown} className={`dropdown ${className}`} />
        </Option>
      </Header>
      {isOpen && (
        <DropdownBody>
          <DropdownContent>
            {items.map((item, index) => (
              <Option
                key={index}
                className={
                  item.value &&
                  (item.value === selectedItem.value
                    ? `dropdown ${className} active`
                    : `dropdown ${className}`)
                }
                isSelected={true}
                onClick={() => selectItem(item)}
              >
                {item.imgSrc && (
                  <IconContainer>
                    {item.imgSrc !== 'default' && <Icon src={item.imgSrc} />}
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
