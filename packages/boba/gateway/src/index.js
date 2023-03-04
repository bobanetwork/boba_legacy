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

import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { store, persistor } from 'store'
import {PersistGate} from 'redux-persist/integration/react'
import App from 'layout'
import './index.scss'
import SentryWrapper from 'components/SentryWrapper/SentryWrapper'

// https://docs.metamask.io/guide/ethereum-provider.html#ethereum-autorefreshonnetworkchange
if (window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false
}

ReactDOM.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <SentryWrapper>
        <App />
      </SentryWrapper>
    </PersistGate>
  </Provider>,
  document.getElementById('root')
)
