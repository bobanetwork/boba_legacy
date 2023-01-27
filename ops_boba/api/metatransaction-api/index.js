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
  rinkebyHandler as rinkebySwapBOBAForETH,
  goerliHandler as goerliSwapBOBAForETH,
  mainnetHandler as mainnetSwapBOBAForETH,
  rinkebyHandlerFaucet as rinkebyGetTestnetETH,
  goerliHandlerFaucet as goerliGetTestnetETH,
  mainnetHandlerFaucet as mainnetGetTestnetETH,
}
