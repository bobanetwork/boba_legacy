import initialState from '../initialState';

const NETWORK_INITIAL_STATE = initialState.network;

export const network = (state = NETWORK_INITIAL_STATE, action = {}) => {
    switch(action.type) {
        case 'UPDATE_NETWORK':
            return state
        case 'UPDATE_NETWORK_SUCCESS':
            return {
                ...state, ...action.payload
            }
        case 'UPDATE_NETWORK_FAILURE':
            return state
        default:
            return state;
    }
}