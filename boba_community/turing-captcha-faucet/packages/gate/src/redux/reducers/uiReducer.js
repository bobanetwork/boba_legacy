import initialState from '../initialState';

const UI_INITIAL_STATE = initialState.ui;

export const ui = (state = UI_INITIAL_STATE, action = {}) => {
    switch(action.type) {
        case 'UI/ALERT/UPDATE':
            return {
                ...state, alert: action.payload
            }
        case 'UI/ERROR/UPDATE':
            return {
                ...state, error: action.payload
            }
        default:
            return state;
    }
}