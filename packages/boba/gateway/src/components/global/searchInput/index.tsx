import React, { ChangeEventHandler } from 'react'
import { SearchInputContainer, Input } from './styles'
import MagnifyingGlass from 'assets/images/icons/magnifyingGlass.svg'
import { Svg } from 'components/global/svg'

export interface SearchInputProps {
  placeholder: string
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
}

export const SearchInput = (props: SearchInputProps) => {
  return (
    <SearchInputContainer>
      <Svg src={MagnifyingGlass} />
      <Input // search bar styles
        placeholder="Search Here"
        value={props.value}
        onChange={props.onChange}
      />
    </SearchInputContainer>
  )
}
