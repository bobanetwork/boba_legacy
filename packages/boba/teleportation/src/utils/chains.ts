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
  // TODO: Consider using AddressManager or AddressPackage instead

  //#region boba_networks
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
    teleportationAddress: '0x97880a36512d3D478552ec24d81978ff631dB106',
    height: 3820,
    supportedAssets: {
      '0x0000000000000000000000000000000000000000': 'ETH',
      '0x4200000000000000000000000000000000000023': 'BOBA',
    },
  },
  4328: {
    url: 'https://replica.testnet.avax.boba.network',
    testnet: true,
    name: 'Boba Avalanche Testnet',
    teleportationAddress: '0x71348271f12b98Bbc83c329dcaA424EC6F1F05F2',
    height: 3148,
    supportedAssets: {
      '0x4200000000000000000000000000000000000023': 'AVAX',
      '0x0000000000000000000000000000000000000000': 'BOBA',
    },
  },
  9728: {
    url: 'https://replica.testnet.bnb.boba.network',
    testnet: true,
    name: 'Boba BNB Testnet',
    teleportationAddress: '0x71348271f12b98Bbc83c329dcaA424EC6F1F05F2',
    height: 240152,
    supportedAssets: {
      '0x4200000000000000000000000000000000000023': 'BNB',
      '0x0000000000000000000000000000000000000000': 'BOBA',
    },
  },
  4051: {
    url: 'https://replica.testnet.bobaopera.boba.network',
    testnet: true,
    name: 'Bobaopera Testnet',
    teleportationAddress: '0x2965Cc3d8Ba6790d6fCCedaC44864f2ff6e01f21',
    height: 3197,
    supportedAssets: {
      '0x4200000000000000000000000000000000000023': 'FTM',
      '0x0000000000000000000000000000000000000000': 'BOBA',
    },
  },
  //#endregion
  //#region l1
  1: {
    url: 'https://eth.llamarpc.com',
    testnet: false,
    name: 'Ethereum Mainnet',
    teleportationAddress: '0x0',
    height: 17565090,
    supportedAssets: {
      '0x0000000000000000000000000000000000000000': 'ETH',
      '0x42bBFa2e77757C645eeaAd1655E0911a7553Efbc': 'BOBA',
      '0xdAC17F958D2ee523a2206206994597C13D831ec7': 'USDT',
      '0xB8c77482e45F1F44dE1745F52C74426C631bDD52': 'BNB',
    },
  },
  5: {
    url: 'https://goerli.gateway.tenderly.co',
    testnet: true,
    name: 'Goerli Testnet',
    teleportationAddress: '0x71348271f12b98Bbc83c329dcaA424EC6F1F05F2',
    height: 9244943,
    supportedAssets: {
      '0x0000000000000000000000000000000000000000': 'ETH',
      '0xC2C527C0CACF457746Bd31B2a698Fe89de2b6d49': 'USDT',
      '0xFC1C82c5EdeB51082CF30FDDb434D2cBDA1f6924': 'BNB',
      '0xeCCD355862591CBB4bB7E7dD55072070ee3d0fC1': 'BOBA',
    },
  },
  //#endregion
}
