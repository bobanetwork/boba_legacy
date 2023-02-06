import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import store from './redux/configureStore';

import Main from './containers/Main/Main';

if (window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false;
}

ReactDOM.render(
  <Provider store={store}>
    <Main />
  </Provider>,
  document.getElementById('root')
);