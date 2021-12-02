/*
Copyright 2019-present OmiseGO Pte Ltd

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

let NETWORKS

if (process.env.REACT_APP_CHAIN === 'rinkeby') {
  NETWORKS = {
    rinkeby: {
      OMGX_WATCHER_URL: `https://api-watcher.rinkeby.boba.network/`,
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
        blockExplorer: `https://blockexplorer.rinkeby.boba.network/`,
        transaction: `https://blockexplorer.rinkeby.boba.network/tx/`
      }
    }
  }
} else if (process.env.REACT_APP_CHAIN === 'mainnet') {
  NETWORKS = {
    mainnet: {
      OMGX_WATCHER_URL: `https://api-watcher.mainnet.boba.network/`,
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
        blockExplorer: `https://blockexplorer.boba.network/`,
        transaction: `https://blockexplorer.boba.network/tx/`,
      }
    }
  }
} else if (process.env.REACT_APP_CHAIN === 'local') {
  NETWORKS = {
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
}

export function getAllNetworks () {
  return NETWORKS
}

export function getBaseServices () {
  return BaseServices
}
