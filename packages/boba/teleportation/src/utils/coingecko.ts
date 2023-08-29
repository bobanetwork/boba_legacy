import axios from 'axios'
import {Disbursement, SupportedAssets} from "./types";

export interface ITokenUSDPrice {
  /// @dev tokenId can be either coinGeckoAssetID or contractAddress
  [token: string]: {
    "usd": number
  },
}

/*
{ "0x0000": "usd per token$" OR ALREADY FOR FULL DISBURSEMENT }
*/

export const getUsdValueOfTokenViaDisbursements = async (ownSupportedAssets: SupportedAssets, disbursements: Disbursement[]): Promise<ITokenUSDPrice|undefined> => {
  try {
    const assetTickers = new Set<string>(disbursements.map(d => ownSupportedAssets[d.token]))
    const assetUsd = await getUsdValueOfTokenViaIDs(Array.from(assetTickers.values()))

    let usdPricePerToken = {}
    for (const addr in ownSupportedAssets) {
      usdPricePerToken[addr] = assetUsd[ownSupportedAssets[addr]]
    }

    return usdPricePerToken
  } catch (err) {
    // Fail silently, non mandatory check
    console.error(err)
  }
}

export const getUsdValueOfTokenViaIDs = async (tokenIds: string[]): Promise<ITokenUSDPrice|undefined> => {
  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds.join(',')}&vs_currencies=usd`)
    return response.data as ITokenUSDPrice;
  } catch (err) {
    // Fail silently, non mandatory check
    console.error(err)
  }
}
