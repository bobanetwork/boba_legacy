import { goerliHandler, mainnetHandler } from './metaTransaction_swapBOBAForETH'

import {
  testnetHandler as testnetAltL1Handler,
  mainnetHandler as mainnetAltL1Handler,
} from './metaTransaction_swapNativeTokenForBOBA'

import {
  goerliHandler as goerliHandlerFaucet,
  mainnetHandler as mainnetHandlerFaucet,
} from './metaTransaction_getTestnetETH'

export {
  goerliHandler as goerliSwapBOBAForETH,
  mainnetHandler as mainnetSwapBOBAForETH,
  testnetAltL1Handler as testnetSwapNativeTokenForBOBA,
  mainnetAltL1Handler as mainnetSwapNativeTokenForBOBA,
  goerliHandlerFaucet as goerliGetTestnetETH,
  mainnetHandlerFaucet as mainnetGetTestnetETH,
}
