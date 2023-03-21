import { providers } from 'ethers'

export const chainID: any = {
  moonbeam: {
    mainnet: {
      l1: 1284,
      l2: 1294,
    },
    testnet: {
      l1: 1287,
      l2: 1297,
    },
  },
}

export const getChainIDList = (
  network: string,
  layer: string
): Array<number> => {
  if (typeof chainID[network] !== 'undefined') {
    return Object.keys(chainID[network]).reduce((acc, cur) => {
      return [...acc, chainID[network][cur][layer]]
    }, [])
  }
  return []
}

export const isMoonbeamL1 = async (l1RpcProvider: string): Promise<boolean> => {
  const node = new providers.StaticJsonRpcProvider(l1RpcProvider)
  const chainId = (await node.getNetwork()).chainId
  return getChainIDList('moonbeam', 'l1').includes(chainId)
}

// Moonbeam specific for finding the latest confirmed block
export const getLatestConfirmedBlock = async (
  l1RpcProvider: string
): Promise<number> => {
  const node = new providers.StaticJsonRpcProvider(l1RpcProvider)
  const chainId = (await node.getNetwork()).chainId
  if (getChainIDList('moonbeam', 'l1').includes(chainId)) {
    const finalizedHeadHash = await node.send('chain_getFinalizedHead', [])
    const finalizedBlockHeader = await node.send('chain_getHeader', [
      finalizedHeadHash,
    ])
    return parseInt(finalizedBlockHeader.number, 16)
  } else {
    return null
  }
}
