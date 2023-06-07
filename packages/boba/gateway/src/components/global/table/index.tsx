import React from 'react'

import { Row } from 'components/global/containers'
import { Text } from 'components/global/text'
import Tooltip from 'components/tooltip/Tooltip'
import { HelpOutline } from '@mui/icons-material'
import { useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import styled from 'styled-components'

const TableHeaderContainer = styled(Row)`
  display: flex;
  padding: 20px;
  border-radius: 6px 6px 0px 0px;
  align-items: center;
  justify-content: space-between;
  background: ${(props) => props.theme.colors.gray[50]};
`

const TableContentContainer = styled(Row)`
  justify-content: space-between;
`

const TableRow = styled(Row)`
  &:not(:first-of-type) {
    margin-left: auto;
  }
  &:last-of-type {
    margin-right: 0px;
  }
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
  const theme = useTheme() as any
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
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
