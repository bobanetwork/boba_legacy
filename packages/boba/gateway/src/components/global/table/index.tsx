import React from 'react'

import { Text } from 'components/global/text'
import Tooltip from 'components/tooltip/Tooltip'
import { HelpOutline } from '@mui/icons-material'
import { TableHeaderContainer, TableRow, TableContentContainer } from './styles'
import { ModalTypography } from '../modalTypography'

export type TableHeaderOptionType = {
  name: string
  tooltip?: string
  width: number
}

type TableHeaderType = {
  options: TableHeaderOptionType[]
  className?: string
}

export const TableHeader = ({ options, className }: TableHeaderType) => {
  return (
    <TableHeaderContainer className={className}>
      {options?.map((option) => {
        return (
          <TableRow
            className={className}
            key={option.name}
            style={{ maxWidth: option?.width + 'px' }}
          >
            <ModalTypography variant="body2">{option.name}</ModalTypography>
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
  className?: string
}

export const TableContent = ({
  options,
  mobileOptions,
  className,
}: TableContentType) => {
  const isMobile = false
  const currentOptions =
    isMobile && mobileOptions ? mobileOptions.map((i) => options[i]) : options
  return (
    <TableContentContainer className={className}>
      {currentOptions?.map((option, index) => {
        return (
          <TableRow
            className={className}
            key={index}
            style={{ maxWidth: option?.width + 'px' }}
          >
            {option.content}
          </TableRow>
        )
      })}
    </TableContentContainer>
  )
}
