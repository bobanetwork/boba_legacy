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

//localStorage.removeItem("activePage")

let activePage = localStorage.getItem("activePage")

if (activePage) {
  activePage = JSON.parse(activePage)
}

const initialState = {
  theme: 'dark',
  page: activePage ? activePage : 'Wallet',
  depositModal: false,
  depositBatchModal: false,
  transferModal: false,
  transferNFTModal: false,
  exitModal: false,
  bridgeTypeSwitch: false,
  tokenPicker: false,
  transferPending: false,
  mergeModal: false,
  confirmationModal: false,
  wrongNetworkModal: false,
  ledgerConnectModal: false,
  addNewTokenModal: false,
  farmDepositModal: false,
  farmWithdrawModal: false,
  transferDaoModal: false,
  delegateDaoModal: false,
  delegateDaoXModal: false,
  newProposalModal: false,
  ledger: false,
  alert: null,
  error: null,
  activeHistoryTab: 'All',
  activeDataTab: 'Seven Day Queue',
};

function uiReducer (state = initialState, action) {
  switch (action.type) {
    case 'UI/THEME/UPDATE':
      return { ...state, theme: action.payload }
    case 'UI/PAGE/UPDATE':
      //save currently active page
      localStorage.setItem("activePage", JSON.stringify(action.payload))
      return {
        ...state,
        page: action.payload
      }
    case 'UI/MODAL/OPEN':
      return { ...state,
        [action.payload]: true,
        fast: action.fast,
        token: action.token,
        tokenIndex: action.tokenIndex,
      }
    case 'UI/MODAL/CLOSE':
      return { ...state, [action.payload]: false }
    case 'UI/ALERT/UPDATE':
      return { ...state, alert: action.payload }
    case 'UI/ERROR/UPDATE':
      return { ...state, error: action.payload }
    case 'UI/LEDGER/UPDATE':
      return { ...state, ledger: action.payload }
    case 'UI/HISTORYTAB/UPDATE':
      return { ...state, activeHistoryTab: action.payload }
    case 'UI/DATATAB/UPDATE':
      return { ...state, activeDataTab: action.payload }
    case 'UI/MODAL/DATA':
      let dataType = 'generic';
      if(action.payload.modal === 'confirmationModal') {
        dataType = 'cMD';
      }
      return { ...state,
        [dataType]: action.payload.data,
      }
    default:
      return state;
  }
}

export default uiReducer
