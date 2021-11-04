# Boba Network Bridges Subgraphs

These subgraphs index the **StandardBridge** contracts and **LiquidityPool** contracts.

## Requirements

The global graph is required to deploy to **The Graph Node**.

```bash
npm install -g @graphprotocol/graph-cli
```

## Building & Running

### L1 Subgraphs

The deploy key is required to deploy subgraphs to **The Graph Node**. 

```bash
graph auth  --studio $DEPLOY_KEY
yarn install
yarn prepare:mainet # yarn prepare:rinkeby
yarn codegen
yarn build
graph deploy --studio boba-network # graph deploy --studio boba-network-rinkeby
```

### L2 Subgraphs

The admin port is not public. 

```bash
yarn install
yarn prepare:mainet
yarn codegen
yarn build
yarn create:subgraph:mainnet
# OR
# graph create --node https://graph.mainnet.boba.network:8020 boba/Bridges
yarn deploy:subgraph:mainnet
# OR
# graph deploy --ipfs https://graph.mainnet.boba.network:5001 --node https://graph.mainnet.boba.network:8020 Pboba/Bridges
```

## Querying

### L2 Subgraphs

> Mainnet: https://graph.mainnet.boba.network/subgraphs/name/boba/Bridges/graphql

> Rinkeby: https://graph.rinkeby.boba.network/subgraphs/name/boba/Bridges/graphql

## Graph Node

> Mainnet endpoint: https://graph.mainnet.boba.network

| **Port** | **Purpose**                               | **Routes**              | URL                                                          | **Permission** |
| -------- | ----------------------------------------- | ----------------------- | ------------------------------------------------------------ | -------------- |
| 8000     | GraphQL HTTP server                       | /subgraphs/name/.../... | https://graph.mainnet.boba.network <br />https://graph.mainnet.boba.network:8000 | Public         |
| 8020     | JSON-RPC<br /> (for managing deployments) | /                       | https://graph.mainnet.boba.network:8020                      | Private        |
| 8030     | Subgraph indexing status API              | /graphql                | https://graph.mainnet.boba.network:8030                      | Public         |
| 8040     | Prometheus metrics                        | /metrics                | https://graph.mainnet.boba.network:8040                      | Public         |

> Rinkeby endpoint: https://graph.rinkeby.boba.network

| **Port** | **Purpose**                               | **Routes**              | URL                                                          | **Permission** |
| -------- | ----------------------------------------- | ----------------------- | ------------------------------------------------------------ | -------------- |
| 8000     | GraphQL HTTP server                       | /subgraphs/name/.../... | https://graph.rinkeby.boba.network <br />https://graph.rinkeby.boba.network:8000 | Public         |
| 8020     | JSON-RPC<br /> (for managing deployments) | /                       | https://graph.rinkeby.boba.network:8020                      | Private        |
| 8030     | Subgraph indexing status API              | /graphql                | https://graph.rinkeby.boba.network:8030                      | Public         |
| 8040     | Prometheus metrics                        | /metrics                | https://graph.rinkeby.boba.network:8040                      | Public         |

## 