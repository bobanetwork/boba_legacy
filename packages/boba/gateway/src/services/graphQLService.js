import axios from 'axios'

require('dotenv').config()

class GraphQLService {

  getBridgeEndpoint = () => {
    return `https://graph.${process.env.REACT_APP_CHAIN ?? 'rinkeby'}.boba.network/subgraphs/name/boba/Bridges/graphql`
  }

  async queryBridgeProposalCreated(id, subgraphError = 'allow') {

    const query = `
          query DescriptionList($id:ID!,$subgraphError:_SubgraphErrorPolicy_!) {
              governorProposalCreated(id:$id, subgraphError:$subgraphError) {
                  id,
                  l1Token, l2Token,
                  from, to,
                  amount, data
              }
          }
      `

    return await axios({
      url: this.getBridgeEndpoint,
      method: 'post',
      data: {
        query,
        variables: {id, subgraphError}
      }
    })
  }
}

const graphQLService = new GraphQLService();
export default graphQLService;
