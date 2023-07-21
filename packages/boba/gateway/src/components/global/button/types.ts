export type ButtonsType = {
  disable?: boolean
  loading?: boolean
  small?: boolean
  outline?: boolean
  tiny?: boolean
  transparent?: boolean
}
export interface ButtonTypes extends ButtonsType {
  label: string
  className?: string
  onClick?: () => void
}
