import React from 'react'
import styled from 'styled-components'
import { ComponentType } from '../model'

const P = styled.p`
  padding: 0px;
  margin: 0px;
  font-weight: 400;
  font-size: 0.9rem;
  text-transform: uppercase;
  line-height: 1.25;
`
const Small = styled.p`
  text-transform: uppercase;
  padding: 0px;
  margin: 0px;
  font-weight: 400;
  font-size: 0.75rem;
  opacity: 0.5;
`
export const TEXT = ({ children }: ComponentType) => {
  return <P>{children}</P>
}

export const SMALL = ({ children }: ComponentType) => {
  return <Small>{children}</Small>
}
