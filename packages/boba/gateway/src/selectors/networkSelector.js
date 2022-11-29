
// local, goerli, mainnet...
export function selectNetwork () {
  return function (state) {
    return state.network['network']
  }
}

export function selectCurrentAppChain() {
  return function (state) {
    return state.network['appChain']
  }
}

export function selectActiveNetworkType() {
  return function (state) {
    return state.network['networkType']
  }
}
