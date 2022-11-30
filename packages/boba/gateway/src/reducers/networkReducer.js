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

import { NETWORK, NETWORK_TYPE } from "util/network.util"

/**
 * NOTE:
 * 1. selected networkType, network.
 * 2. current networkType, network.
 * 3. enable switch once selected !== current.
 * 4. on selection dispatch event.
 * 5. on switch click dispatch event. and reload.
 *
 */

const initialState = {
  network: NETWORK.ETHEREUM,
  networkType: NETWORK_TYPE.MAINNET
}

function networkReducer(state = initialState, action) {
  switch (action.type) {
    case 'SETUP/NETWORK/SET':
      const {
        network,
        networkType
      } = action.payload;
      return {
        ...state,
        network,
        networkType
      }
    default:
      return state
  }
}

export default networkReducer

