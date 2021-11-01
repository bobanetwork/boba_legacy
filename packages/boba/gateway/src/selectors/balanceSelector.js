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

export function selectlayer1Balance (state) {
  return state.balance.layer1;
}

export function selectlayer2Balance (state) {
  return state.balance.layer2;
}

export function selectL1LPBalanceString (state) {
  return state.balance.l1LpBalanceWeiString;
}

export function selectL1FeeRate (state) {
  return state.balance.l1FeeRate;
}

export function selectL1GasFee (state) {
  return state.balance.l1GasFee;
}

export function selectL2FeeBalance (state) {
  return state.balance.l2FeeBalance;
}
