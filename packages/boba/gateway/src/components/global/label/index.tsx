import React from 'react'
import styled from 'styled-components'

const Label = styled.p`
  padding: 5px 10px;
  margin: 0px;
  background: #bae21a26;
  border-radius: 6px;
  min-width: 65px;
  text-align: center;
  color: #bae21a;
  font-weight: 500;
  font-size: 0.9rem;
  line-height: 1.15;
`
type AprLabelType = {
  children: string
}

export const AprLabel = ({ children }: AprLabelType): JSX.Element => {
  const label = children.toLowerCase() === 'infinity' ? '~' : children + '%'
  return <Label>{label}</Label>
}
