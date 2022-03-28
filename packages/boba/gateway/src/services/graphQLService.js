const axios = require('axios')

require('dotenv').config()

class GraphQLService {

  getBridgeEndpoint = () => {
    return `https://graph.${process.env.REACT_APP_CHAIN ?? 'rinkeby'}.boba.network:8000/subgraphs/name/boba/Bridges/graphql`
  }

  async queryBridgeProposalCreated() {
    const query = {
      // operationName: 'proposalCreated',
      query: `query proposalCreated { governorProposalCreateds { proposalId values description proposer } }`,
      variables: {},
    }

    return axios({
      url: this.getBridgeEndpoint(),
      method: 'post',
      headers: {"Content-Type": "application/json", "Accept": "application/json"},
      data: JSON.stringify(query),
    })
  }
}

const graphQLService = new GraphQLService();
export default graphQLService;

