import { ApolloClient, gql, HttpLink, InMemoryCache } from '@apollo/client';
import fetch from 'cross-fetch';
import { NETWORK_TYPE } from 'util/network/network.util';
import networkService from './networkService';

class GraphQLService {

  getBridgeEndpoint = () => {
    return networkService.networkType === NETWORK_TYPE.MAINNET ? 
    'https://api.thegraph.com/subgraphs/name/bobanetwork/boba-l2-subgraph' : '';
  }
  async queryBridgeProposalCreated() {

    const query = gql(`query { governorProposalCreateds { proposalId values description proposer } }`)

    if (NETWORK_TYPE.TESTNET === networkService.networkType) {
      // As there is no subgraph node for goerli L2 disable it.
      return {
        data:{governorProposalCreateds: []}
      }
    }

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



    if (NETWORK_TYPE.TESTNET === networkService.networkType) {
      return {
        data: { turingMonstersTransferEvents: [] }
      }
    }

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
