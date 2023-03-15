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

import { combineReducers } from 'redux';

import loadingReducer from './loadingReducer'
import depositReducer from './depositReducer'
import transactionReducer from './transactionReducer'
import dataReducer from './dataReducer'
import statusReducer from './statusReducer'
import balanceReducer from './balanceReducer'
import queueReducer from './queueReducer'
import tokenReducer from './tokenReducer'
import nftReducer from './nftReducer'
import feeReducer from './feeReducer'
import uiReducer from './uiReducer'
import setupReducer from './setupReducer'
import notificationReducer from './notificationReducer'
import earnReduer from './earnReducer'
import lookupReducer from './lookupReducer'
import signatureReducer from './signatureReducer'
import daoReducer from './daoReducer'
import fixedReducer from './fixedReducer'
import verifierReducer from './verifierReducer';
import bridgeReducer from './bridgeReducer';
import veBobaReducer from './veBobaReducer';
import devToolsReducer from './devToolsReducer';
import networkReducer from './networkReducer';

const rootReducer = combineReducers({
  loading: loadingReducer,
  deposit: depositReducer,
  transaction: transactionReducer,
  data: dataReducer,
  signature: signatureReducer,
  status: statusReducer,
  balance: balanceReducer,
  queue: queueReducer,
  tokenList: tokenReducer,
  nft: nftReducer,
  fees: feeReducer,
  ui: uiReducer,
  setup: setupReducer,
  notification: notificationReducer,
  earn: earnReduer,
  lookup: lookupReducer,
  dao: daoReducer,
  fixed: fixedReducer,
  verifier: verifierReducer,
  bridge: bridgeReducer,
  veboba: veBobaReducer,
  devTools: devToolsReducer,
  network: networkReducer
})

export default rootReducer
