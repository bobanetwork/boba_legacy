export const BobaChains = {
  // TODO: Consider using AddressManager or AddressPackage instead

  //#region boba_networks
  288: {
    url: 'https://replica.boba.network',
    testnet: false,
    name: 'Boba Ethereum Mainnet',
    teleportationAddress: '0xd68809330075C792C171C450B983F4D18128e9BF',
    height: 873302,
    supportedAssets: {
      ['0x0000000000000000000000000000000000000000'.toLowerCase()]: 'ETH',
      ['0xa18bF3994C0Cc6E3b63ac420308E5383f53120D7'.toLowerCase()]: 'BOBA',
      ['0x5DE1677344D3Cb0D7D465c10b72A8f60699C062d'.toLowerCase()]: 'USDT',
      ['0x68ac1623ACf9eB9F88b65B5F229fE3e2c0d5789e'.toLowerCase()]: 'BNB',
    },
  },
  56288: {
    url: 'https://replica.bnb.boba.network',
    testnet: false,
    name: 'Boba BNB Mainnet',
    teleportationAddress: '0xd68809330075C792C171C450B983F4D18128e9BF',
    height: 3393,
    supportedAssets: {
      ['0x4200000000000000000000000000000000000023'.toLowerCase()]: 'BNB',
      ['0x0000000000000000000000000000000000000000'.toLowerCase()]: 'BOBA',
    },
  },
  2888: {
    url: 'https://replica.goerli.boba.network',
    testnet: true,
    name: 'Boba Ethereum Goerli',
    teleportationAddress: '0xB43EE846Aa266228FeABaD1191D6cB2eD9808894',
    height: 40822,
    supportedAssets: {
      ['0x0000000000000000000000000000000000000000'.toLowerCase()]: 'ETH',
      ['0x4200000000000000000000000000000000000023'.toLowerCase()]: 'BOBA',
    },
  },
  9728: {
    url: 'https://replica.testnet.bnb.boba.network',
    testnet: true,
    name: 'Boba BNB Testnet',
    teleportationAddress: '0xf4d179d3a083Fa3Eede935FaF4C679D32d514186',
    height: 295353,
    supportedAssets: {
      ['0x4200000000000000000000000000000000000023'.toLowerCase()]: 'BNB',
      ['0x0000000000000000000000000000000000000000'.toLowerCase()]: 'BOBA',
      ['0xc614A66f82e71758Fa7735C91dAD1088c8362f15'.toLowerCase()]: 'ETH',
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
      ['0x0000000000000000000000000000000000000000'.toLowerCase()]: 'ETH',
      ['0x42bBFa2e77757C645eeaAd1655E0911a7553Efbc'.toLowerCase()]: 'BOBA',
      ['0xdAC17F958D2ee523a2206206994597C13D831ec7'.toLowerCase()]: 'USDT',
      ['0xB8c77482e45F1F44dE1745F52C74426C631bDD52'.toLowerCase()]: 'BNB',
    },
  },
  56: {
    url: 'https://rpc.ankr.com/bsc',
    testnet: false,
    name: 'BNB Mainnet',
    teleportationAddress: '0x0',
    height: 30907682,
    supportedAssets: {
      /*'0x0000000000000000000000000000000000000000': 'ETH',
      '0x42bBFa2e77757C645eeaAd1655E0911a7553Efbc': 'BOBA',
      '0xdAC17F958D2ee523a2206206994597C13D831ec7': 'USDT',
      '0xB8c77482e45F1F44dE1745F52C74426C631bDD52': 'BNB',*/
    },
  },
  5: {
    url: 'https://goerli.gateway.tenderly.co',
    testnet: true,
    name: 'Goerli Testnet',
    teleportationAddress: '0x84b22166366a6f7E0cD0c3ce9998f2913Bf17A13',
    height: 9484025,
    supportedAssets: {
      ['0x0000000000000000000000000000000000000000'.toLowerCase()]: 'ETH',
      ['0xC2C527C0CACF457746Bd31B2a698Fe89de2b6d49'.toLowerCase()]: 'USDT',
      ['0xFC1C82c5EdeB51082CF30FDDb434D2cBDA1f6924'.toLowerCase()]: 'BNB',
      ['0xeCCD355862591CBB4bB7E7dD55072070ee3d0fC1'.toLowerCase()]: 'BOBA',
    },
  },
  97: {
    url: 'https://bsc.getblock.io/28c7f0fe-802f-4631-9f45-2df301789ecf/testnet/',
    testnet: true,
    name: 'BNB Testnet',
    teleportationAddress: '0x7f6a32bCaA70c65E08F2f221737612F6fC18347A',
    height: 32272487,
    supportedAssets: {
      ['0x0000000000000000000000000000000000000000'.toLowerCase()]: 'BNB',
      ['0x875cD11fDf085e0E11B0EE6b814b6d0b38fA554C'.toLowerCase()]: 'BOBA',
      ['0xd66c6B4F0be8CE5b39D52E0Fd1344c389929B378'.toLowerCase()]: 'ETH', // WETH
    },
  },
  //#endregion
}
