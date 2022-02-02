/*
Copyright 2019-present OmiseGO Pte Ltd

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

// do we have basic providers?
export function selectBaseEnabled () {
  return function (state) {
    return state.setup['baseEnabled']
  }
}

// local, rinkeby, mainnet...
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

export function selectJustSwitchedChain () {
  return function (state) {
    return state.setup['justSwitchedChain']
  }
}