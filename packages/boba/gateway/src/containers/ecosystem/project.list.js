import { groupBy } from 'lodash'
import acrossLogo from '../../images/ecosystem/across.webp'
import apeBoardLogo from '../../images/ecosystem/apeBoard.webp'
import bandProtocolLogo from '../../images/ecosystem/bandProtocol.webp'
import bobaApesLogo from '../../images/ecosystem/bobaapes.webp'
import bobaDogeLogo from '../../images/ecosystem/bobaDoge.webp'
import bobaPunksLogo from '../../images/ecosystem/bobaPunks.webp'
import bodhLogo from '../../images/ecosystem/bodhfinance.svg'
import boringDaoLogo from '../../images/ecosystem/BoringDAO.webp'
import brewery from '../../images/ecosystem/brewery.svg'
import coing98Logo from '../../images/ecosystem/coin98.webp'
import deBankLogo from '../../images/ecosystem/deBank.webp'
import decentWalletLogo from '../../images/ecosystem/decentWallet.webp'
import defiyieldLogo from '../../images/ecosystem/defiyield.webp'
import dodoLogo from '../../images/ecosystem/dodo.webp'
import domFiLogo from '../../images/ecosystem/dominanaceFinanace.webp'
import fraxLogo from '../../images/ecosystem/frax.webp'
import koyoLogo from '../../images/ecosystem/koyo.svg'
import l2ChartsLogo from '../../images/ecosystem/l2Charts.webp'
import layerSwapLogo from '../../images/ecosystem/layerswap.webp'
import mewLogo from '../../images/ecosystem/mew.webp'
import multiChainLogo from '../../images/ecosystem/Multichain.webp'
import multiSigLogo from '../../images/ecosystem/multiSig.svg'
import OolongswapLogo from '../../images/ecosystem/Oolongswap.webp'
import safepalLogo from '../../images/ecosystem/safepal.webp'
import satisLogo from '../../images/ecosystem/satis.webp'
import shibuiDAOLogo from '../../images/ecosystem/shibuidao.svg'
import symbiosisLogo from '../../images/ecosystem/symbiosis.svg'
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
    "telegram": "https://t.me/oolongswap",
    "twitter": "https://twitter.com/oolongswap",
    "discord": "http://discord.gg/savwHHXsmU",
    "type": "defi",
    "image": OolongswapLogo,
    "description": "The leading DEX on Boba. OolongSwap incorporates all of the features you need from a traditional DEX while pioneering new ideas from DeFi 2.0 such as Protocol Controlled Value."
  },
  {
    "title": "FRAX",
    "canLaunch": false,
    "link": "https://frax.finance/",
    "telegram": "https://t.me/fraxfinance",
    "twitter": "https://twitter.com/fraxfinance",
    "type": "defi",
    "image": fraxLogo,
    "description": "World’s first fractional-algorithmic stablecoin protocol."
  },
  {
    "title": "Kōyō Finance",
    "canLaunch": true,
    "link": "https://koyo.finance/",
    "twitter": "https://docs.koyo.finance/twitter",
    "discord": "https://docs.koyo.finance/discord",
    "type": "defi",
    "image": koyoLogo,
    "description": "Kōyō is the first next-generation AMM protocol in the Boba ecosystem. It is inspired by Curve and Balancer. At its core it’s a decentralized exchange (DEX) that minimizes unnecessary losses from swaps between assets of equal value."
  },
  {
    "title": "BoringDAO",
    "canLaunch": true,
    "link": "https://oportal.boringdao.com/twoway",
    "telegram": "https://t.me/Satis_Channel",
    "twitter": "https://twitter.com/TheBoringDAO",
    "discord": "https://discord.gg/4CezfPe7",
    "type": "bridge",
    "image": boringDaoLogo,
    "description": "Safely move your Bitcoin & other crypto assets between Ethereum and different blockchains to maximize utilization rate of crypto assets in DeFi world."
  },
  {
    "title": "Multichain",
    "canLaunch": true,
    "link": "https://anyswap.exchange/#/dashboard",
    "twitter": "https://twitter.com/AnyswapNetwork",
    "type": "bridge",
    "image": multiChainLogo,
    "description": "Cross-Chain Router Protocol, envisioned to be the ultimate router for Web3."
  },
  {
    "title": "Synapse",
    "canLaunch": true,
    "link": "https://synapseprotocol.com/?inputCurrency=USDC&outputCurrency=MIM&outputChain=42161",
    "telegram": "https://t.me/synapseprotocol",
    "twitter": "https://twitter.com/SynapseProtocol",
    "discord": "https://discord.com/invite/synapseprotocol",
    "type": "bridge",
    "image": synLogo,
    "description": "A widely used cross-chain liquidity network connecting all blockchains."
  },
  {
    "title": "Domination Finance",
    "canLaunch": true,
    "link": "https://domination.finance/",
    "twitter": "https://twitter.com/dominationfi",
    "discord": "https://discord.domination.finance/",
    "type": "defi",
    "image": domFiLogo,
    "description": "The world’s first DEX for dominance trading."
  },
  {
    "title": "Zencha",
    "canLaunch": true,
    "link": "https://www.zencha.finance/#/",
    "telegram": "https://t.me/zenchafinance",
    "twitter": "https://twitter.com/ZenchaFinance",
    "discord": "https://discord.com/invite/DwjPNvAwdd",
    "type": "defi",
    "image": zenchaLogo,
    "description": "The First StableSwap Exchange & Liquidity Pool on Boba."
  },
  {
    "title": "Unidex",
    "canLaunch": true,
    "link": "https://unidexbeta.app/trading",
    "telegram": "https://t.me/unidexfinance",
    "twitter": "https://twitter.com/UniDexFinance",
    "discord": "https://discord.com/invite/WzJPSjGj4h",
    "type": "defi",
    "image": unidexLogo,
    "description": "The meta-aggregator of everything in DeFi. Charts, perpetuals, swaps, limit-orders, data, and more everyday."
  },
  {
    "title": "LayerSwap",
    "canLaunch": true,
    "link": "https://www.layerswap.io/",
    "twitter": "https://twitter.com/layerswap",
    "discord": "http://discord.gg/KhwYN35sHy",
    "type": "bridge",
    "image": layerSwapLogo,
    "description": "Bridge Crypto from CEX to Layer2 faster and cheaper."
  },
  {
    "title": "WitNet",
    "canLaunch": false,
    "link": "https://witnet.io/",
    "telegram": "https://t.me/witnetio",
    "twitter": "https://twitter.com/witnet_io",
    "discord": "https://discord.gg/X4uurfP",
    "type": "tools",
    "image": witnetLogo,
    "description": "Multi-chain secure data input. Price feeds, randomness and HTTP adapters."
  },
  {
    "title": "Boba Punks",
    "canLaunch": false,
    "link": "https://t.co/FRw0XfaQBH",
    "telegram": "https://t.me/bobapunks",
    "twitter": "https://twitter.com/boba_punks",
    "type": "nft",
    "image": bobaPunksLogo,
    "description": "The first punks on Boba."
  },
  {
    "title": "Boba Doge",
    "canLaunch": false,
    "link": "https://thebobadoge.com/",
    "telegram": "https://t.me/thebobadoge",
    "twitter": "https://twitter.com/BobaDoge",
    "discord": "http://discord.gg/jvXBqpKgdt",
    "type": "token",
    "image": bobaDogeLogo,
    "description": "The first dog coin on Boba."
  },
  {
    "title": "ApeBoard",
    "canLaunch": true,
    "link": "https://apeboard.finance/dashboard",
    "telegram": "https://t.me/joinchat/IgrzTnHKm-A0RwSP",
    "twitter": "https://twitter.com/ape_board",
    "type": "wallet",
    "image": apeBoardLogo,
    "description": "Multi-chain DeFi dashboard. Built by apes, for apes."
  },
  {
    "title": "DeBank",
    "canLaunch": true,
    "link": "https://debank.com/",
    "telegram": "https://t.me/DeBankEN",
    "twitter": "https://twitter.com/DebankDeFi",
    "discord": "https://discordapp.com/invite/KYuj8DE",
    "type": "defi",
    "image": deBankLogo,
    "description": "A leading DeFi portfolio tracker that supports a large number of DeFi protocols across 19 chains."
  },
  {
    "title": "SafePal",
    "canLaunch": false,
    "link": "https://safepal.io/",
    "type": "wallet",
    "image": safepalLogo,
    "description": "1st tokenized crypto hardware wallet."
  },
  {
    "title": "Dodo",
    "canLaunch": true,
    "link": "https://dodoex.io/",
    "twitter": "https://twitter.com/BreederDodo",
    "discord": "http://discord.gg/tyKReUK",
    "type": "defi",
    "image": dodoLogo,
    "description": "Decentralized Trading Protocol for Web3, Powered by Proactive Market Making."
  },
  {
    "title": "tofuNFT",
    "canLaunch": true,
    "link": "https://tofunft.com/",
    "telegram": "http://t.me/boringDAO",
    "twitter": "https://twitter.com/tofuNFT",
    "discord": "https://discord.gg/3wFUTZmTm7",
    "type": "nft",
    "image": tofuNftLogo,
    "description": "NFT marketplace for Boba Network."
  },
  {
    "title": "Band Protocol",
    "canLaunch": false,
    "link": "https://bandprotocol.com/",
    "telegram": "https://t.me/bandprotocol",
    "twitter": "https://twitter.com/BandProtocol",
    "discord": "https://discord.com/invite/3t4bsY7",
    "type": "tool",
    "image": bandProtocolLogo,
    "description": "Secure, scalable cross-chain decentralized oracle."
  },
  {
    "title": "Boba MultiSig",
    "canLaunch": true,
    "link": "https://multisig.boba.network/",
    "type": "wallet",
    "image": multiSigLogo,
    "description": "The most trusted platform to manage digital assets on Ethereum."
  },
  {
    "title": "MEW",
    "canLaunch": true,
    "link": "https://www.myetherwallet.com/",
    "telegram": "https://t.me/myetherwallet",
    "twitter": "https://twitter.com/myetherwallet",
    "type": "wallet",
    "image": mewLogo,
    "description": "Free, client-side interface helping you interact with the Ethereum blockchain,"
  },
  {
    "title": "Coin98",
    "canLaunch": true,
    "link": "https://wallet.coin98.com/",
    "telegram": "https://t.me/myetherwallet",
    "twitter": "https://twitter.com/coin98_wallet",
    "discord": "http://c98.link/discord",
    "type": "wallet",
    "image": coing98Logo,
    "description": "Leading multi-chain wallet and DeFi gateway, designed to seamlessly connect users to the crypto world in a safe and secure manner."
  },
  {
    "title": "L2Charts",
    "canLaunch": true,
    "link": "https://l2charts.com/",
    "twitter": "https://twitter.com/L2Charts",
    "type": "tool",
    "image": l2ChartsLogo,
    "description": "Your Favorite charts on L2."
  },
  {
    "title": "Boba Apes",
    "canLaunch": true,
    "link": "https://bobaapes.com/",
    "twitter": "https://twitter.com/bobaapes",
    "type": "nft",
    "image": bobaApesLogo,
    "description": "Christmas collection of 10000 randomized and unique digital collectibles."
  },
  {
    "title": "D’CENT Wallet",
    "canLaunch": false,
    "link": "https://dcentwallet.com/",
    "twitter": "https://twitter.com/DCENTwallets",
    "type": "wallet",
    "image": decentWalletLogo,
    "description": "The über convenient multi crypto wallet with native dApp browser for Game, NFT, DeFi, and more."
  },
  {
    "title": "DEFIYIELD",
    "canLaunch": true,
    "link": "https://defiyield.app/dashboard",
    "telegram": "https://t.me/defiyield_app",
    "twitter": "https://twitter.com/defiyield_app",
    "type": "wallet",
    "image": defiyieldLogo,
    "description": "Manage Your DeFi Life. Asset Management Dashboard secured by a Blockchain Security Blockchain."
  },
  {
    "title": "Across",
    "canLaunch": true,
    "link": "https://across.to/",
    "twitter": "https://twitter.com/AcrossProtocol",
    "discord": "https://discord.gg/across",
    "type": "bridge",
    "image": acrossLogo,
    "description": "Across is a fast, cheap, and secure bridge between L1 and L2s."
  },
  {
    "title": "UMA Protocol",
    "canLaunch": true,
    "link": "https://umaproject.org/",
    "twitter": "https://twitter.com/UMAprotocol",
    "discord": "https://discord.com/invite/jsb9XQJ",
    "type": "tool",
    "image": umaprotocolLogo,
    "description": "Optimistic Oracle built for Web3."
  },
  {
    "title": "Thetanuts",
    "canLaunch": true,
    "link": "https://thetanuts.finance/vaults",
    "twitter": "https://twitter.com/thetanuts",
    "discord": "https://discord.gg/XnSYqutaB3",
    "type": "defi",
    "image": thetanutsLogo,
    "description": "Sustainable yield through automated yield generating vault strategies implemented on cross-chain structured products."
  },
  {
    "title": "Satis",
    "canLaunch": true,
    "link": "https://boba-testnet.sat.is/",
    "telegram": "https://t.me/Satis_Channel",
    "twitter": "https://twitter.com/SatisDEX",
    "discord": "https://discord.gg/JUmcTGbUWr",
    "type": "defi",
    "image": satisLogo,
    "description": "The DEX for the Interoperable Future - First multichain order book derivatives DEX powered by concentrated liquidity."
  },
  {
    "title": "ShibuiNFT",
    "canLaunch": true,
    "link": "https://shibuinft.com",
    "telegram": "https://docs.shibuidao.com/telegram",
    "twitter": "https://docs.shibuidao.com/twitter",
    "discord": "https://docs.shibuidao.com/discord",
    "type": "nft",
    "image": shibuiDAOLogo,
    "description": "An NFT marketplace on Boba."
  },
  {
    "title": "Boba Brewery",
    "canLaunch": true,
    "link": "http://bobabrewery.com/",
    "telegram": "https://t.me/bobabrewery",
    "twitter": "https://twitter.com/boba_brewery",
    "type": "defi",
    "image": brewery,
    "description": "Boba Brewery is the first launchpad for decentralized fundraising in the Boba ecosystem, offering the hottest and innovative projects in a fair, secure, and efficient way."
  },
  {
    "title": "Bodh Finance",
    "canLaunch": true,
    "link": "https://bodh.finance/",
    "twitter": "https://twitter.com/BodhFinance",
    "discord": "https://discord.gg/za9KXX5m6E",
    "type": "defi",
    "image": bodhLogo,
    "description": "The leading Lending protocol on Boba Network."
  },
  {
     "title": "Symbiosis",
     "canLaunch": true,
     "link": "https://symbiosis.finance/",
     "telegram": "https://t.me/symbiosis_finance",
     "twitter": "https://twitter.com/symbiosis_fi",
     "discord": "https://discord.gg/vmQjR2d7WC",
     "type": "defi",
     "image": symbiosisLogo,
     "description": "Symbiosis aggregates decentralized exchange liquidity across any EVM and non-EVM networks. Swap any token and transfer liquidity. Yes, any."
   },
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
