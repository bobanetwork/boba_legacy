import { ReactNode } from 'react'

export interface ButtonTypes {
  disable?: boolean
  loading?: boolean
  small?: boolean
  style?: Record<string, string>
  label: ReactNode | string
  onClick?: () => void
}
