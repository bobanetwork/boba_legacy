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
type State = {
  theme: string
  depositModal: boolean
  depositBatchModal: boolean
  transferModal: boolean
  transferNFTModal: boolean
  exitModal: boolean
  bridgeTypeSwitch: boolean
  tokenPicker: boolean
  transferPending: boolean
  mergeModal: boolean
  confirmationModal: boolean
  wrongNetworkModal: boolean
  ledgerConnectModal: boolean
  addNewTokenModal: boolean
  EarnDepositModal: boolean
  EarnWithdrawModal: boolean
  transferDaoModal: boolean
  delegateDaoModal: boolean
  delegateDaoXModal: boolean
  newProposalModal: boolean
  walletSelectorModal: boolean
  CDMCompletionModal: boolean
  switchNetworkModal: boolean
  ledger: boolean | undefined
  alert: string | null | undefined
  error: string | null | undefined
  lock: string | null | undefined
  proposalId: string | null
  activeHistoryTab: string | undefined
  activeDataTab: string | undefined
  fast?: boolean
  token?: string
  tokenIndex?: number
  generic?: any
  cMD?: any
}

type ActionTypes =
  | 'UI/THEME/UPDATE'
  | 'UI/MODAL/OPEN'
  | 'UI/MODAL/CLOSE'
  | 'UI/ALERT/UPDATE'
  | 'UI/ERROR/UPDATE'
  | 'UI/LEDGER/UPDATE'
  | 'UI/HISTORYTAB/UPDATE'
  | 'UI/DATATAB/UPDATE'
  | 'UI/MODAL/DATA'

type Action = {
  type: ActionTypes
  payload: Partial<State> & {
    modal?: string
    data?: any
    fast?: boolean
    token?: string
    tokenIndex?: number
    lock?: string
    proposalId?: string
  }
}

const initialState = {
  theme: 'dark',
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
  EarnDepositModal: false,
  EarnWithdrawModal: false,
  transferDaoModal: false,
  delegateDaoModal: false,
  delegateDaoXModal: false,
  newProposalModal: false,
  walletSelectorModal: false,
  CDMCompletionModal: false,
  switchNetworkModal: false,
  ledger: false,
  alert: null,
  error: null,
  lock: null,
  proposalId: null,
  activeHistoryTab: 'All',
  activeDataTab: 'Seven Day Queue',
}

const actionHandlers: Record<string, (state: State, action: Action) => State> =
  {
    'UI/THEME/UPDATE': (state, action) => ({
      ...state,
      theme: action.payload.theme || '',
    }),
    'UI/MODAL/OPEN': (state, action) => {
      if (action.payload.modal) {
        return {
          ...state,
          [action.payload.modal]: true,
          fast: action.payload.fast,
          token: action.payload.token,
          tokenIndex: action.payload.tokenIndex,
          lock: action.payload.lock || null,
          proposalId: action.payload.proposalId || null,
        }
      }
      return state
    },
    'UI/MODAL/CLOSE': (state, action) => {
      if (action.payload.modal) {
        return {
          ...state,
          [action.payload.modal]: false,
        }
      }
      return state
    },
    'UI/MODAL/DATA': (state, action) => {
      let dataType = 'generic'
      if (action.payload.modal === 'confirmationModal') {
        dataType = 'cMD'
      }
      return {
        ...state,
        [dataType]: action.payload.data,
      }
    },
    'UI/ALERT/UPDATE': (state, action) => ({
      ...state,
      alert: action.payload.alert,
    }),
    'UI/ERROR/UPDATE': (state, action) => ({
      ...state,
      error: action.payload.error,
    }),
    'UI/LEDGER/UPDATE': (state, action) => ({
      ...state,
      ledger: action.payload.ledger,
    }),
    'UI/HISTORYTAB/UPDATE': (state, action) => ({
      ...state,
      activeHistoryTab: action.payload.activeHistoryTab,
    }),
    'UI/DATATAB/UPDATE': (state, action) => ({
      ...state,
      activeDataTab: action.payload.activeDataTab,
    }),
  }

const uiReducer = (state: State = initialState, action: Action): State => {
  const handler = actionHandlers[action.type]
  return handler ? handler(state, action) : state
}

export default uiReducer
