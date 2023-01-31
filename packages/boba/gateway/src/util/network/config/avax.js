
export const avaxConfig = {
  Testnet: {
    OMGX_WATCHER_URL: `https://api-watcher.testnet.avax.boba.network/`,
    META_TRANSACTION: `https://api-meta-transaction.testnet.avax.boba.network/`,
    MM_Label:         `Boba Avalanche Testnet`,
    addressManager:   `0xcE78de95b85212BC348452e91e0e74c17cf37c79`,
    L1: {
      name: "Avalanche Testnet",
      chainId: 43113,
      chainIdHex: '0xA869',
      rpcUrl: `https://api.avax-test.network/ext/bc/C/rpc`,
      transaction: `https://testnet.snowtrace.io/tx/`,
      blockExplorerUrl: `https://testnet.snowtrace.io/`,
      symbol: "AVAX",
      tokenName: "AVAX",
    },
    L2: {
      name: "Boba Avalanche Testnet",
      chainId: 4328,
      chainIdHex: '0x10E8',
      rpcUrl: `https://testnet.avax.boba.network`,
      blockExplorer: `https://blockexplorer.testnet.avax.boba.network/`,
      transaction: `https://blockexplorer.testnet.avax.boba.network/tx/`,
      blockExplorerUrl: `https://blockexplorer.testnet.avax.boba.network/`,
    },
    gasEstimateAccount: `0xdb5a187FED81c735ddB1F6E47F28f2A5F74639b2`,
    twitterFaucetPromotionText: `https://twitter.com/intent/tweet?text=I%27m%20developing%20on%20Boba%20Avalanche%20Testnet%20for%20Avalanche%20`
  },
  Mainnet: {
    OMGX_WATCHER_URL: `https://api-watcher.avax.boba.network/`,
    META_TRANSACTION: `https://api-meta-transaction.avax.boba.network/`,
    MM_Label:         `Boba Avalanche Mainnet`,
    addressManager:   `0x00220f8ce1c4be8436574e575fE38558d85e2E6b`,
    L1: {
      name: "Avalanche Mainnet",
      chainId: 43114,
      chainIdHex: '0xA86A',
      rpcUrl: `https://api.avax.network/ext/bc/C/rpc`,
      transaction: `https://snowtrace.io/tx/`,
      blockExplorerUrl: `https://snowtrace.io/`,
      symbol: "AVAX",
      tokenName: "AVAX",
    },
    L2: {
      name: "Boba Avalanche Mainnet",
      chainId: 43288,
      chainIdHex: '0xA918',
      rpcUrl: `https://avax.boba.network`,
      blockExplorer: `https://blockexplorer.avax.boba.network/`,
      transaction: `https://blockexplorer.avax.boba.network/tx/`,
      blockExplorerUrl: `https://blockexplorer.avax.boba.network`,
    },
    gasEstimateAccount: `0xdb5a187FED81c735ddB1F6E47F28f2A5F74639b2`,
    twitterFaucetPromotionText: `https://twitter.com/intent/tweet?text=I%27m%20developing%20on%20Boba%20Avalanche%20Testnet%20for%20Avalanche%20`
  }
}
