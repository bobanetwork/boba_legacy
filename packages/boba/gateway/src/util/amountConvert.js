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

// we use BigNumber here for decimal support
import BigNumber from 'bignumber.js';

export function logAmount (amount, power, truncate = 0) {

  const x = new BigNumber(amount);
  const exp = new BigNumber(10).pow(power);

  const calculated = x.div(exp);

  if(truncate > 0)
  	return calculated.toFixed(truncate);
  else
  	return calculated.toFixed();
}

/*Takes a value such as 3.92 and converts it into
a BigNumber in wei

Duplicates

ethers.utils.parseUnits( valueString , decimalsOrUnitName )   =>   BigNumber
*/

export function powAmount (amount, decimals) {

  const x = new BigNumber(amount)
  const exp = new BigNumber(10).pow(decimals)

  const calculated = x.multipliedBy(exp)
  return calculated.toFixed(0)
}

/* more clearly named version of this */
export function toWei_String(amount, decimals) {

  const x = new BigNumber(amount)
  const exp = new BigNumber(10).pow(decimals)

  const calculated = x.multipliedBy(exp)
  return calculated.toFixed(0)
}

export function amountToUsd(amount, lookupPrice, token) {
  if (token.symbol === 'ETH' && !!lookupPrice['ethereum']) {
    return amount * lookupPrice['ethereum'].usd
  } else if (token.symbol === 'BOBA' && !!lookupPrice[ 'boba-network' ]) {
    return amount * lookupPrice['boba-network'].usd
  } else if (token.symbol === 'OLO' && !!lookupPrice[ 'oolongswap' ]) {
    return amount * lookupPrice['oolongswap'].usd
  } else if (token.symbol === 'OMG' && !!lookupPrice[ 'omisego' ]) {
    return amount * lookupPrice['omisego'].usd
  } else if (token.symbol === 'USDC' && !!lookupPrice[ 'usd-coin' ]) {
    return amount * lookupPrice['usd-coin'].usd 
  } else if (!!lookupPrice[ token.symbol.toLowerCase() ]) {
    return amount * lookupPrice[token.symbol.toLowerCase()].usd
  } else {
    return 0
  }
}
