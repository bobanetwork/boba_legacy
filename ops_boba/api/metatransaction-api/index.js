import {
  rinkebyHandler,
  goerliHandler,
  mainnetHandler,
} from './metaTransaction_swapNativeTokenForBOBA'

import {
  rinkebyHandler as rinkebyHandlerFaucet,
  goerliHandler as goerliHandlerFaucet,
  mainnetHandler as mainnetHandlerFaucet,
} from './metaTransaction_getTestnetETH'

export {
  rinkebyHandler as rinkebySwapL2SecondaryFeeTokenForBOBA,
  mainnetHandler as mainnetSwapL2SecondaryFeeTokenForBOBA,
  rinkebyHandlerFaucet as rinkebyGetTestnetETH,
  goerliHandlerFaucet as goerliGetTestnetETH,
  mainnetHandlerFaucet as mainnetGetTestnetETH,
}
