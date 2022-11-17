
// local, rinkeby, mainnet...
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
