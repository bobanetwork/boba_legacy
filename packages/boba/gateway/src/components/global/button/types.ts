import { ReactNode } from 'react'

type ButtonType = {
  disable?: boolean
  loading?: boolean
  small?: boolean
  outline?: boolean
  tiny?: boolean
  transparent?: boolean
}

export interface ButtonTypes extends ButtonType {
  label: ReactNode | string
  style?: Record<string, string>
  className?: string
  onClick?: () => void
}
