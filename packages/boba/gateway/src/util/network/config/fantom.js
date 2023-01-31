
export const fantomConfig = {
  Testnet: {
    OMGX_WATCHER_URL: `https://api-watcher.testnet.bobaopera.boba.network/`,
    META_TRANSACTION: `https://api-meta-transaction.testnet.bobaopera.boba.network/`,
    MM_Label:         `bobaOperaTestnet`,
    addressManager:   `0x12ad9f501149D3FDd703cC10c567F416B7F0af8b`,
    L1: {
      name: "Fantom Testnet",
      chainId: 4002,
      chainIdHex: '0xFA2',
      rpcUrl: `https://rpc.testnet.fantom.network`,
      transaction: `https://testnet.ftmscan.com/tx/`,
      blockExplorerUrl: `https://testnet.ftmscan.com/`,
      symbol: 'FTM',
      tokenName: 'FTM',
    },
    L2: {
      name: "BobaOpera Testnet",
      chainId: 4051,
      chainIdHex: '0xFD3',
      rpcUrl: `https://testnet.bobaopera.boba.network`,
      blockExplorer: `https://blockexplorer.testnet.bobaopera.boba.network/`,
      transaction: `https://blockexplorer.testnet.bobaopera.boba.network/tx/`,
      blockExplorerUrl: `https://blockexplorer.testnet.bobaopera.boba.network/`,
    },
    gasEstimateAccount: `0xdb5a187FED81c735ddB1F6E47F28f2A5F74639b2`,
    twitterFaucetPromotionText: `https://twitter.com/intent/tweet?text=I%27m%20developing%20on%20Bobaopera%20Testnet%20for%20Fantom%20`
  },
  Mainnet: {
    OMGX_WATCHER_URL: `https://api-watcher.bobaopera.boba.network/`,
    META_TRANSACTION: `https://api-meta-transaction.bobaopera.boba.network/`,
    MM_Label:         `Bobaopera`,
    addressManager:   `0x4e7325bcf09e091Bb8119258B885D4ef687B7386`,
    L1: {
      name: "Fantom Mainnet",
      chainId: 250,
      chainIdHex: '0xFA',
      rpcUrl: `https://rpc.fantom.network`,
      transaction: `https://ftmscan.com/tx/`,
      blockExplorerUrl: `https://ftmscan.com/`,
      symbol: 'FTM',
      tokenName: 'FTM',
    },
    L2: {
      name: "Bobaopera Mainnet",
      chainId: 301,
      chainIdHex: '0x12D',
      rpcUrl: `https://bobaopera.boba.network`,
      blockExplorer: `https://blockexplorer.bobaopera.boba.network/`,
      transaction: `https://blockexplorer.bobaopera.boba.network/tx/`,
      blockExplorerUrl: `https://blockexplorer.bobaopera.boba.network/`,
    },
    gasEstimateAccount: `0xdb5a187FED81c735ddB1F6E47F28f2A5F74639b2`,
    twitterFaucetPromotionText: `https://twitter.com/intent/tweet?text=I%27m%20developing%20on%20Bobaopera%20Testnet%20for%20Fantom%20`
  }
}
