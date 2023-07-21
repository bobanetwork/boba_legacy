import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react'
import {
  DropdownContainer,
  Header,
  IconContainer,
  Option,
  DefaultIcon,
  DropdownBody,
  Icon,
  DropdownContent,
} from './styles'
export interface IFilterDropdownItem {
  value?: string
  label: string | ReactNode
}

export interface IFilterDropdownProps {
  error: boolean
  imgSrc: string
  items: IFilterDropdownItem[]
  defaultItem: IFilterDropdownItem
  onItemSelected?: (item: IFilterDropdownItem) => void
  className?: string
}

export const FilterDropDown: React.FC<IFilterDropdownProps> = ({
  items,
  defaultItem,
  error = false,
  imgSrc,
  onItemSelected,
  className,
}) => {
  const [selectedItem, setSelectedItem] =
    useState<IFilterDropdownItem>(defaultItem)
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const handleDropdown = useCallback(() => {
    setIsOpen(!isOpen)
  }, [isOpen])

  const selectItem = useCallback((item: IFilterDropdownItem) => {
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

  return (
    <DropdownContainer className={`dropdown ${className}`} ref={dropdownRef}>
      <Header
        onClick={handleDropdown}
        error={error}
        className={
          isOpen ? `dropdown ${className} active` : `dropdown ${className}`
        }
      >
        {imgSrc && (
          <IconContainer>
            {imgSrc !== 'default' && <Icon src={imgSrc} />}
            {imgSrc === 'default' && <DefaultIcon />}
          </IconContainer>
        )}
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
                onClick={() => {
                  selectItem(item)
                }}
              >
                {item.label}
              </Option>
            ))}
          </DropdownContent>
        </DropdownBody>
      )}
    </DropdownContainer>
  )
}
