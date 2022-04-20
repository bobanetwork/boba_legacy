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

//do not deal with account switching right now
//with cache - ToDo
//need to keep track of wgich account the cache is for, otherwise incorrect NFTs will be shown

//localStorage.removeItem("nftList")

let nftList = localStorage.getItem("nftList")

if (nftList) {
  nftList = JSON.parse(nftList)
  console.log("NFT List Cache:",nftList)
}

const initialState = {
  list: nftList ? nftList : {},
  monsterNumber: 0,
  monsterInfo: {}
}

function nftReducer (state = initialState, action) {
  switch (action.type) {
    
    case 'NFT/ADD/SUCCESS':

      localStorage.setItem("nftList", JSON.stringify({
          ...state.list,
          [action.payload.UUID]: action.payload
        })
      )

      return { 
        ...state,
        list: {
          ...state.list,
          [action.payload.UUID]: action.payload
        } 
      }

    case 'MONSTER/INFO/SUCCESS':
      return { 
        ...state,
        monsterInfo: action.payload
      }

    case 'MONSTER/NUMBER/SUCCESS':
      return { 
        ...state,
        monsterNumber: action.payload
      }
      
    case 'NFT/REMOVE/SUCCESS':

      let listN = state.list
      delete listN[action.payload]
      
      localStorage.setItem("nftList", JSON.stringify(listN))

      return { 
        ...state,
        list: listN
      }

    default:
      return state
  }
}

export default nftReducer
