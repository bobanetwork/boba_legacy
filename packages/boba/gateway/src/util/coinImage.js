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
import wagmiv3Logo from 'images/wagmiv3.png'
import wagmiv2OLOLogo from 'images/wagmiv2olo.png'
import oloLogo from 'images/olo.svg'
import CGTLogo from 'images/CGT.svg'
import avaxLogo from 'images/avax.svg'
import moonbase from 'images/moonbase.png'
import glmrLogo from 'images/glmr.svg'
import mttLogo from 'images/mtt.png'

const logoMapping = {
  "TEST": TESTLogo,
  "USDT": usdtLogo,
  "DAI": daiLogo,
  "USDC": usdcLogo,
  "WBTC": wbtcLogo,
  "REP": repLogo,
  "BAT": batLogo,
  "ZRX": zrxLogo,
  "SUSHI": sushiLogo,
  "LINK": linkLogo,
  "UNI": uniLogo,
  "DODO": dodoLogo,
  "ETH": ethLogo,
  "JLKN": TESTLogo,
  "OMG": omgLogo,
  "FRAX": fraxLogo,
  "FXS": fxsLogo,
  "BOBA": bobaLogo,
  "xBOBA": xBobaLogo,
  "UST": terraLogo,
  "BUSD": busdLogo,
  "BNB": bnbLogo,
  "tBNB": bnbLogo,
  "FTM": ftmLogo,
  "MATIC": maticLogo,
  "UMA": umaLogo,
  "WAGMIv0": wagmiv0Logo,
  "WAGMIv1": wagmiv1Logo,
  "WAGMIv2": wagmiv2Logo,
  "WAGMIv2-Oolong": wagmiv2OLOLogo,
  "WAGMIv3": wagmiv3Logo,
  "WAGMIv3-Oolong": wagmiv3Logo,
  "DOM": domLogo,
  "OLO": oloLogo,
  "CGT": CGTLogo,
  "AVAX": avaxLogo,
  "GLMR": glmrLogo,
  "DEV": moonbase,
  "MTT": mttLogo
};

export const getCoinImage = (symbol) => {
  const logo = logoMapping[symbol] || ethLogo;
  return logo;
}
