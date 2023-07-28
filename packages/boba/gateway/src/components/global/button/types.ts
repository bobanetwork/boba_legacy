import { ReactNode } from 'react'

type ButtonType = {
  disable?: boolean
  loading?: boolean
  small?: boolean
  style?: Record<string, string>
  label: ReactNode | string
  outline?: boolean
  tiny?: boolean
  transparent?: boolean
}
export interface ButtonTypes extends ButtonType {
  label: string
  className?: string
  onClick?: () => void
}
