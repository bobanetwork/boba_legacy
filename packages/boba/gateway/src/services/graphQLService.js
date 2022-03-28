const apollo = require('@apollo/client')
const fetch = require('cross-fetch')

require('dotenv').config()

class GraphQLService {

  getBridgeEndpoint = () => {
    return `https://graph.${process.env.REACT_APP_CHAIN ?? 'rinkeby'}.boba.network:8000/subgraphs/name/boba/Bridges/graphql`
  }

  async queryBridgeProposalCreated() {
    const query = apollo.gql(`query { governorProposalCreateds { proposalId values description proposer } }`)

    console.log(query)

    const client = new apollo.ApolloClient({uri: this.getBridgeEndpoint(),
      link: new apollo.HttpLink({ uri: this.getBridgeEndpoint(), fetch }),
      cache: new apollo.InMemoryCache()})
    return await client.query({ query })
  }
}

const graphQLService = new GraphQLService();
export default graphQLService;

// graphQLService.queryBridgeProposalCreated().then(r => console.log(r)).catch(console.error)

