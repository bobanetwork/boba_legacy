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
}

const graphQLService = new GraphQLService()
export default graphQLService
