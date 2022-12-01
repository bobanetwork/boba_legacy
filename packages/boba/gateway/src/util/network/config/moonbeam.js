import { ETHERSCAN_API_KEY } from "util/constant";

export const moonbeamConfig = {
  Testnet: {
    OMGX_WATCHER_URL: `https://api-watcher.bobabase.boba.network/`,
    MM_Label:         `BobaBase`,
    addressManager:   `0xF8d0bF3a1411AC973A606f90B2d1ee0840e5979B`,
    L1: {
      name: "MoonBase",
      chainId: 1287,
      chainIdHex: '0x507',
      rpcUrl: `https://rpc.api.moonbase.moonbeam.network`,
      blockExplorer: `https://api-moonbase.moonscan.io/api?module=account&action=txlist&startblock=0&endblock=99999999&sort=asc&apikey=${ETHERSCAN_API_KEY}`,
      transaction: `https://moonbase.moonscan.io/tx/`,
      blockExplorerUrl: `https://moonbase.moonscan.io`,
      symbol: 'GLMR',
      tokenName: 'GLMR',
    },
    L2: {
      name: "BobaBase",
      chainId: 1297,
      chainIdHex: '0x511',
      rpcUrl: `https://bobabase.boba.network`,
      blockExplorer: `https://blockexplorer.bobabase.boba.network/`,
      transaction: `https://blockexplorer.bobabase.boba.network/tx/`,
      blockExplorerUrl: `https://blockexplorer.bobabase.boba.network`,
    },
    gasEstimateAccount: `0xdb5a187FED81c735ddB1F6E47F28f2A5F74639b2`,
    twitterFaucetPromotionText: `https://twitter.com/intent/tweet?text=I%27m%20developing%20on%20Bobabase%20for%20Moonbeam%20`
  },
  Mainnet: {
    OMGX_WATCHER_URL: `https://api-watcher.bobabeam.boba.network/`,
    MM_Label:         `bobaBeam`,
    addressManager:   `0x564c10A60af35a07f0EA8Be3106a4D81014b21a0`,
    L1: {
      name: "MoonBeam",
      chainId: 1284,
      chainIdHex: '0x504',
      rpcUrl: `https://rpc.api.moonbeam.network`,
      blockExplorer: `https://api-moonbeam.moonscan.io/api?module=account&action=txlist&startblock=0&endblock=99999999&sort=asc&apikey=${ETHERSCAN_API_KEY}`,
      transaction: `https://moonscan.io/tx/`,
      blockExplorerUrl: `https://moonscan.io/`,
      symbol: "GLMR",
      tokenName: "GLMR",
    },
    L2: {
      name: "BobaBeam",
      chainId: 1294,
      chainIdHex: '0x50E',
      rpcUrl: `https://bobabeam.boba.network`,
      blockExplorer: `https://blockexplorer.bobabeam.boba.network/`,
      transaction: `https://blockexplorer.bobabeam.boba.network/tx/`,
      blockExplorerUrl: `https://blockexplorer.bobabeam.boba.network/`,
    },
    gasEstimateAccount: `0xdb5a187FED81c735ddB1F6E47F28f2A5F74639b2`,
    twitterFaucetPromotionText: `https://twitter.com/intent/tweet?text=I%27m%20developing%20on%20Bobabeam%20for%20Moonbeam%20`
  }
}
