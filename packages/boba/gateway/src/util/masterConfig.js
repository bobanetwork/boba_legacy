/*
Copyright 2021-present Boba Network.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

require('dotenv').config()

let NETWORK

if (process.env.REACT_APP_CHAIN === 'rinkeby') {
  NETWORK = {
    rinkeby: {
      OMGX_WATCHER_URL: `https://api-watcher.rinkeby.boba.network/`,
      VERIFIER_WATCHER_URL: `https://api-verifier.rinkeby.boba.network/`,
      MM_Label:         `Rinkeby`,
      addressManager:   `0x93A96D6A5beb1F661cf052722A1424CDDA3e9418`,
      L1: {
        name: "Rinkeby",
        chainId: 4,
        chainIdHex: '0x4',
        rpcUrl: `https://rinkeby.infura.io/v3/${process.env.REACT_APP_INFURA_ID}`,
        blockExplorer: `https://api-rinkeby.etherscan.io/api?module=account&action=txlist&startblock=0&endblock=99999999&sort=asc&apikey=${process.env.REACT_APP_ETHERSCAN_API}`,
        transaction: `https://rinkeby.etherscan.io/tx/`
      },
      L2: {
        name: "BOBA Rinkeby L2",
        chainId: 28,
        chainIdHex: '0x1C',
        rpcUrl: `https://rinkeby.boba.network`,
        blockExplorer: `https://testnet.bobascan.com/`,
        transaction: `https://testnet.bobascan.com/tx/`
      },
      payloadForL1SecurityFee: {
        from: '0x122816e7A7AeB40601d0aC0DCAA8402F7aa4cDfA',
        to: '0x4df04E20cCd9a8B82634754fcB041e86c5FF085A',
        value: '0x174876e800',
        data:
          '0x7ff36ab500000000000000000000000000000000000000000000000003939808cc6852cc0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000122816e7a7aeb40601d0ac0dcaa8402f7aa4cdfa0000000000000000000000000000000000000000000000000000008c14b4a17a0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000deaddeaddeaddeaddeaddeaddeaddeaddead00000000000000000000000000004204a0af0991b2066d2d617854d5995714a79132',
      },
      payloadForFastDepositBatchCost: {
        from: '0x5E7a06025892d8Eef0b5fa263fA0d4d2E5C3B549',
        to: '0x12F8d1cD442cf1CF94417cE6309c6D2461Bd91a3',
        value: '0x038d7ea4c68000',
        data:
          '0xa44c80e3000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000006a6676813d3d4317442cf84667425c13553f4a760000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000038d7ea4c68000'
      },
      gasEstimateAccount: `0x1FE67D4a3c73abAa0703a70bAbf0fB81aC572bd2`,
      twitterFaucetPromotionText: `https://twitter.com/intent/tweet?text=I%27m%20developing%20on%20Boba%20for%20Rinkeby%20`
    }
  }
} else if (process.env.REACT_APP_CHAIN === 'mainnet') {
  NETWORK = {
    mainnet: {
      OMGX_WATCHER_URL: `https://api-watcher.mainnet.boba.network/`,
      VERIFIER_WATCHER_URL: `https://api-verifier.mainnet.boba.network/`,
      MM_Label:         `Mainnet`,
      addressManager:   `0x8376ac6C3f73a25Dd994E0b0669ca7ee0C02F089`,
      L1: {
        name: "Mainnet",
        chainId: 1,
        chainIdHex: '0x1',
        rpcUrl: `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_ID}`,
        blockExplorer: `https://api.etherscan.io/api?module=account&action=txlist&startblock=0&endblock=99999999&sort=asc&apikey=${process.env.REACT_APP_ETHERSCAN_API}`,
        transaction: ` https://etherscan.io/tx/`,
      },
      L2: {
        name: "BOBA L2",
        chainId: 288,
        chainIdHex: '0x120',
        rpcUrl: `https://mainnet.boba.network`,
        blockExplorer: `https://bobascan.com/`,
        transaction: `https://bobascan.com/tx/`,
      },
      payloadForL1SecurityFee: {
        from: '0x5E7a06025892d8Eef0b5fa263fA0d4d2E5C3B549',
        to: '0x17C83E2B96ACfb5190d63F5E46d93c107eC0b514',
        value: '0x38d7ea4c68000',
        data:
          '0x7ff36ab5000000000000000000000000000000000000000000000000132cc41aecbfbace00000000000000000000000000000000000000000000000000000000000000800000000000000000000000005e7a06025892d8eef0b5fa263fa0d4d2e5c3b54900000000000000000000000000000000000000000000000000000001c73d14500000000000000000000000000000000000000000000000000000000000000002000000000000000000000000deaddeaddeaddeaddeaddeaddeaddeaddead00000000000000000000000000005008f837883ea9a07271a1b5eb0658404f5a9610',
      },
      payloadForFastDepositBatchCost: {
        from: '0x5E7a06025892d8Eef0b5fa263fA0d4d2E5C3B549',
        to: '0x1A26ef6575B7BBB864d984D9255C069F6c361a14',
        value: '0x038d7ea4c68000',
        data:
          '0xa44c80e30000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000042bbfa2e77757c645eeaad1655e0911a7553efbc0000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000038d7ea4c68000'
      },
      gasEstimateAccount: `0x1FE67D4a3c73abAa0703a70bAbf0fB81aC572bd2`
    }
  }
} else if (process.env.REACT_APP_CHAIN === 'bobaBase') {
  NETWORK = {
    bobaBase: {
      OMGX_WATCHER_URL: `https://api-watcher.bobabase.boba.network/`,
      MM_Label:         `BobaBase`,
      addressManager:   `0xF8d0bF3a1411AC973A606f90B2d1ee0840e5979B`,
      L1: {
        name: "MoonBase",
        chainId: 1287,
        chainIdHex: '0x507',
        rpcUrl: `https://rpc.api.moonbase.moonbeam.network`,
        blockExplorer: `https://api-moonbase.moonscan.io/api?module=account&action=txlist&startblock=0&endblock=99999999&sort=asc&apikey=${process.env.REACT_APP_ETHERSCAN_API}`,
        transaction: `https://moonbase.moonscan.io/tx/`,
        symbol: process.env.REACT_APP_L1_NATIVE_TOKEN_SYMBOL,
      },
      L2: {
        name: "BobaBase",
        chainId: 1297,
        chainIdHex: '0x511',
        rpcUrl: `https://bobabase.boba.network`,
        blockExplorer: `https://blockexplorer.bobabase.boba.network/`,
        transaction: `https://blockexplorer.bobabase.boba.network/tx/`,
      },
      gasEstimateAccount: `0xdb5a187FED81c735ddB1F6E47F28f2A5F74639b2`,
      twitterFaucetPromotionText: `https://twitter.com/intent/tweet?text=I%27m%20developing%20on%20Bobabase%20for%20Moonbeam%20`
    }
 }
} else if (process.env.REACT_APP_CHAIN === 'bobaBeam') {
  NETWORK = {
    bobaBeam: {
      OMGX_WATCHER_URL: `https://api-watcher.bobabeam.boba.network/`,
      MM_Label:         `bobaBeam`,
      addressManager:   `0x564c10A60af35a07f0EA8Be3106a4D81014b21a0`,
      L1: {
        name: "MoonBeam",
        chainId: 1284,
        chainIdHex: '0x504',
        rpcUrl: `https://rpc.api.moonbeam.network`,
        blockExplorer: `https://api-moonbeam.moonscan.io/api?module=account&action=txlist&startblock=0&endblock=99999999&sort=asc&apikey=${process.env.REACT_APP_ETHERSCAN_API}`,
        transaction: `https://moonscan.io/tx/`,
        symbol: process.env.REACT_APP_L1_NATIVE_TOKEN_SYMBOL,
      },
      L2: {
        name: "BobaBeam",
        chainId: 1294,
        chainIdHex: '0x50E',
        rpcUrl: `https://bobabeam.boba.network`,
        blockExplorer: `https://blockexplorer.bobabeam.boba.network/`,
        transaction: `https://blockexplorer.bobabeam.boba.network/tx/`,
      },
      gasEstimateAccount: `0xdb5a187FED81c735ddB1F6E47F28f2A5F74639b2`,
      twitterFaucetPromotionText: `https://twitter.com/intent/tweet?text=I%27m%20developing%20on%20Bobabeam%20for%20Moonbeam%20`
    }
 }
} else if (process.env.REACT_APP_CHAIN === 'bobaOperaTestnet') {
  NETWORK = {
    bobaOperaTestnet: {
      OMGX_WATCHER_URL: `https://api-watcher.testnet.bobaopera.boba.network/`,
      MM_Label:         `bobaOperaTestnet`,
      addressManager:   `0x12ad9f501149D3FDd703cC10c567F416B7F0af8b`,
      L1: {
        name: "Fantom Testnet",
        chainId: 4002,
        chainIdHex: '0xFA2',
        rpcUrl: `https://rpc.testnet.fantom.network`,
        blockExplorer: `https://api-testnet.ftmscan.com/api?module=account&action=txlist&startblock=0&endblock=99999999&sort=asc&apikey=${process.env.REACT_APP_ETHERSCAN_API}`,
        transaction: `https://testnet.ftmscan.com/tx/`,
        symbol: process.env.REACT_APP_L1_NATIVE_TOKEN_SYMBOL,
      },
      L2: {
        name: "BobaOpera Testnet",
        chainId: 4051,
        chainIdHex: '0xFD3',
        rpcUrl: `https://testnet.bobaopera.boba.network`,
        blockExplorer: `https://blockexplorer.testnet.bobaopera.boba.network/`,
        transaction: `https://blockexplorer.testnet.bobaopera.boba.network/tx/`,
      },
      gasEstimateAccount: `0xdb5a187FED81c735ddB1F6E47F28f2A5F74639b2`,
      twitterFaucetPromotionText: `https://twitter.com/intent/tweet?text=I%27m%20developing%20on%20Bobaopera%20Testnet%20for%20Fantom%20`
    }
 }
} else if (process.env.REACT_APP_CHAIN === 'bobaFuji') {
  NETWORK = {
    bobaFuji: {
      OMGX_WATCHER_URL: `https://api-watcher.testnet.avax.boba.network/`,
      MM_Label:         `bobaAvalancheTestnet`,
      addressManager:   `0xcE78de95b85212BC348452e91e0e74c17cf37c79`,
      L1: {
        name: "Avalanche Testnet",
        chainId: 43113,
        chainIdHex: '0xA869',
        rpcUrl: `https://api.avax-test.network/ext/bc/C/rpc`,
        blockExplorer: `https://api-testnet.snowtrace.io/api?module=account&action=txlist&startblock=0&endblock=99999999&sort=asc&apikey=${process.env.REACT_APP_ETHERSCAN_API}`,
        transaction: `https://testnet.snowtrace.io/tx/`,
        symbol: process.env.REACT_APP_L1_NATIVE_TOKEN_SYMBOL,
      },
      L2: {
        name: "Boba Avalanche Testnet",
        chainId: 4328,
        chainIdHex: '0x10E8',
        rpcUrl: `https://testnet.avax.boba.network`,
        blockExplorer: `https://blockexplorer.testnet.avax.boba.network/`,
        transaction: `https://blockexplorer.testnet.avax.boba.network/tx/`,
      },
      gasEstimateAccount: `0xdb5a187FED81c735ddB1F6E47F28f2A5F74639b2`,
      twitterFaucetPromotionText: `https://twitter.com/intent/tweet?text=I%27m%20developing%20on%20Boba%20Avalanche%20Testnet%20for%20Avalanche%20`
    }
 }
} else if (process.env.REACT_APP_CHAIN === 'bobaAvax') {
  NETWORK = {
    bobaAvax: {
      OMGX_WATCHER_URL: `https://api-watcher.avax.boba.network/`,
      MM_Label:         `Boba Avalanche Mainnet`,
      addressManager:   `0x00220f8ce1c4be8436574e575fE38558d85e2E6b`,
      L1: {
        name: "Avalanche Mainnet",
        chainId: 43114,
        chainIdHex: '0xA86A',
        rpcUrl: `https://api.avax.network/ext/bc/C/rpc`,
        blockExplorer: `https://api.snowtrace.io/api?module=account&action=txlist&startblock=0&endblock=99999999&sort=asc&apikey=${process.env.REACT_APP_ETHERSCAN_API}`,
        transaction: `https://snowtrace.io/tx/`,
        symbol: process.env.REACT_APP_L1_NATIVE_TOKEN_SYMBOL,
      },
      L2: {
        name: "Boba Avalanche Mainnet",
        chainId: 43288,
        chainIdHex: '0xA918',
        rpcUrl: `https://avax.boba.network`,
        blockExplorer: `https://blockexplorer.avax.boba.network/`,
        transaction: `https://blockexplorer.avax.boba.network/tx/`,
      },
      gasEstimateAccount: `0xdb5a187FED81c735ddB1F6E47F28f2A5F74639b2`,
      twitterFaucetPromotionText: `https://twitter.com/intent/tweet?text=I%27m%20developing%20on%20Boba%20Avalanche%20Testnet%20for%20Avalanche%20`
    }
 }
} else if (process.env.REACT_APP_CHAIN === 'bobaBnbTestnet') {
  NETWORK = {
    bobaBnbTestnet: {
      OMGX_WATCHER_URL: `https://api-watcher.testnet.bnb.boba.network/`,
      MM_Label:         `bobaBnbTestnet`,
      addressManager:   `0xAee1fb3f4353a9060aEC3943fE932b6Efe35CdAa`,
      L1: {
        name: "BNB Testnet",
        chainId: 97,
        chainIdHex: '0x61',
        rpcUrl: `https://data-seed-prebsc-1-s1.binance.org:8545`,
        blockExplorer: `https://api-testnet.bscscan.com/api?module=account&action=txlist&startblock=0&endblock=99999999&sort=asc&apikey=${process.env.REACT_APP_ETHERSCAN_API}`,
        transaction: `https://https://testnet.bscscan.com//tx/`,
        symbol: process.env.REACT_APP_L1_NATIVE_TOKEN_SYMBOL,
      },
      L2: {
        name: "Boba BNB Testnet",
        chainId: 9728,
        chainIdHex: '0x2600',
        rpcUrl: `https://testnet.bnb.boba.network`,
        blockExplorer: `https://blockexplorer.testnet.bnb.boba.network/`,
        transaction: `https://blockexplorer.testnet.bnb.boba.network/tx/`,
      },
      gasEstimateAccount: `0xdb5a187FED81c735ddB1F6E47F28f2A5F74639b2`,
      twitterFaucetPromotionText: `https://twitter.com/intent/tweet?text=I%27m%20developing%20on%20Boba%20BNB%20Testnet%20for%20BNB%20`
    }
 }
} else if (process.env.REACT_APP_CHAIN === 'local') {
  NETWORK = {
    local: {
      OMGX_WATCHER_URL: null, //Does not exist on local
      MM_Label:         `Local`,
      addressManager:   `0x5FbDB2315678afecb367f032d93F642f64180aa3`,
      L1: {
        name: "Local L1",
        chainId: 31337,
        chainIdHex: '0x7A69',
        rpcUrl: `http://${window.location.hostname}:9545`,
        blockExplorer: null, //does not exist on local
      },
      L2: {
        name: "Local L2",
        chainId: 31338,
        chainIdHex: '0x7A6A',
        rpcUrl: `http://${window.location.hostname}:8545`,
        blockExplorer: null, //does not exist on local
      },
    }
  }
}

const BaseServices = {
  WALLET_SERVICE:   `https://api-service.boba.network/`,
  //relevant to local?
  SERVICE_OPTIMISM_API_URL: `https://zlba6djrv6.execute-api.us-west-1.amazonaws.com/prod/`,
  //relevant to local?
  WEBSOCKET_API_URL: `wss://d1cj5xnal2.execute-api.us-west-1.amazonaws.com/prod`,
  //Coing gecko url
  COIN_GECKO_URL: `https://api.coingecko.com/api/v3/`,
  //ETH gas station
  ETH_GAS_STATION_URL: `https://ethgasstation.info/`,
  // Mainnet meta transaction
  BOBABEAM_META_TRANSACTION: `https://api-meta-transaction.bobabeam.boba.network/`,
  // Testnet meta transaction
  BOBABASE_META_TRANSACTION: `https://api-meta-transaction.bobabase.boba.network/`,
  // Mainnet meta transaction
  BOBAOPERA_META_TRANSACTION: `https://api-meta-transaction.bobaopera.boba.network/`,
  // Testnet meta transaction
  BOBAOPERATESTNET_META_TRANSACTION: `https://api-meta-transaction.testnet.bobaopera.boba.network/`,
  // Mainnet meta transaction
  BOBAAVAX_META_TRANSACTION: `https://api-meta-transaction.avax.boba.network/`,
  // Testnet meta transaction
  BOBAFUJI_META_TRANSACTION: `https://api-meta-transaction.testnet.avax.boba.network/`,
  // Mainnet meta transaction
  BOBABNB_META_TRANSACTION: `https://api-meta-transaction.bnb.boba.network/`,
  // Testnet meta transaction
  BOBABNBTESTNET_META_TRANSACTION: `https://api-meta-transaction.testnet.bnb.boba.network/`,
}

export function getNetwork () {
  return NETWORK
}

export function getBaseServices () {
  return BaseServices
}

export function getMaxHealthBlockLag () {
  return process.env.REACT_APP_MAX_HEALTH_BLOCK_LAG || 100
}
