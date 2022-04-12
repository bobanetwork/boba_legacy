# Boba Network Subgraphs

These subgraphs index the **StandardBridge**, the **LiquidityPool**, and the **Boba DAO** contracts.

## Requirements

The global graph is required to deploy to **The Graph Node**. Make sure that you have various packages installed.

```bash
yarn global add @graphprotocol/graph-cli
yarn global add --dev @graphprotocol/graph-ts
```

## Building & Running

First, `cd` to either the **L1** or the **L2** folders, depending on where you will be deploying your subgraphs to. 

### L1 Subgraphs

The deploy key is required to deploy subgraphs to **The Graph Node**. 

```bash
graph auth --studio $DEPLOY_KEY
yarn install
yarn prepare:mainnet # yarn prepare:rinkeby
yarn codegen
yarn build
graph deploy --studio boba-network # graph deploy --studio boba-network-rinkeby
```

### L2 Subgraphs

The admin port is not public. 

```bash
yarn install
yarn prepare:mainnet
yarn codegen
yarn build
yarn deploy:subgraph:mainnet
# OR
# graph deploy --product hosted-service BOBANETWORK/boba-l2-subgraph
```

## Querying

### L2 Subgraphs

> Mainnet Graph Node is hosted by **The Graph** team. Visit https://thegraph.com/hosted-service/ to deploy your subgraphs

> Rinkeby: https://graph.rinkeby.boba.network/subgraphs/name/boba/Bridges/graphql

## Graph Node

> Mainnet Graph Node is hosted by **The Graph** team. Visit https://thegraph.com/hosted-service/ to deploy your subgraphs

> Rinkeby endpoint: https://graph.rinkeby.boba.network

| **Port** | **Purpose**                               | **Routes**              | URL                                                          | **Permission** |
| -------- | ----------------------------------------- | ----------------------- | ------------------------------------------------------------ | -------------- |
| 8000     | GraphQL HTTP server                       | /subgraphs/name/.../... | https://graph.rinkeby.boba.network <br />https://graph.rinkeby.boba.network:8000 | Public         |
| 8020     | JSON-RPC<br /> (for managing deployments) | /                       | https://graph.rinkeby.boba.network:8020                      | Private        |
| 8030     | Subgraph indexing status API              | /graphql                | https://graph.rinkeby.boba.network:8030                      | Public         |
| 8040     | Prometheus metrics                        | /metrics                | https://graph.rinkeby.boba.network:8040                      | Public         |
