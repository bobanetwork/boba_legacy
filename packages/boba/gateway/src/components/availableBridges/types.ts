export interface IBridges {
  name: string
  type: string
  link: string
  tokens: string[]
}

export interface AvailableBridgesProps {
  token?: any | null // FIXME: fix the type of token
  walletAddress: string
}
