import { combineReducers } from 'redux'

import { wallet } from './walletReducer'
import { ui } from './uiReducer'
import { network } from './networkReducer'
import { captcha } from './captchaReducer'

const reducers = {
  wallet,
  ui,
  network,
  captcha
};

export default combineReducers(reducers);
