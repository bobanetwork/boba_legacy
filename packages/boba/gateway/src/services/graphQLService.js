import { ApolloClient, gql, HttpLink, InMemoryCache } from '@apollo/client';
import fetch from 'cross-fetch';
import { APP_CHAIN } from 'util/constant'

class GraphQLService {

  getBridgeEndpoint = () => {
    if (APP_CHAIN === 'mainnet') {
      return `https://api.thegraph.com/subgraphs/name/bobanetwork/boba-l2-subgraph`
    } else if (APP_CHAIN === 'rinkeby') {
      return `https://graph.rinkeby.boba.network/subgraphs/name/boba/Bridges`
    } else {
      return ''
    }
  }

  async queryBridgeProposalCreated() {

    const query = gql(`query { governorProposalCreateds { proposalId values description proposer to startTimestamp endTimestamp proposer } }`)

    /*
    curl -g -X POST \
    -H "Content-Type: application/json" \
    -d '{"query":"{ governorProposalCreateds {proposalId values description proposer}}"}' \
    https://graph.rinkeby.boba.network/subgraphs/name/boba/Bridges

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
      https://graph.rinkeby.boba.network/subgraphs/name/boba/Bridges

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
