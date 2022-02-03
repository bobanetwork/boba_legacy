import { groupBy } from 'lodash'
import acrossLogo from '../../images/ecosystem/across.webp'
import apeBoardLogo from '../../images/ecosystem/apeBoard.webp'
import bandProtocolLogo from '../../images/ecosystem/bandProtocol.webp'
import bobaApesLogo from '../../images/ecosystem/bobaapes.webp'
import bobaDogeLogo from '../../images/ecosystem/bobaDoge.webp'
import bobaPunksLogo from '../../images/ecosystem/bobaPunks.webp'
import boaringDaoLogo from '../../images/ecosystem/BoringDAO.webp'
import coing98Logo from '../../images/ecosystem/coin98.webp'
import deBankLogo from '../../images/ecosystem/deBank.webp'
import decentWalletLogo from '../../images/ecosystem/decentWallet.webp'
import defiyieldLogo from '../../images/ecosystem/defiyield.webp'
import dodoLogo from '../../images/ecosystem/dodo.webp'
import fraxLogo from '../../images/ecosystem/frax.webp'
import l2ChartsLogo from '../../images/ecosystem/l2Charts.webp'
import layerSwapLogo from '../../images/ecosystem/layerswap.webp'
import mewLogo from '../../images/ecosystem/mew.webp'
import multiChainLogo from '../../images/ecosystem/Multichain.webp'
import OolongswapLogo from '../../images/ecosystem/Oolongswap.webp'
import safepalLogo from '../../images/ecosystem/safepal.webp'
import satisLogo from '../../images/ecosystem/satis.webp'
import shibuiDAOLogo from '../../images/ecosystem/shibuidao.svg'
import swapperChanLogo from '../../images/ecosystem/swapperChan.webp'
import synLogo from '../../images/ecosystem/syn.webp'
import thetanutsLogo from '../../images/ecosystem/thetanuts.webp'
import tofuNftLogo from '../../images/ecosystem/tofuNft.webp'
import umaprotocolLogo from '../../images/ecosystem/umaprotocol.webp'
import unidexLogo from '../../images/ecosystem/unidex.webp'
import witnetLogo from '../../images/ecosystem/witnet.svg'
import zenchaLogo from '../../images/ecosystem/zencha.webp'

/**
 * thematical order of type.
 *
 * [defi, nft, bridge, wallet, tool, token]
 *
 */

