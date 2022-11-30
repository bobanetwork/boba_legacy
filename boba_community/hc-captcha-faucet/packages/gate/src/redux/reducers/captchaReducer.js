import initialState from '../initialState';

const CAPTCHA_INITIAL_STATE = initialState.captcha;

export const captcha = (state = CAPTCHA_INITIAL_STATE, action = {}) => {
    switch(action.type) {
        case 'GET_CAPTCHA_IMAGE':
            return {
                ...state,
                loading: true,
            }
        case 'GET_CAPTCHA_IMAGE_SUCCESS':
            return {
                ...state, ...action.payload,
                loading: false,
            }
        case 'GET_CAPTCHA_IMAGE_FAILURE':
            return {
                ...state,
                loading: false,
            }
        default:
            return state;
    }
}