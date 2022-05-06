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

import { createAction } from './createAction'
import networkService from 'services/networkService'

import store from 'store'

export function getNFTs () {
  const state = store.getState()
  return state.nft.list
}

export async function addNFT ( NFT ) {

  const info = {
    UUID: NFT.UUID,
    address: NFT.address,
    name:  NFT.name,
    tokenID: NFT.tokenID,
    symbol:  NFT.symbol,
    url: NFT.url,
    meta: NFT.meta,
    account: NFT.account,
    network: NFT.network,
    layer: NFT.layer
  }

  store.dispatch({
    type: 'NFT/ADD/SUCCESS',
    payload: info
  })

  return info

}

export async function addMonster ( monster ) {
  store.dispatch({
    type: 'MONSTER/INFO/SUCCESS',
    payload: monster
  })
}

export function getMonsterInfo() {
  return createAction('MONSTER/NUMBER', () =>
    networkService.checkMonster()
  )
}

export function removeNFT( UUID ) {
  return createAction('NFT/REMOVE', ()=>{
    return UUID
  })
}
