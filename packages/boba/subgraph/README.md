# Boba Network Subgraphs

These subgraphs index the **StandardBridge**, the **LiquidityPool**, the **Boba DAO**, and the **TuringMonster** contracts.

## Requirements

The global `graph` is required to deploy to **The Graph**. Make sure that you have various packages installed.

```bash
yarn global add @graphprotocol/graph-cli
yarn global add --dev @graphprotocol/graph-ts
```

## Building & Running

First, `cd` to either the **L1** or the **L2** folders, depending on where you will be deploying your subgraphs to. There are four subgraphs: Ethereum, Boba, Rinkeby, and Boba-Rinkeby. A deploy key or access token is required to deploy subgraphs. Depending on which chain you are indexing, provide either `mainnet` or `rinkeby` as a setting to `yarn prepare:`.

### L1 Subgraphs

(below command untested)

```bash
graph auth --product hosted-service <ACCESS_TOKEN>
# or, graph auth --studio $DEPLOY_KEY
cd L1
yarn install
yarn prepare:mainnet 
# or, yarn prepare:rinkeby
yarn codegen
yarn build
graph deploy --product hosted-service BOBANETWORK/boba-l2-subgraph 
# or, graph deploy --studio boba-network-rinkeby
```

### L2 Subgraphs

(Below commands tested for deploy to Boba mainnet)

```bash
graph auth --product hosted-service <ACCESS_TOKEN>
# or, graph auth --studio $DEPLOY_KEY
cd L2
yarn install
yarn prepare:mainnet
# or, yarn prepare:rinkeby
yarn codegen
yarn build
graph deploy --product hosted-service BOBANETWORK/boba-l2-subgraph
# or, yarn deploy:subgraph:rinkeby
```

*NOTE: When you log into https://thegraph.com/hosted-service/dashboard, you may have more than one account. Make sure that you are using the ACCESS_TOKEN associated with the correct account, otherwise your depoyment will fail. You can cycle through your multiple accounts by clicking on your GitHub user ID or whatever other account is displayed next to your user Avatar.*

## Example

Here is some example queries to get you started:

```bash
# L2 Boba Mainnet Query

  curl -g -X POST \
    -H "Content-Type: application/json" \
    -d '{"query":"{ governorProposalCreateds {proposalId values description proposer}}"}' \
    https://api.thegraph.com/subgraphs/name/bobanetwork/boba-l2-subgraph

```

```bash
# L2 Boba Rinkeby Query

  curl -g -X POST \
    -H "Content-Type: application/json" \
    -d '{"query":"{ governorProposalCreateds {proposalId values description proposer}}"}' \
    https://graph.rinkeby.boba.network/subgraphs/name/boba/Bridges

```

## Querying

* The Mainnet Graph Node is hosted by **The Graph**. Visit https://thegraph.com/hosted-service/ to deploy your subgraphs. You can experiment here: [ bobanetwork/boba-l2-subgraph](https://thegraph.com/hosted-service/subgraph/bobanetwork/boba-l2-subgraph?query=Example%20query).

* Rinkeby endpoint: https://graph.rinkeby.boba.network. You can experiment here: [boba/Bridges/graphql](https://graph.rinkeby.boba.network/subgraphs/name/boba/Bridges/graphql)

| **Port** | **Purpose**                               | **Routes**              | URL                                                          | **Permission** |
| -------- | ----------------------------------------- | ----------------------- | ------------------------------------------------------------ | -------------- |
| 8000     | GraphQL HTTP server                       | /subgraphs/name/.../... | https://graph.rinkeby.boba.network <br />https://graph.rinkeby.boba.network:8000 | Public         |
| 8020     | JSON-RPC<br /> (for managing deployments) | /                       | https://graph.rinkeby.boba.network:8020                      | Private        |
| 8030     | Subgraph indexing status API              | /graphql                | https://graph.rinkeby.boba.network:8030                      | Public         |
| 8040     | Prometheus metrics                        | /metrics                | https://graph.rinkeby.boba.network:8040                      | Public         |
