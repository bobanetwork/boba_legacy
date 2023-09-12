import React, {
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useRef,
  CSSProperties,
} from 'react'
import ArrowDown from 'assets/images/icons/arrowdown.svg'
import {
  DropdownContainer,
  Header,
  IconContainer,
  Option,
  DefaultIcon,
  DropdownBody,
  Icon,
  DropdownContent,
  OptionsHeader,
  Arrow,
  NoOptions,
} from './styles'

import { ModalTypography } from 'components/global/modalTypography'
import { Typography } from '../typography'
export interface IDropdownItem {
  value?: string
  label: string | ReactNode
  imgSrc?: string
  header?: boolean
  headerName?: string
}

export interface IDropdownProps {
  error: boolean
  items: IDropdownItem[]
  defaultItem: IDropdownItem
  onItemSelected?: (item: IDropdownItem) => void
  className?: string
  headers?: string[]
  style?: CSSProperties
}

export const Dropdown: React.FC<IDropdownProps> = ({
  items,
  defaultItem,
  error = false,
  onItemSelected,
  className,
  headers = [],
  style,
}) => {
  if (headers) {
    let allItems: IDropdownItem[] = []
    const noHeaders = items.filter((item) => {
      if (!item.header && !item.headerName) {
        return true
      } else {
        return false
      }
    })
    allItems = [...noHeaders]
    for (const header of headers) {
      const headerItem: IDropdownItem = {
        label: header,
        header: true,
      }
      allItems = [
        ...allItems,
        headerItem,
        ...items.filter((item) => {
          return item?.headerName === header
        }),
      ]
    }
    items = allItems
  }

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
    <DropdownContainer
      className={`dropdown ${className}`}
      ref={dropdownRef}
      style={style}
    >
      <Header
        onClick={handleDropdown}
        error={error}
        isOpen={isOpen}
        className={`dropdown ${className}`}
      >
        <Option isSelected={false}>
          {selectedItem.imgSrc && (
            <IconContainer>
              {selectedItem.imgSrc !== 'default' &&
                selectedItem.imgSrc.includes('png') && (
                  <img src={selectedItem.imgSrc} alt="token" width="20px" />
                )}
              {selectedItem.imgSrc !== 'default' &&
                selectedItem.imgSrc.includes('svg') && (
                  <Icon src={selectedItem.imgSrc} />
                )}
              {selectedItem.imgSrc === 'default' && <DefaultIcon />}
            </IconContainer>
          )}
          <Typography variant="body2">{selectedItem.label}</Typography>

          <Arrow src={ArrowDown} className={`dropdown ${className}`} />
        </Option>
      </Header>
      {isOpen && (
        <DropdownBody>
          {items.length ? (
            <DropdownContent>
              {items.map((item, index) => {
                if (item.header) {
                  return (
                    <OptionsHeader
                      key={index}
                      className={`dropdown ${className}`}
                    >
                      {item.imgSrc && (
                        <IconContainer>
                          {item.imgSrc !== 'default' && (
                            <Icon src={item.imgSrc} />
                          )}
                        </IconContainer>
                      )}
                      {item.label}
                    </OptionsHeader>
                  )
                } else {
                  return (
                    <Option
                      key={index}
                      className={`dropdown ${className}`}
                      isSelected={item.value === selectedItem.value}
                      onClick={() => {
                        if (!item.header) {
                          selectItem(item)
                        }
                      }}
                    >
                      {item.imgSrc && (
                        <IconContainer>
                          {item.imgSrc !== 'default' &&
                            item.imgSrc.includes('png') && (
                              <img src={item.imgSrc} alt="token" width="20px" />
                            )}
                          {item.imgSrc !== 'default' &&
                            item.imgSrc.includes('svg') && (
                              <Icon src={item.imgSrc} />
                            )}
                        </IconContainer>
                      )}
                      {item.label}
                    </Option>
                  )
                }
              })}
            </DropdownContent>
          ) : (
            <NoOptions>
              <ModalTypography variant="body3">
                No available options
              </ModalTypography>
            </NoOptions>
          )}
        </DropdownBody>
      )}
    </DropdownContainer>
  )
}
