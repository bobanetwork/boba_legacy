import React from 'react'
import styled from 'styled-components'

const ROW = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
`

const COLUMN = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
`

interface RowOrColumnType {
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

export const Row = ({
  children,
  style,
  className,
}: RowOrColumnType): JSX.Element => {
  return (
    <ROW className={className} style={style}>
      {children}
    </ROW>
  )
}

export const Column = ({
  children,
  style,
  className,
}: RowOrColumnType): JSX.Element => {
  return (
    <COLUMN className={className} style={style}>
      {children}
    </COLUMN>
  )
}
