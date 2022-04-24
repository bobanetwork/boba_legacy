export function selectWalletConnectStatus (state) {
    return state.wallet.connected
}

export function selectWalletBalance(state) {
    return state.wallet.balance
}

export function selectWalletBalanceInWei(state) {
    return state.wallet.balanceInWei
}

export function selectWalletConnectedError(state) {
    return state.wallet.connectedError
}

export function selectWalletAccount (state) {
    return state.wallet.account
}