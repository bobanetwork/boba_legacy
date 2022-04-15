const apollo = require('@apollo/client')
const fetch = require('cross-fetch')

require('dotenv').config()

class GraphQLService {

  getBridgeEndpoint = () => {
    if(process.env.REACT_APP_CHAIN === 'mainnet') {
      return `https://api.thegraph.com/subgraphs/name/bobanetwork/boba-l2-subgraph`
    } else if (process.env.REACT_APP_CHAIN === 'rinkeby') {
      return `https://graph.rinkeby.boba.network/subgraphs/name/boba/Bridges`
    } else {
      return ''
    }
  }

  async queryBridgeProposalCreated() {

    const query = apollo.gql(`query { governorProposalCreateds { proposalId values description proposer } }`)

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

    const client = new apollo.ApolloClient({
      uri: this.getBridgeEndpoint(),
      link: new apollo.HttpLink({ 
        uri: this.getBridgeEndpoint(), 
        fetch 
      }),
      cache: new apollo.InMemoryCache()
    })

    return await client.query({ query })
  }

  async queryMonsterTransfer() {

    const query = apollo.gql(`query { turingMonstersTransferEvents { to from tokenId } }`)

  /*
     curl -g -X POST \
    -H "Content-Type: application/json" \
    -d '{"query":"{ turingMonstersTransferEvents { to from tokenId }}"}' \
    https://api.thegraph.com/subgraphs/name/bobanetwork/boba-l2-subgraph

         curl -g -X POST \
    -H "Content-Type: application/json" \
    -d '{"query":"{ turingMonstersTransferEvents { to from tokenId }}"}' \
    https://graph.rinkeby.boba.network/subgraphs/name/boba/Bridges
  */
    const client = new apollo.ApolloClient({
      uri: this.getBridgeEndpoint(),
      link: new apollo.HttpLink({ 
        uri: this.getBridgeEndpoint(), 
        fetch 
      }),
      cache: new apollo.InMemoryCache()
    })

    return await client.query({ 
      query,
      variables : {
        to: '0x4161aEf7ac9F8772B83Cda1E5F054ADe308d9049'
      } 
    })
  }
}

const graphQLService = new GraphQLService()
export default graphQLService
