import React from 'react'
import { styled } from '@mui/material/styles'
import { useTheme } from '@emotion/react'

import { Row } from 'components/global/containers'
import { Text } from 'components/global/text'
import Tooltip from 'components/tooltip/Tooltip'
import { HelpOutline } from '@mui/icons-material'
import { useMediaQuery } from '@mui/material'

export const TableHeaderContainer = styled(Row)(({ theme }) => ({
  padding: '20px',
  borderTopLeftRadius: '6px',
  borderTopRightRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  // @ts-ignore
  background: theme.palette.background.secondary,
  [theme.breakpoints.down('md')]: {
    marginBottom: '5px',
  },
}))

const TableContentContainer = styled(Row)(({ theme }) => ({
  padding: '10px 15px',
  gap: '10px 0px',
  borderBottom:
    theme.palette.mode === 'light' ? '1px solid #c3c5c7' : '1px solid #1f2123',
  background: theme.palette.background.glassy,
  justifyContent: 'space-between',
  [theme.breakpoints.down('md')]: {
    marginBottom: '5px',
  },
}))

const TableRow = styled(Row)`
  &:not(:first-of-type) {
    margin-left: auto;
  }
  &:last-of-type {
    margin-right: 0px;
  }
`

const TableContentRow = styled(Row)`
  padding: '10px';
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
          <TableContentRow
            key={index}
            style={{ maxWidth: option?.width + 'px' }}
          >
            {option.content}
          </TableContentRow>
        )
      })}
    </TableContentContainer>
  )
}
