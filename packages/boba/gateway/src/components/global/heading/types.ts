import { ReactNode } from 'react'

export type VariantType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

export interface HeadingProps {
  variant: VariantType
  color: string
  children: ReactNode
  className?: string
}

export interface HeadingStyleProps {
  size: string
  lineHeight: string
  fontWeight: number
}
