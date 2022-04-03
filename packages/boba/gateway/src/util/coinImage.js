import ethLogo from 'images/ethereum.svg'
import TESTLogo from 'images/test.svg'
import sushiLogo from 'images/sushi-icon.png'
import usdtLogo from 'images/usdt-icon.svg'
import daiLogo from 'images/dai.png'
import usdcLogo from 'images/usdc.png'
import wbtcLogo from 'images/wbtc.svg'
import repLogo from 'images/rep.svg'
import batLogo from 'images/bat.svg'
import zrxLogo from 'images/zrx.svg'
import linkLogo from 'images/link.svg'
import dodoLogo from 'images/dodo.svg'
import uniLogo from 'images/uni.png'
import omgLogo from 'images/omg.png'
import fraxLogo from 'images/frax.png'
import fxsLogo from 'images/fxs.svg'
import bobaLogo from 'images/boba-token.svg'
import xBobaLogo from 'images/xboba-token.svg'
import terraLogo from 'images/terra.png'
import busdLogo from 'images/busd.svg'
import bnbLogo from 'images/bnb.svg'
import ftmLogo from 'images/ftm.svg'
import maticLogo from 'images/matic.svg'
import umaLogo from 'images/uma.svg'
import domLogo from 'images/domLogo.png'
import wagmiv0Logo from 'images/wagmiv0.png'
import wagmiv1Logo from 'images/wagmiv1.png'
import wagmiv2Logo from 'images/wagmiv2.png'
import wagmiv2OLOLogo from 'images/wagmiv2olo.png'
import oloLogo from 'images/olo.svg'

export const getCoinImage = (symbol) => {

  let logo = null

  switch (symbol) {
    case "TEST":
      logo = TESTLogo;
      break;
    case "USDT":
      logo = usdtLogo;
      break;
    case "DAI":
      logo = daiLogo;
      break;
    case "USDC":
      logo = usdcLogo;
      break;
    case "WBTC":
      logo = wbtcLogo;
      break;
    case "REP":
      logo = repLogo;
      break;
    case "BAT":
      logo = batLogo;
      break;
    case "ZRX":
      logo = zrxLogo;
      break;
    case "SUSHI":
      logo = sushiLogo;
      break;
    case "LINK":
      logo = linkLogo;
      break;
    case "UNI":
      logo = uniLogo;
      break;
    case "DODO":
      logo = dodoLogo;
      break;
    case "ETH":
      logo = ethLogo;
      break;
    case "JLKN":
      logo = TESTLogo;
      break;
    case "OMG":
      logo = omgLogo;
      break;
    case "FRAX":
      logo = fraxLogo;
      break;
    case "FXS":
      logo = fxsLogo;
      break;
    case "BOBA":
      logo = bobaLogo;
      break;
    case "xBOBA":
      logo = xBobaLogo;
      break;
    case "UST":
      logo = terraLogo;
      break;
    case "BUSD":
      logo = busdLogo;
      break;
    case "BNB":
      logo = bnbLogo;
      break;
    case "FTM":
      logo = ftmLogo;
      break;
    case "MATIC":
      logo = maticLogo;
      break;
    case "UMA":
      logo = umaLogo;
      break;
    case "WAGMIv0":
      logo = wagmiv0Logo;
      break;
    case "WAGMIv1":
      logo = wagmiv1Logo;
      break;
    case "WAGMIv2":
      logo = wagmiv2Logo;
      break;
    case "WAGMIv2-Oolong":
      logo = wagmiv2OLOLogo;
      break;
    case "DOM":
      logo = domLogo;
      break;
    case "OLO":
      logo = oloLogo;
      break;
    default:
      logo = ethLogo;
      break;
  }

  return logo;
}
