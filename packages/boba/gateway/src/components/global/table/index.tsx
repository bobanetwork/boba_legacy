import React from 'react'

import { Row } from 'components/global/containers'
import { Text } from 'components/global/text'
import Tooltip from 'components/tooltip/Tooltip'
import { HelpOutline } from '@mui/icons-material'
import styled from 'styled-components'

const TableRow = styled(Row)`
  &:not(:first-of-type) {
    margin-left: auto;
  }
  &:last-of-type {
    margin-right: 0px;
  }
`

const TableHeaderContainer = styled(Row)`
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 6px 6px 0 0;
  background: ${(props) => props.theme.colors.gray[800]};
  @media (max-width: 960px) {
    margin-bottom: 5px;
  }
`

const TableContentContainer = styled(Row)`
  justify-content: space-between;
`

type TableHeaderOptionType = {
  name: string
  tooltip: string
  width: number
}

type TableHeaderType = {
  options: TableHeaderOptionType[]
}

export const TableHeader = ({ options }: TableHeaderType) => {
  return (
    <TableHeaderContainer>
      {options?.map((option) => {
        return (
          <TableRow
            key={option.name}
            style={{ maxWidth: option?.width + 'px' }}
          >
            <Text>{option.name}</Text>
            {option.tooltip && (
              <Tooltip title={option.tooltip}>
                <HelpOutline fontSize="small" sx={{ opacity: 0.65 }} />
              </Tooltip>
            )}
          </TableRow>
        )
      })}
    </TableHeaderContainer>
  )
}

type TableContentOptionType = {
  content: any
  width: number
}

type TableContentType = {
  options: TableContentOptionType[]
  mobileOptions?: number[]
}

export const TableContent = ({ options, mobileOptions }: TableContentType) => {
  const isMobile = false
  const currentOptions =
    isMobile && mobileOptions ? mobileOptions.map((i) => options[i]) : options
  return (
    <TableContentContainer>
      {currentOptions?.map((option, index) => {
        return (
          <TableRow key={index} style={{ maxWidth: option?.width + 'px' }}>
            {option.content}
          </TableRow>
        )
      })}
    </TableContentContainer>
  )
}
