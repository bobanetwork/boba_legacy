import React from 'react'

import { Row } from 'components/global/containers'
import Tooltip from 'components/tooltip/Tooltip'
import { HelpOutline } from '@mui/icons-material'
import styled from 'styled-components'
import { ModalTypography } from 'components/global/modalTypography'

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
  background: ${(props) => props.theme.colors.popup};
  border-radius: 12px;
  padding: 15px 25px;
  box-shadow: 0px 2px 17px 0px rgba(0, 0, 0, 0.15);
  border: 1px solid ${(props) => props.theme.colors.gray[300]};
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
