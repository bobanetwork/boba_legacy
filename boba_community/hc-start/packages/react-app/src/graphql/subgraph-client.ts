import { ApolloClient, InMemoryCache } from "@apollo/client";
import { isTestEnv } from "../utils/environment.utils";

// TODO: Just use the existing subgraph and add TuringFactory on there
export const subgraphClient = new ApolloClient({
  cache: new InMemoryCache(),
  uri: isTestEnv() ? 'https://graph.rinkeby.boba.network:8000/subgraphs/name/boba/Bridges'
    : "https://thegraph.com/hosted-service/subgraph/bobanetwork/boba-l2-subgraph"
});
