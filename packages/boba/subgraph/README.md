# Boba Network Subgraphs

These subgraphs index the **StandardBridge**, the **LiquidityPool**, the **Boba DAO**, and the **TuringMonster** contracts.

## Requirements

The global graph is required to deploy to **The Graph Node**. Make sure that you have various packages installed.

```bash
yarn global add @graphprotocol/graph-cli
yarn global add --dev @graphprotocol/graph-ts
```

## Building & Running

First, `cd` to either the **L1** or the **L2** folders, depending on where you will be deploying your subgraphs to. 

### L1 Subgraphs

The deploy key is required to deploy subgraphs to **The Graph Node**. Depending on which chain you are indexing, provide either `mainnet` or `rinkeby` as a setting to `yarn prepare:`.

```bash
graph auth --studio $DEPLOY_KEY
yarn install
yarn prepare:mainnet 
#or, yarn prepare:rinkeby
yarn codegen
yarn build
graph deploy --studio boba-network 
# or, graph deploy --studio boba-network-rinkeby
```

### L2 Subgraphs

The admin port for rinkeby is not public. 

```bash
yarn install
yarn prepare:mainnet
#or, yarn prepare:rinkeby
yarn codegen
yarn build
graph deploy --product hosted-service BOBANETWORK/boba-l2-subgraph
# or, yarn deploy:subgraph:rinkeby
```

## Querying

* The Mainnet Graph Node is hosted by **The Graph** team. Visit https://thegraph.com/hosted-service/ to deploy your subgraphs. You can experiment here: [ bobanetwork/boba-l2-subgraph](https://thegraph.com/hosted-service/subgraph/bobanetwork/boba-l2-subgraph?query=Example%20query).

* Rinkeby endpoint: https://graph.rinkeby.boba.network. you can experiment here: [boba/Bridges/graphql](https://graph.rinkeby.boba.network/subgraphs/name/boba/Bridges/graphql)

| **Port** | **Purpose**                               | **Routes**              | URL                                                          | **Permission** |
| -------- | ----------------------------------------- | ----------------------- | ------------------------------------------------------------ | -------------- |
| 8000     | GraphQL HTTP server                       | /subgraphs/name/.../... | https://graph.rinkeby.boba.network <br />https://graph.rinkeby.boba.network:8000 | Public         |
| 8020     | JSON-RPC<br /> (for managing deployments) | /                       | https://graph.rinkeby.boba.network:8020                      | Private        |
| 8030     | Subgraph indexing status API              | /graphql                | https://graph.rinkeby.boba.network:8030                      | Public         |
| 8040     | Prometheus metrics                        | /metrics                | https://graph.rinkeby.boba.network:8040                      | Public         |
