import { ApolloClient, gql, HttpLink, InMemoryCache } from '@apollo/client';
import fetch from 'cross-fetch';
import { NETWORK_TYPE } from 'util/network/network.util';
import networkService from './networkService';

class GraphQLService {

  getBridgeEndpoint = () => {

    if (networkService.networkType === NETWORK_TYPE.MAINNET) {
      return `https://api.thegraph.com/subgraphs/name/bobanetwork/boba-l2-subgraph`
    } else if (networkService.networkType === NETWORK_TYPE.TESTNET) {
      return `https://graph.goerli.boba.network/subgraphs/name/boba/Bridges`
    } else {
      return ''
    }
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

    const client = new ApolloClient({
      uri: this.getBridgeEndpoint(),
      link: new HttpLink({
        uri: this.getBridgeEndpoint(),
        fetch
      }),
      cache: new InMemoryCache()
    })

    return await client.query({ query })
  }

  async queryMonsterTransfer(walletAddress) {

    const query = gql(`query GetTUMOEvents($wallet: Bytes!) {
      turingMonstersTransferEvents(where: {
        to: $wallet }) { tokenId, to, from } }`)

    /*
    curl -g -X POST \
      -H "Content-Type: application/json" \
      -d '{"query":"{ turingMonstersTransferEvents { to from tokenId }}"}' \
      https://api.thegraph.com/subgraphs/name/bobanetwork/boba-l2-subgraph

    curl -g -X POST \
      -H "Content-Type: application/json" \
      -d '{"query":"{ turingMonstersTransferEvents { to from tokenId }}"}' \
      https://graph.goerli.boba.network/subgraphs/name/boba/Bridges

    curl -g -X POST \
      -H "Content-Type: application/json" \
      -d '{"query":"{ turingMonstersTransferEvents(where: {to: \"0xADDRESS\"}) { to from tokenId }}"}' \
      https://api.thegraph.com/subgraphs/name/bobanetwork/boba-l2-subgraph

    query GetTUMOEvents($wallet: Bytes!) {
        turingMonstersTransferEvents(where:{
            to: $wallet
          }) {
        tokenId, to, from
      }
    }
    */

    const client = new ApolloClient({
      uri: this.getBridgeEndpoint(),
      link: new HttpLink({
        uri: this.getBridgeEndpoint(),
        fetch
      }),
      cache: new InMemoryCache()
    })

    return await client.query({
      query,
      variables: {
        wallet: walletAddress
      }
    })
  }
}

const graphQLService = new GraphQLService()
export default graphQLService
