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

import networkService from 'services/networkService'
import { createAction } from './createAction'
import store from 'store'

export function getNFTs () {
  const state = store.getState()
  return state.nft.list;
}

export function getNFTContracts () {
  const state = store.getState()
  return state.nft.contracts
}

export async function addNFT ( NFT ) {
  
  const state = store.getState()
  const UUID = NFT.UUID

  //if we already have added it, no need to add again
  if (state.nft.list[UUID]) {
    return state.nft.list[UUID]
  }
  
  const info = {
    UUID: NFT.UUID,
    address: NFT.address,
    name:  NFT.name, 
    tokenID: NFT.tokenID,
    symbol:  NFT.symbol,
    url: NFT.url,
    meta: NFT.meta
  }

  store.dispatch({
    type: 'NFT/ADDNFT/SUCCESS',
    payload: info
  })

  return info

}

export function addNFTContract( contactAddress ) {
  return createAction('NFT/ADDCONTRACT', ()=>{return networkService.addNFTContract( contactAddress )})
}

export function removeNFTContract( contactAddress ) {
  return createAction('NFT/REMOVECONTRACT', ()=>{return contactAddress})
}