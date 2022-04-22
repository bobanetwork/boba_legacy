import initialState from '../initialState';

const WALLET_INITIAL_STATE = initialState.wallet;

export const wallet = (state = WALLET_INITIAL_STATE, action = {}) => {
    switch(action.type) {
        case 'WALLET_CONNECT':
            return {
                ...state,
                connected: false,
                balance: 0,
                balanceInWei: '0',
                connectedError: false,
            }
        case 'WALLET_CONNECT_SUCCESS':
            return {
                ...state,
                connected: true,
                ...action.payload
            }
        case 'WALLET_CONNECT_FAILURE':
            return {
                ...state,
                connected: false,
                balance: 0,
                balanceInWei: '0',
                connectedError: true,
            }
        default:
            return state;
    }
}