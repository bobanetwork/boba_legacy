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

// we use BigNumber here for decimal support
import BigNumber from 'bignumber.js';

export function logAmount(amount, power, truncate = 0) {

  const x = new BigNumber(amount);
  const exp = new BigNumber(10).pow(power);

  const calculated = x.div(exp);

  if (truncate > 0)
    return calculated.toFixed(truncate);
  else
    return calculated.toFixed();
}

/*Takes a value such as 3.92 and converts it into
a BigNumber in wei

Duplicates

ethers.utils.parseUnits( valueString , decimalsOrUnitName )   =>   BigNumber
*/

export function powAmount(amount, decimals) {

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

const amountToUseConfig = {
  'ETH': { provider: 'ethereum' },
  'BOBA': { provider: 'boba-network' },
  'OLO': { provider: 'oolongswap' },
  'OMG': { provider: 'omisego' },
  'USDC': { provider: 'usd-coin' },
  'AVAX': { provider: 'avalanche-2' },
  'FTM': { provider: 'fantom' },
  'BNB': { provider: 'binancecoin' },
  'tBNB': { provider: 'binancecoin' },
  'DEV': { provider: 'moonbeam' },
  'GLMR': { provider: 'moonbeam' }
}

export function amountToUsd(amount, lookupPrice, token) {
  const { symbol } = token;
  const currencyInfo = amountToUseConfig[symbol];
  if (!!currencyInfo && !!lookupPrice[currencyInfo.provider]) {
    return amount * lookupPrice[currencyInfo.provider].usd;
  } else if (!!lookupPrice[symbol.toLowerCase()]) {
    return amount * lookupPrice[symbol.toLowerCase()].usd;
  } else {
    return 0;
  }
}


export const formatLargeNumber = (num) => {
  const exp = Math.floor(Math.log10(Math.abs(num)) / 3);
  const scaledNum = Math.abs(num) / Math.pow(10, exp * 3);
  const formattedNumber = scaledNum.toFixed(2);
  const exponent = ['', 'k', 'M', 'B', 'T'][exp] || '';
  return isNaN(formattedNumber) ? '0' : formattedNumber + exponent;
}