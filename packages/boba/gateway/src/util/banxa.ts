import { BANXA_URL } from './constant'

interface Props {
  symbol: string
  address: string
}

const FIAT_TYPE: string = 'USD'
const BLOCK_CHAIN: string = 'Boba Network'

export const prepareBanxaUrl = ({ symbol, address }: Props) => {
  const endpoint = BANXA_URL

  return `${endpoint}coinType=${symbol}&fiatType=${FIAT_TYPE}&blockchain=${BLOCK_CHAIN}&walletAddress=${address}`
}
