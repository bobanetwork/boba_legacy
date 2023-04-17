import React from 'react'
import styled from 'styled-components'

const RowStyle = styled.div<{ gap?: string }>`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  gap: ${(props) => props.gap};
`

const ColumStyle = styled.div<{ gap?: string }>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: ${(props) => props.gap};
`

interface RowOrColumnType {
  children: React.ReactNode
  gap?: string
  style?: React.CSSProperties
  className?: string
}

export const Row = ({
  children,
  style,
  gap,
  className,
}: RowOrColumnType): JSX.Element => {
  return (
    <RowStyle className={className} style={style} gap={gap || '0px'}>
      {children}
    </RowStyle>
  )
}

export const Column = ({
  children,
  style,
  gap,
  className,
}: RowOrColumnType): JSX.Element => {
  return (
    <ColumStyle className={className} style={style} gap={gap || '0px'}>
      {children}
    </ColumStyle>
  )
}
