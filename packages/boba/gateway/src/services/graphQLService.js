import axios from 'axios'

require('dotenv').config()

class GraphQLService {

  getBridgeEndpoint = () => {
    return `https://graph.${process.env.REACT_APP_CHAIN ?? 'rinkeby'}.boba.network/subgraphs/name/boba/Bridges/graphql`
  }

  async queryBridgeProposalCreated() {

    const query = `
          {
            governorProposalCreateds {
              proposalId
              values
              description
              proposer
            }
          }
      `

    return await axios({
      url: this.getBridgeEndpoint,
      method: 'post',
      data: {
        query,
      },
    })
  }
}

const graphQLService = new GraphQLService();
export default graphQLService;
