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

//do not deal with account switching right now
//with cache - ToDo
//need to keep track of wgich account the cache is for, otherwise incorrect NFTs will be shown

//localStorage.removeItem("nftList")
type NFTState = {
  list: Record<string, unknown>
  monsterNumber: number
  monsterInfo: Record<string, unknown>
}

type NFTAction = {
  type: string
  payload: any
}

let nftList: any = localStorage.getItem('nftList')

if (nftList) {
  nftList = JSON.parse(nftList)
  console.log('NFT List Cache:', nftList)
}

const initialState: NFTState = {
  list: nftList ? nftList : {},
  monsterNumber: 0,
  monsterInfo: {},
}

const actionHandlers: Record<
  string,
  (state: NFTState, action: NFTAction) => NFTState
> = {
  'NFT/ADD/SUCCESS': (state, action) => {
    const newList = {
      ...state.list,
      [action.payload.UUID]: action.payload,
    }

    localStorage.setItem('nftList', JSON.stringify(newList))

    return {
      ...state,
      list: newList,
    }
  },
  'MONSTER/INFO/SUCCESS': (state, action) => ({
    ...state,
    monsterInfo: action.payload,
  }),
  'MONSTER/NUMBER/SUCCESS': (state, action) => ({
    ...state,
    monsterNumber: action.payload,
  }),
  'NFT/REMOVE/SUCCESS': (state, action) => {
    const listN = { ...state.list }
    delete listN[action.payload]

    localStorage.setItem('nftList', JSON.stringify(listN))

    return {
      ...state,
      list: listN,
    }
  },
}

const nftReducer = (
  state: NFTState = initialState,
  action: NFTAction
): NFTState => {
  const handler = actionHandlers[action.type]
  return handler ? handler(state, action) : state
}

export default nftReducer
