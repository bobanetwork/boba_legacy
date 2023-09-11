import TESTLogo from 'assets/images/test.svg'
import mttLogo from 'assets/images/mtt.png'

export const getCoinImage = (symbol: string): string => {
  const logoURIbase =
    'https://raw.githubusercontent.com/bobanetwork/token-list/main/assets'

  // hard fox for avax
  if (symbol.includes('.')) {
    symbol = symbol.split('.')[0]
  }

  let url = `${logoURIbase}/${symbol?.toLowerCase()}.svg`

  if (symbol === 'test') {
    url = TESTLogo
  }
  if (symbol === 'mtt') {
    url = mttLogo
  }

  return url
}
