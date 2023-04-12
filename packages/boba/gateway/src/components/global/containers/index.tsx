import React, { ReactNode } from 'react'
import styled from 'styled-components'
import { ComponentType } from '../model'

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
`

export const ROW = ({ children, style, className }: ComponentType) => {
  return (
    <Row className={className} style={style}>
      {children}
    </Row>
  )
}

export const COLUMN = ({ children, style, className }: ComponentType) => {
  return (
    <Column className={className} style={style}>
      {children}
    </Column>
  )
}
