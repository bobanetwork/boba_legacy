type poolDetail = {
  name: string
  tab: string
}

export type tabSwitcherTypes = {
  L1LP: poolDetail
  L2LP: poolDetail
}

export enum toLayer {
  L1 = 'L2',
  L2 = 'L1',
}
