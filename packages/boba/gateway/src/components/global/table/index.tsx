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
  justifyContent: 'flex-end',
  // @ts-ignore
  background: theme.palette.background.secondary,
  [theme.breakpoints.down('md')]: {
    marginBottom: '5px',
  },
}))

const TableRow = styled(Row)`
  &:not(:first-of-type) {
    justify-content: flex-end;
  }
`
type TableHeaderOptionType = {
  name: string
  tooltip: string
}

type TableHeaderType = {
  options: TableHeaderOptionType[]
}

export const TableHeader = ({ options }: TableHeaderType) => {
  return (
    <TableHeaderContainer>
      {options?.map((option) => {
        return (
          <TableRow key={option.name}>
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
    <Row>
      {currentOptions?.map((option, index) => {
        return <TableRow key={index}>{option.content}</TableRow>
      })}
    </Row>
  )
}
