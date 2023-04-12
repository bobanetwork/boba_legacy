import { ReactNode } from 'react'

export type ComponentType = {
    children: ReactNode
    style?: React.CSSProperties
    className?: string
  }