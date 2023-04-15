/*
  OmgX - A Privacy-Preserving Marketplace
  OmgX uses Fully Homomorphic Encryption to make markets fair. 
  Copyright (C) 2021 Enya Inc. Palo Alto, CA

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

type ChartToCodeType = (str: string, index: number) => number
const charToCode: ChartToCodeType = (str, index) => {
  if (index >= str.length) {
    return 0
  }
  return str.toLowerCase().charCodeAt(index) - 97 + 1
}

type CodeToCharType = (int: number) => string
const codeToChar: CodeToCharType = (int) => {
  if (int === 0) {
    return ''
  }
  return String.fromCharCode(int - 1 + 97).toUpperCase()
}

type CoinToArrayType = (name: string) => number[]
export const coinToArray: CoinToArrayType = (name) => {
  // the length of the name should be 3 or 4
  if (name.length < 3 || name.length > 4) {
    return []
  }

  const nameArray: number[] = []
  for (let i = 0; i < 4; i++) {
    nameArray.push(charToCode(name, i))
  }

  return nameArray
}

type ArrayToCoinType = (array: number[]) => string
export const arrayToCoin: ArrayToCoinType = (array) => {
  let coin = ''
  array.forEach((e) => (coin += codeToChar(e)))
  return coin
}
