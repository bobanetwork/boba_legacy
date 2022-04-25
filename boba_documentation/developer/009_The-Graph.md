---
description: Using The Graph on Boba
---

# Using The Graph on Boba

The Graph is an indexing protocol for organizing blockchain data and making it easily accessible (with a service called GraphQL). You can define contract of interest, set up The Graph to ingest events/data that you define, and you can then obtain these data through GraphQL.

## Indexing and Main Endpoints - Boba Graph Node

> Mainnet endpoint: https://graph.mainnet.boba.network

| **Port** | **Purpose**                                   | **Routes**              | URL                                                                                  | **Permission** |
| -------- | --------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------ | -------------- |
| 8000     | GraphQL HTTP server                           | /subgraphs/name/.../... | <p>https://graph.mainnet.boba.network<br>https://graph.mainnet.boba.network:8000</p> | Public         |
| 8020     | <p>JSON-RPC<br>(for managing deployments)</p> | /                       | https://graph.mainnet.boba.network:8020                                              | Private        |
| 8030     | Subgraph indexing status API                  | /graphql                | https://graph.mainnet.boba.network:8030                                              | Public         |
| 8040     | Prometheus metrics                            | /metrics                | https://graph.mainnet.boba.network:8040                                              | Public         |

> Rinkeby endpoint: https://graph.rinkeby.boba.network

| **Port** | **Purpose**                                   | **Routes**              | URL                                                                                  | **Permission** |
| -------- | --------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------ | -------------- |
| 8000     | GraphQL HTTP server                           | /subgraphs/name/.../... | <p>https://graph.rinkeby.boba.network<br>https://graph.rinkeby.boba.network:8000</p> | Public         |
| 8020     | <p>JSON-RPC<br>(for managing deployments)</p> | /                       | https://graph.rinkeby.boba.network:8020                                              | Private        |
| 8030     | Subgraph indexing status API                  | /graphql                | https://graph.rinkeby.boba.network:8030                                              | Public         |
| 8040     | Prometheus metrics                            | /metrics                | https://graph.rinkeby.boba.network:8040                                              | Public         |

**NOTE - JSON RPC**: The RPC endpoint [https://graph.mainnet.boba.network:8020](https://graph.mainnet.boba.network:8020) is private. To use it, please tell us your IP addresses and we will open it up for you.

## Examples

Subgraph examples are given in the main repo at [https://github.com/omgnetwork/optimism-v2/tree/develop/packages/boba/subgraph](https://github.com/omgnetwork/optimism-v2/tree/develop/packages/boba/subgraph)

## Creating and Deploying Subgraphs

* Create subgraph

```bash
graph create --node https://graph.mainnet.boba.network:8020 PREFIX/NAME
```

* Deploy subgraph

```bash
graph deploy --ipfs https://graph.mainnet.boba.network:5001 --node https://graph.mainnet.boba.network:8020 PREFIX/NAME
```

## Issues

If you have issues, contact us on [Discord](https://omg.eco/discord).
