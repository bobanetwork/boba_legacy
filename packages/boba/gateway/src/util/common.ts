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

type TokenSymbolType = {
  tokenSymbol: string
}
type ComparatorType = (a: TokenSymbolType, b: TokenSymbolType) => -1 | 0 | 1

const comparator: ComparatorType = (a, b) => {
  if (a.tokenSymbol < b.tokenSymbol) {
    return -1
  }

  if (a.tokenSymbol > b.tokenSymbol) {
    return 1
  }

  return 0
}

export const sortRawTokens = (tokens: any) => {
  //change any for tokens type after we create the token type
  const start = tokens
    .filter((d: any) => ['ETH', 'BOBA', 'OMG'].includes(d.tokenSymbol))
    .sort(comparator)

  const last = tokens
    .filter((d: any) => !['ETH', 'BOBA', 'OMG'].includes(d.tokenSymbol))
    .sort(comparator)

  return [...start, ...last]
}
