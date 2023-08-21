export interface ChainLabelInterface {
  direction: string
}

export type IconType = {
  ethereum: ({ selected }: { selected?: boolean | undefined }) => Element
  bnb: ({ selected }: { selected?: boolean | undefined }) => Element
  avax: ({ selected }: { selected?: boolean | undefined }) => Element
}

export type DirectionType = {
  from: JSX.Element
  to: JSX.Element
}
