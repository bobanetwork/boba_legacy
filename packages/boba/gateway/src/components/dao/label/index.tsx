import React from 'react'
import { LabelContainer } from './styles'

export const Label = (props: { status: string }) => {
  return <LabelContainer state={props.status}>{props.status}</LabelContainer>
}
