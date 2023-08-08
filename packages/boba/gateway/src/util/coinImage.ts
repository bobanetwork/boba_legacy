import TESTLogo from 'assets/images/test.svg'
import mttLogo from 'assets/images/mtt.png'
import bobaLogo from 'assets/images/boba-logo.png'

export const getCoinImage = (symbol: string): string => {
  const logoURIbase =
    'https://raw.githubusercontent.com/bobanetwork/token-list/main/assets'
  let url = `${logoURIbase}/${symbol?.toLowerCase()}.svg`

  if (symbol === 'BOBA') {
    console.log([`getCoinImage('BOBA')`, bobaLogo])
    url = bobaLogo
  }

  if (symbol === 'test') {
    url = TESTLogo
  }
  if (symbol === 'mtt') {
    url = mttLogo
  }
  console.log(['url', url])
  return url
}
