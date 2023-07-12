type itemType = {
  value: string
  label: string
}

export interface TabHeaderType {
  options: itemType[]
  callback: (e: string) => void
}
