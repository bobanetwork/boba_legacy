import {ApolloClient, gql, HttpLink, InMemoryCache} from '@apollo/client';
import fetch from 'cross-fetch';
import {NETWORK, NETWORK_TYPE} from 'util/network/network.util';
import networkService from './networkService';
import {Layer, LAYER} from "../util/constant";

class GraphQLService {

  LOCAL_GRAPHQL_ENDPOINT = "http://127.0.0.1:8000/subgraphs/name/boba/Bridges"
  GRAPHQL_ENDPOINTS = {
    [NETWORK_TYPE.MAINNET]: {
      [NETWORK.ETHEREUM]: {
        [LAYER.L2]: "https://api.thegraph.com/subgraphs/name/bobanetwork/boba-l2-subgraph"
      }
    },
    [NETWORK_TYPE.TESTNET]: {

    }
  }

  getBridgeEndpoint = (networkType = networkService.networkType, network = networkService.network, layer = networkService.L1orL2, useLocal = false) => {
    if (useLocal) {
      return this.LOCAL_GRAPHQL_ENDPOINT
    }
    // Network type always filled
    const networkObj = this.GRAPHQL_ENDPOINTS[networkType][network]
    if (!networkObj) {
      console.warn(`Could not find graphql endpoint for network: ${networkService.network}`)
      return "";
    }
    return networkObj[layer]
  }

  async conductQuery(query, variables = {}, networkType = networkService.networkType, network = networkService.network, layer = networkService.L1orL2, useLocal = false){
    const uri = this.getBridgeEndpoint(networkType, network, layer, useLocal)
    const client = new ApolloClient({
      uri,
      link: new HttpLink({
        uri,
        fetch
      }),
      cache: new InMemoryCache()
    })

    return await client.query({
      query,
      variables
    })
  }

  async queryBridgeProposalCreated() {

    const query = gql(`query { governorProposalCreateds { proposalId values description proposer } }`)

    /*
    curl -g -X POST \
    -H "Content-Type: application/json" \
    -d '{"query":"{ governorProposalCreateds {proposalId values description proposer}}"}' \
    https://graph.goerli.boba.network/subgraphs/name/boba/Bridges

    curl -g -X POST \
    -H "Content-Type: application/json" \
    -d '{"query":"{ governorProposalCreateds {proposalId values description proposer}}"}' \
    https://api.thegraph.com/subgraphs/name/bobanetwork/boba-l2-subgraph

    */

    if (NETWORK_TYPE.TESTNET === networkService.networkType) {
      // As there is no subgraph node for goerli L2 disable it.
      return {
        data:{governorProposalCreateds: []}
      }
    }

    return await this.conductQuery(query)
  }

}

class TeleportationGraphQLService extends GraphQLService {
  useLocal = true // TODO: Set to false

  async queryAssetReceivedEvent(walletAddress, networkType = networkService.networkType, network = networkService.network, layer = networkService.L1orL2) {
    const query = gql(`query Teleportation($wallet: Bytes!)
    { teleportationAssetReceivedEvents(where: {emitter: $wallet}) {
      token,
      sourceChainId
      toChainId
      depositId
      emitter
      amount
      blockNumber
      blockTimestamp
      txHash
  } }`)

    const variables = {
      wallet: walletAddress
    }
    return (await this.conductQuery(query, variables, networkType, network, layer, this.useLocal))?.data?.teleportationAssetReceivedEvents
  }

  async queryDisbursementSuccessEvent(walletAddress, networkType = networkService.networkType, network = networkService.network, layer = networkService.L1orL2) {
    const query = gql(`query Teleportation($wallet: Bytes!)
      { teleportationDisbursementSuccessEvents(where: {to: $wallet}) {
    depositId
    to
    token
    amount
    sourceChainId
    blockNumber
    blockTimestamp
    txHash
  } }`)

    const variables = {
      wallet: walletAddress
    }
    return (await this.conductQuery(query, variables, networkType, network, layer, this.useLocal))?.data?.teleportationDisbursementSuccessEvents
  }

  async queryDisbursementFailedEvent(walletAddress, networkType = networkService.networkType, network = networkService.network, layer = networkService.L1orL2) {
    const query = gql(`query Teleportation($wallet: Bytes!)
      { teleportationDisbursementFailedEvents(where: {to: $wallet}) {
    depositId
    to
    amount
    sourceChainId
    blockNumber
    blockTimestamp
    txHash
  } }`)

    const variables = {
      wallet: walletAddress
    }
    return (await this.conductQuery(query, variables, networkType, network, layer, this.useLocal))?.data?.teleportationDisbursementFailedEvents
  }

  async queryDisbursementRetrySuccessEvent(walletAddress, networkType = networkService.networkType, network = networkService.network, layer = networkService.L1orL2) {
    const query = gql(`query Teleportation($wallet: Bytes!)
      { teleportationDisbursementRetrySuccessEvents(where: {to: $wallet}) {
    depositId
    to
    amount
    sourceChainId
    blockNumber
    blockTimestamp
    txHash
  } }`)

    const variables = {
      wallet: walletAddress
    }
    return (await this.conductQuery(query, variables, networkType, network, layer, this.useLocal))?.data?.teleportationDisbursementFailedEvents
  }


}

const graphQLService = new GraphQLService()
const teleportationGraphQLService = new TeleportationGraphQLService()
export { graphQLService, teleportationGraphQLService }
