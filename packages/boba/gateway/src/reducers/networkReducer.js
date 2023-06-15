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

import { NETWORK, NETWORK_TYPE } from "util/network/network.util"

/**
 * network : ethereum, bnb, fantom, avax
 * networkType : mainnet, testnet.
 **/

/**
 * NOTE:
 * 3. enable switch once selected !== current.
 * 4. on selection dispatch event.
 * 5. on switch click dispatch event. and reload.
 */

const initialState = {
  network: NETWORK.ETHEREUM,
  networkIcon: 'ethereum',
  networkType: NETWORK_TYPE.MAINNET,
  name: {},
  activeNetworkIcon: 'ethereum',
  activeNetwork: NETWORK.ETHEREUM,
  activeNetworkType: NETWORK_TYPE.MAINNET,
  activeNetworkName: {},
}

function networkReducer(state = initialState, action) {
  switch (action.type) {
    case 'NETWORK/SET': {
      const {
        network,
        networkType,
        networkIcon,
        name
      } = action.payload;
      return {
        ...state,
        network,
        networkIcon,
        networkType,
        name
      }
    }
    case 'NETWORK/SET/ACTIVE':{
      const {
        network: activeNetwork,
        networkType: activeNetworkType,
        networkIcon: activeNetworkIcon,
        name: activeNetworkName
      } = state;
      return {
        ...state,
        activeNetwork,
        activeNetworkType,
        activeNetworkIcon,
        activeNetworkName
      }
    }
    default:
      return state
  }
}

export default networkReducer
