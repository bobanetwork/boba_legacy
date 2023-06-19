export interface IBobaChains {
  [chainId: number]: {
    url: string
    testnet: boolean
    name: string
    teleportationAddress: string
    height: number
    supportedAssets: {
      [address: string]: string // symbol (MUST BE UNIQUE)
    }
  }
}

/**
 * @dev Chain configs
 * @property supportedAssets: BOBA as fee token only supported for EOAs, since Teleporter consists of a contract & the disburser wallet (assuming ETH fee) everything with 0x0 should be fine.
 **/
export const BobaChains: IBobaChains = {
  288: {
    url: 'https://replica.boba.network',
    testnet: false,
    name: 'Boba Ethereum Mainnet',
    teleportationAddress: '0xd68809330075C792C171C450B983F4D18128e9BF',
    height: 873302,
    supportedAssets: {
      '0x0000000000000000000000000000000000000000': 'ETH',
      '0xa18bF3994C0Cc6E3b63ac420308E5383f53120D7': 'BOBA',
      '0x5DE1677344D3Cb0D7D465c10b72A8f60699C062d': 'USDT',
      '0x68ac1623ACf9eB9F88b65B5F229fE3e2c0d5789e': 'BNB',
    },
  },
  1294: {
    url: 'https://replica.bobabeam.boba.network',
    testnet: false,
    name: 'Bobabeam',
    teleportationAddress: '0xd68809330075C792C171C450B983F4D18128e9BF',
    height: 479856,
    supportedAssets: {
      '0x0000000000000000000000000000000000000000': 'GLMR',
      '0x4200000000000000000000000000000000000006': 'BOBA',
    },
  },
  43288: {
    url: 'https://replica.avax.boba.network',
    testnet: false,
    name: 'Boba Avalanche Mainnet',
    teleportationAddress: '0xd68809330075C792C171C450B983F4D18128e9BF',
    height: 25078,
    supportedAssets: {
      '0x0000000000000000000000000000000000000000': 'AVAX',
      '0x4200000000000000000000000000000000000006': 'BOBA',
    },
  },
  56288: {
    url: 'https://replica.bnb.boba.network',
    testnet: false,
    name: 'Boba BNB Mainnet',
    teleportationAddress: '0xd68809330075C792C171C450B983F4D18128e9BF',
    height: 3393,
    supportedAssets: {
      '0x0000000000000000000000000000000000000000': 'BNB',
      '0x4200000000000000000000000000000000000006': 'BOBA',
    },
  },
  301: {
    url: 'https://replica.bobaopera.boba.network',
    testnet: false,
    name: 'Bobaopera',
    teleportationAddress: '0xd68809330075C792C171C450B983F4D18128e9BF',
    height: 10604,
    supportedAssets: {
      '0x0000000000000000000000000000000000000000': 'FTM',
      '0x4200000000000000000000000000000000000006': 'BOBA',
    },
  },
  2888: {
    url: 'https://replica.goerli.boba.network',
    testnet: true,
    name: 'Boba Ethereum Goerli',
    teleportationAddress: '0xd68809330075C792C171C450B983F4D18128e9BF',
    height: 59,
    supportedAssets: {
      '0x0000000000000000000000000000000000000000': 'ETH',
      '0x4200000000000000000000000000000000000023': 'BOBA',
    },
  },
  1297: {
    url: 'https://replica.bobabase.boba.network',
    testnet: true,
    name: 'Bobabase',
    teleportationAddress: '0xd68809330075C792C171C450B983F4D18128e9BF',
    height: 304189,
    supportedAssets: {
      '0x0000000000000000000000000000000000000000': 'DEV',
      '0x4200000000000000000000000000000000000006': 'BOBA',
    },
  },
  4328: {
    url: 'https://replica.testnet.avax.boba.network',
    testnet: true,
    name: 'Boba Avalanche Testnet',
    teleportationAddress: '0xd68809330075C792C171C450B983F4D18128e9BF',
    height: 489,
    supportedAssets: {
      '0x0000000000000000000000000000000000000000': 'AVAX',
      '0x4200000000000000000000000000000000000006': 'BOBA',
    },
  },
  9728: {
    url: 'https://replica.testnet.bnb.boba.network',
    testnet: true,
    name: 'Boba BNB Testnet',
    teleportationAddress: '0xd68809330075C792C171C450B983F4D18128e9BF',
    height: 3288,
    supportedAssets: {
      '0x0000000000000000000000000000000000000000': 'BNB',
      '0x4200000000000000000000000000000000000006': 'BOBA',
    },
  },
  4051: {
    url: 'https://replica.testnet.bobaopera.boba.network',
    testnet: true,
    name: 'Bobaopera Testnet',
    teleportationAddress: '0xd68809330075C792C171C450B983F4D18128e9BF',
    height: 299,
    supportedAssets: {
      '0x0000000000000000000000000000000000000000': 'FTM',
      '0x4200000000000000000000000000000000000006': 'BOBA',
    },
  },
}
