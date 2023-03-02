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

import {
  MAX_HEALTH_BLOCK_LAG,
} from './constant'

const BaseServices = {
  WALLET_SERVICE: `https://api-service.boba.network/`,
  //Coing gecko url
  COIN_GECKO_URL: `https://api.coingecko.com/api/v3/`,
  //ETH gas station
  ETH_GAS_STATION_URL: `https://ethgasstation.info/`,
  // Mainnet meta transaction
  MAINNET_META_TRANSACTION: `https://api-meta-transaction.mainnet.boba.network/`,
  // goerli meta transaction
  GOERLI_META_TRANSACTION: `https://api-meta-transaction.goerli.boba.network/`,
}

export function getBaseServices() {
  return BaseServices
}

export function getMaxHealthBlockLag() {
  return MAX_HEALTH_BLOCK_LAG || 100
}
