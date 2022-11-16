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

// are we connected to an account - e.g. metamask?
export function selectAccountEnabled () {
  return function (state) {
    return state.setup['accountEnabled']
  }
}

export function selectWalletAddress () {
  return function (state) {
    return state.setup['walletAddress']
  }
}

// do we have basic providers?
export function selectBaseEnabled () {
  return function (state) {
    return state.setup['baseEnabled']
  }
}

// local, goerli, mainnet...
export function selectNetwork () {
  return function (state) {
    return state.setup['network']
  }
}

export function selectLayer () {
  return function (state) {
    return state.setup['netLayer']
  }
}

export function selectConnectETH () {
  return function (state) {
    return state.setup['connectETH']
  }
}

export function selectConnectBOBA () {
  return function (state) {
    return state.setup['connectBOBA']
  }
}

export function selectConnect () {
  return function (state) {
    return state.setup['connect']
  }
}

export function selectJustSwitchedChain () {
  return function (state) {
    return state.setup['justSwitchedChain']
  }
}

export function selectBobaFeeChoice () {
  return function (state) {
    return state.setup['bobaFeeChoice']
  }
}

export function selectBobaPriceRatio () {
  return function (state) {
    return state.setup['bobaFeePriceRatio']
  }
}

export function selectMonster () {
  return function (state) {
    return state.nft['monsterNumber']
  }
}

export function selectMonsterInfo () {
  return function (state) {
    return state.nft['monsterInfo']
  }
}

export function selectCurrentAppChain() {
  return function (state) {
    return state.setup['appChain']
  }
}
