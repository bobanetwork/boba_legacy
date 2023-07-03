import TESTLogo from 'images/test.svg'
import mttLogo from 'images/mtt.png'

export const getCoinImage = (symbol: string): string => {
  const logoURIbase =
    'https://raw.githubusercontent.com/bobanetwork/token-list/main/assets'
  let url = `${logoURIbase}/${symbol?.toLowerCase()}.svg`
  if (symbol === 'test') {
    url = TESTLogo
  }
  if (symbol === 'mtt') {
    url = mttLogo
  }

  return url
}
