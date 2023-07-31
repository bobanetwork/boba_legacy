import { ComponentType, ReactElement, ReactNode } from 'react'

export interface OptionProps {
  label?: string
  component?: ReactElement<any>
  onClick?: (d: any) => void
}

export interface MenuProps {
  name?: string
  label?: ReactNode | string
  children?: ReactNode
  options: Array<OptionProps>
}
