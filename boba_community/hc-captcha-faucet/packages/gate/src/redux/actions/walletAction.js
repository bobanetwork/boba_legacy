import networkService from "../../network/networkService"

import { openError } from "./uiAction"

export const connectWalletBegin = data => ({
    type: 'WALLET_CONNECT'
})

export const connectWalletSuccess = data => ({
    type: 'WALLET_CONNECT_SUCCESS',
    payload: data
})

export const connectWalletFailure = data => ({
    type: 'WALLET_CONNECT_FAILURE'
})

export const connectWallet = () => async (dispatch) =>{
    dispatch(connectWalletBegin())
    const data = await networkService.connectWallet()
    if (data.error !== null) {
        dispatch(openError(data.error))
        dispatch(connectWalletFailure())
    } else {
        dispatch(connectWalletSuccess(data.payload))
    }
}