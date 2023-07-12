import { ReactNode } from 'react'

type tabs = {
  label: string
  content: ReactNode
}

export interface TabData {
  tabs: tabs[]
}