export const projectList = [
  {
    "title": "OolongSwap",
    "canLaunch": true,
    "link": "https://oolongswap.com/",
    "twitter": "https://twitter.com/oolongswap",
    "discord": "http://discord.gg/savwHHXsmU",
    "type": "defi",
    "image": OolongswapLogo
  },
  {
    "title": "FRAX",
    "canLaunch": false,
    "link": "https://frax.finance/",
    "telegram": "https://t.me/fraxfinance",
    "twitter": "https://twitter.com/fraxfinance",
    "type": "defi",
    "image": fraxLogo
  },
  {
    "title": "BoringDAO",
    "canLaunch": true,
    "link": "https://oportal.boringdao.com/twoway",
    "telegram": "https://t.me/Satis_Channel",
    "twitter": "https://twitter.com/TheBoringDAO",
    "discord": "https://discord.gg/4CezfPe7",
    "type": "bridge",
    "image": boaringDaoLogo
  },
  {
    "title": "Multichain",
    "canLaunch": true,
    "link": "https://anyswap.exchange/#/dashboard",
    "twitter": "https://twitter.com/AnyswapNetwork",
    "type": "bridge",
    "image": multiChainLogo
  },
  {
    "title": "Synapse",
    "canLaunch": true,
    "link": "https://synapseprotocol.com/?inputCurrency=USDC&outputCurrency=MIM&outputChain=42161",
    "telegram": "https://t.me/synapseprotocol",
    "twitter": "https://twitter.com/SynapseProtocol",
    "discord": "https://discord.com/invite/synapseprotocol",
    "type": "bridge",
    "image": synLogo
  },
  {
    "title": "SwapperChan",
    "canLaunch": true,
    "link": "https://swapperchan.com/swap",
    "telegram": "https://t.me/swapperchan",
    "twitter": "https://twitter.com/SwapperChan",
    "discord": "https://discord.com/invite/u6V3g5gdpV",
    "type": "defi",
    "image": swapperChanLogo
  },
  {
    "title": "Zencha",
    "canLaunch": true,
    "link": "https://www.zencha.finance/#/",
    "telegram": "https://t.me/zenchafinance",
    "twitter": "https://twitter.com/ZenchaFinance",
    "discord": "https://discord.com/invite/DwjPNvAwdd",
    "type": "defi",
    "image": zenchaLogo
  },
  {
    "title": "Unidex",
    "canLaunch": true,
    "link": "https://unidexbeta.app/trading",
    "telegram": "https://t.me/unidexfinance",
    "twitter": "https://twitter.com/UniDexFinance",
    "discord": "https://discord.com/invite/WzJPSjGj4h",
    "type": "defi",
    "image": unidexLogo
  },
  {
    "title": "LayerSwap",
    "canLaunch": true,
    "link": "https://www.layerswap.io/",
    "twitter": "https://twitter.com/layerswap",
    "discord": "http://discord.gg/KhwYN35sHy",
    "type": "bridge",
    "image": layerSwapLogo
  },
  {
    "title": "WitNet",
    "canLaunch": false,
    "link": "https://witnet.io/",
    "telegram": "https://t.me/witnetio",
    "twitter": "https://twitter.com/witnet_io",
    "discord": "https://discord.gg/X4uurfP",
    "type": "tools",
    "image": witnetLogo
  },
  {
    "title": "Boba Punks",
    "canLaunch": false,
    "link": "https://t.co/FRw0XfaQBH",
    "telegram": "https://t.me/bobapunks",
    "twitter": "https://twitter.com/boba_punks",
    "type": "nft",
    "image": bobaPunksLogo
  },
  {
    "title": "Boba Doge",
    "canLaunch": false,
    "link": "https://thebobadoge.com/",
    "telegram": "https://t.me/thebobadoge",
    "twitter": "https://twitter.com/BobaDoge",
    "discord": "http://discord.gg/jvXBqpKgdt",
    "type": "token",
    "image": bobaDogeLogo
  },
  {
    "title": "ApeBoard",
    "canLaunch": true,
    "link": "https://apeboard.finance/dashboard",
    "telegram": "https://t.me/joinchat/IgrzTnHKm-A0RwSP",
    "twitter": "https://twitter.com/ape_board",
    "type": "wallet",
    "image": apeBoardLogo
  },
  {
    "title": "DeBank",
    "canLaunch": true,
    "link": "https://debank.com/",
    "telegram": "https://t.me/DeBankEN",
    "twitter": "https://twitter.com/DebankDeFi",
    "discord": "https://discordapp.com/invite/KYuj8DE",
    "type": "defi",
    "image": deBankLogo
  },
  {
    "title": "SafePal",
    "canLaunch": false,
    "link": "https://safepal.io/",
    "type": "wallet",
    "image": safepalLogo
  },
  {
    "title": "Dodo",
    "canLaunch": true,
    "link": "https://dodoex.io/",
    "twitter": "https://twitter.com/BreederDodo?ref_src=twsrc%5Egoogle%7Ctwcamp%5Eserp%7Ctwgr%5Eauthor",
    "discord": "http://discord.gg/tyKReUK",
    "type": "defi",
    "image": dodoLogo
  },
  {
    "title": "tofuNFT",
    "canLaunch": true,
    "link": "https://tofunft.com/",
    "telegram": "http://t.me/boringDAO",
    "twitter": "https://twitter.com/tofuNFT",
    "discord": "https://discord.gg/3wFUTZmTm7",
    "type": "nft",
    "image": tofuNftLogo
  },
  {
    "title": "Band Protocol",
    "canLaunch": false,
    "link": "https://bandprotocol.com/",
    "telegram": "https://t.me/bandprotocol",
    "twitter": "https://twitter.com/BandProtocol",
    "discord": "https://discord.com/invite/3t4bsY7",
    "type": "tool",
    "image": bandProtocolLogo
  },
  {
    "title": "MEW",
    "canLaunch": true,
    "link": "https://www.myetherwallet.com/",
    "telegram": "https://t.me/myetherwallet",
    "twitter": "https://twitter.com/myetherwallet",
    "type": "wallet",
    "image": mewLogo
  },
  {
    "title": "Coin98",
    "canLaunch": true,
    "link": "https://wallet.coin98.com/",
    "telegram": "https://t.me/myetherwallet",
    "twitter": "https://twitter.com/coin98_wallet",
    "discord": "http://c98.link/discord",
    "type": "wallet",
    "image": coing98Logo
  },
  {
    "title": "L2Charts",
    "canLaunch": true,
    "link": "https://l2charts.com/",
    "twitter": "https://twitter.com/L2Charts",
    "type": "tool",
    "image": l2ChartsLogo
  },
  {
    "title": "Boba Apes",
    "canLaunch": true,
    "link": "https://bobaapes.com/",
    "twitter": "https://twitter.com/bobaapes",
    "type": "nft",
    "image": bobaApesLogo
  },
  {
    "title": "D’CENT Wallet",
    "canLaunch": false,
    "link": "https://dcentwallet.com/",
    "twitter": "https://twitter.com/DCENTwallets",
    "type": "wallet",
    "image": decentWalletLogo
  },
  {
    "title": "DEFIYIELD",
    "canLaunch": true,
    "link": "https://defiyield.app/dashboard",
    "telegram": "https://t.me/defiyield_app",
    "twitter": "https://twitter.com/defiyield_app",
    "type": "wallet",
    "image": defiyieldLogo
  },
  {
    "title": "Across",
    "canLaunch": true,
    "link": "https://across.to/",
    "twitter": "https://twitter.com/AcrossProtocol",
    "discord": "https://discord.gg/across",
    "type": "bridge",
    "image": acrossLogo
  },
  {
    "title": "UMA Protocol",
    "canLaunch": true,
    "link": "https://umaproject.org/",
    "twitter": "https://twitter.com/UMAprotocol",
    "discord": "https://discord.com/invite/jsb9XQJ",
    "type": "tool",
    "image": umaprotocolLogo
  },
  {
    "title": "Thetanuts",
    "canLaunch": true,
    "link": "https://thetanuts.finance/vaults",
    "twitter": "https://twitter.com/thetanuts",
    "discord": "https://discord.gg/XnSYqutaB3",
    "type": "defi",
    "image": thetanutsLogo
  },
  {
    "title": "Satis",
    "canLaunch": true,
    "link": "https://boba-testnet.sat.is/",
    "telegram": "https://t.me/Satis_Channel",
    "twitter": "https://twitter.com/SatisDEX",
    "discord": "https://discord.gg/JUmcTGbUWr",
    "type": "defi",
    "image": satisLogo
  },
  {
    "title": "ShibuiNFT",
    "canLaunch": true,
    "link": "https://shibuinft.com",
    "telegram": "https://docs.shibuidao.com/telegram",
    "twitter": "https://docs.shibuidao.com/twitter",
    "discord": "https://docs.shibuidao.com/discord",
    "type": "nft",
    "image": shibuiDAOLogo
  }
]


export const loadProjectByCategory = () => {
  const typeOrder = [ 'defi', 'nft', 'bridge', 'wallet', 'tool', 'token' ]
  const projectByType = groupBy(projectList, 'type')
  const orderProjects = {}
  typeOrder.forEach((key) => {
    orderProjects[ key ] = projectByType[key]
  })
  return orderProjects
}
