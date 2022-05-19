import { ethers } from 'ethers'
import fetch from 'node-fetch'

export const GRAPH_API_URL: any = {
  1: {
    rollup:
      'https://api.thegraph.com/subgraphs/name/bobanetwork/mainnet-rollup',
  },
  4: {
    rollup:
      'https://api.thegraph.com/subgraphs/name/bobanetwork/rinkeby-rollup',
  },
}

export const getEventsFromGraph = async (
  entity: string,
  chainID: number,
  fromBlock?: number,
  toBlock?: number
): Promise<any> => {
  if (!GRAPH_API_URL[chainID]) {
    return {}
  }
  const response = await fetch(GRAPH_API_URL[chainID].rollup, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query {
          ${entity}(
            orderBy: blockNumber
            orderDirection: desc
            first: 1000
            where: {
              ${fromBlock ? `blockNumber_gte: ${fromBlock}` : ''}
              ${toBlock ? `blockNumber_lte: ${toBlock}` : ''}
            }
          ) {
            id
            blockNumber
            msgHash
          }
        }
      `,
    }),
  })
  const data = await response.json()
  return data
}

const countEventsFromGraph = (entity: any, totalLength: number): number => {
  if (typeof entity.data !== 'undefined') {
    totalLength += Object.keys(entity.data).reduce((acc, cur) => {
      acc += entity.data[cur].length
      return acc
    }, 0)
  }
  return totalLength
}

export const countRelayMessageEventsFromGraph = async (
  provider: ethers.providers.Provider,
  fromBlock?: number,
  toBlock?: number,
  chainId?: number
): Promise<Number | 0> => {
  const chainID = chainId || (await provider.getNetwork()).chainId
  if (!GRAPH_API_URL[chainID]) {
    return 0
  }
  const entities = [
    'relayedMessageEntities',
    'relayedMessageFastEntities',
    'failedRelayedMessageEntities',
    'failedRelayedMessageFastEntities',
  ]
  let numberOfEvents = 0
  for (const entity of entities) {
    const events = await getEventsFromGraph(entity, chainID, fromBlock, toBlock)
    numberOfEvents += countEventsFromGraph(events, numberOfEvents)
  }
  return numberOfEvents
}
