import { ReactNode } from 'react'

export interface InputProps {
  placeholder: string
  type: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  value: any
  label?: ReactNode
}
