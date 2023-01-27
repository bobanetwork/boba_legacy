import { gql } from "@apollo/client";

const GET_TURING_HELPER_DEPLOYED = gql`
  {
    HybridComputeHelperDeployedEvents(first: 1) {
      id
      owner
      proxy
      depositedBoba
    }
  }
`;

export default GET_TURING_HELPER_DEPLOYED;
