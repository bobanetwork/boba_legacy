type TabDetail = {
  name: string
  tab: string
}
export type tabSwitcherTypes = {
  L1LP: TabDetail
  L2LP: TabDetail
}

export interface TabSwitcherInterface {
  tabs: tabSwitcherTypes
  onSelect: (value: string) => void
}
