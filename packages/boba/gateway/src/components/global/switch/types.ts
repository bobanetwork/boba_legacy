export interface SwitchButtonTypes {
  isDisable?: boolean
  isActive?: boolean
  onStateChange?: (isChecked: boolean) => void
  title?: string
}
