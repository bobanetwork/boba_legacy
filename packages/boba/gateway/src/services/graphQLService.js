const urql = require('urql')
const { gql } = require("urql");

require('dotenv').config()

class GraphQLService {

  getBridgeEndpoint = () => {
    return `https://graph.${process.env.REACT_APP_CHAIN ?? 'rinkeby'}.boba.network:8000/subgraphs/name/boba/Bridges/graphql`
  }

  async queryBridgeProposalCreated() {
    const query = gql(`{ governorProposalCreateds { proposalId values description proposer }`)

    const client = urql.createClient({url: this.getBridgeEndpoint()})
    return await client.query(query).toPromise()
  }
}

const graphQLService = new GraphQLService();
export default graphQLService;

