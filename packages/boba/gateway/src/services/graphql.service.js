import {ApolloClient, gql, HttpLink, InMemoryCache} from '@apollo/client';
import fetch from 'cross-fetch';
import { NETWORK_TYPE } from 'util/network/network.util';
import networkService from './networkService';

class GraphQLService {

  GRAPHQL_ENDPOINTS = {
    // Boba ETH
    288: {
      gql: "https://api.thegraph.com/subgraphs/name/bobanetwork/boba-l2-subgraph",
      local: ""
    },
    // Boba BNB
    56288: {
      gql: "", // TODO
      local: ""
    },
    // Goerli
    5: {
      gql: "http://graph-loadb-52c7fb91q45b-f7b94f4b90ec39e9.elb.us-east-1.amazonaws.com:8000/subgraphs/name/boba/Bridges", // TODO DNS
      local: ""
    },
    // BNB testnet
    97: {
      gql: "http://graph-loadb-bayigwg78i9q-886961d31fa377af.elb.us-east-1.amazonaws.com:8000/subgraphs/name/boba/Bridges", // TODO: DNS
      local: "",
    },
    // Boba Goerli
    2888: {
      gql: "http://graph-loadb-1mh7y9k4wlhg2-7ecc2a39c66258e5.elb.us-east-1.amazonaws.com:8000/subgraphs/name/boba/Bridges", // TODO DNS
      local: "http://127.0.0.1:8000/subgraphs/name/boba/Bridges"
    },
    // Boba BNB testnet
    9728: {
      gql: "http://graph-loadb-c2yef63eachk-3a7ebb678a869b0a.elb.us-east-1.amazonaws.com:8000/subgraphs/name/boba/Bridges", // TODO dns
      local: "http://127.0.0.1:8002/subgraphs/name/boba/Bridges"
    }
  }

  getBridgeEndpoint = (chainId, useLocal = false) => {
    return this.GRAPHQL_ENDPOINTS[chainId][useLocal ? 'local' : 'gql']
  }

  async conductQuery(query, variables = {}, sourceChainId, useLocalGraphEndpoint = false){
    const uri = this.getBridgeEndpoint(sourceChainId, useLocalGraphEndpoint)
    if (!uri) return;
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

  async queryBridgeProposalCreated({
    sourceChainId
  }) {

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

    return await this.conductQuery(query, null, sourceChainId)
  }

}

class TeleportationGraphQLService extends GraphQLService {
  useLocal = false

  async queryAssetReceivedEvent(walletAddress, sourceChainId) {
    const query = gql(`query Teleportation($wallet: Bytes!, $sourceChainId: String!) {
  teleportationAssetReceivedEvents(
    where: { and: [{ emitter: $wallet }, { sourceChainId: $sourceChainId }] }
  ) {
    token
    sourceChainId
    toChainId
    depositId
    emitter
    amount
    blockNumber
    blockTimestamp
    txHash
  }
}`)

    const variables = {
      wallet: walletAddress,
      sourceChainId: sourceChainId.toString()
    }
    return (await this.conductQuery(query, variables, sourceChainId, this.useLocal))?.data?.teleportationAssetReceivedEvents
  }

  async queryDisbursementSuccessEvent(walletAddress, sourceChainId, destChainId, token, amount, depositId) {
    if (!token) return undefined;
    const query = gql(`query Teleportation($wallet: Bytes!, $sourceChainId: String!, $token: Bytes!, $amount: String!, $depositId: String!) {
  teleportationDisbursementSuccessEvents(
    where: { and: [{ to: $wallet }, { sourceChainId: $sourceChainId }, { token: $token }, { amount: $amount }, { depositId: $depositId }] }
  ) {
    depositId
    to
    token
    amount
    sourceChainId
    blockNumber
    blockTimestamp
    txHash
  }
}
`)

    const variables = {
      wallet: walletAddress,
      sourceChainId: sourceChainId.toString(),
      token,
      amount: amount.toString(),
      depositId: depositId.toString()
    }
    const events = (await this.conductQuery(query, variables, destChainId, this.useLocal))?.data?.teleportationDisbursementSuccessEvents
    if (events?.length) {
      if (events.length > 1) {
        console.warn('Found more than one disbursementSuccessEvent, should always be 1:', events)
      }
      return events[0]; // just first (should always just be one)
    }
    return undefined;
  }

  async queryDisbursementFailedEvent(walletAddress, sourceChainId, destChainId, amount, depositId) {
    const query = gql(`query Teleportation($wallet: Bytes!, $sourceChainId: String!, $amount: String!, $depositId: String!) {
  teleportationDisbursementFailedEvents(
    where: { and: [{ to: $wallet }, { sourceChainId: $sourceChainId }, { amount: $amount }, { depositId: $depositId }] }
  ) {
    depositId
    to
    amount
    sourceChainId
    blockNumber
    blockTimestamp
    txHash
  }
}
`)

    const variables = {
      wallet: walletAddress,
      sourceChainId: sourceChainId.toString(),
      amount: amount.toString(),
      depositId: depositId.toString(),
    }
    const events = (await this.conductQuery(query, variables, destChainId, this.useLocal))?.data?.teleportationDisbursementFailedEvents
    if (events?.length) {
      if (events.length > 1) {
        console.warn('Found more than one disbursementFailedEvent, should always be 1:', events)
      }
      return events[0]; // just first (should always just be one)
    }
    return undefined;
  }

  async queryDisbursementRetrySuccessEvent(walletAddress, sourceChainId, destChainId, amount, depositId) {
    const query = gql(`query Teleportation($wallet: Bytes!, $sourceChainId: String!, $amount: String!, $depositId: String!) {
  teleportationDisbursementRetrySuccessEvents(
    where: { and: [{ to: $wallet }, { sourceChainId: $sourceChainId }, { amount: $amount }, { depositId: $depositId }] }
  ) {
    depositId
    to
    amount
    sourceChainId
    blockNumber
    blockTimestamp
    txHash
  }
}
`)

    const variables = {
      wallet: walletAddress,
      sourceChainId: sourceChainId.toString(),
      amount: amount.toString(),
      depositId: depositId.toString(),
    }
    const events = (await this.conductQuery(query, variables, destChainId, this.useLocal))?.data?.teleportationDisbursementRetrySuccessEvents
    if (events?.length) {
      if (events.length > 1) {
        console.warn('Found more than one disbursementRetrySuccessEvent, should always be 1:', events)
      }
      return events[0]; // just first (should always just be one)
    }
    return undefined;
  }


}

const graphQLService = new GraphQLService()
const teleportationGraphQLService = new TeleportationGraphQLService()
export { graphQLService, teleportationGraphQLService }
