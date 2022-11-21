---
description: A collection of links and addresses to get started on Boba-Moonbeam
---

- [Bobabase L2 (1297) for the Moonbase Testnet (1287)](#bobabase-l2--1297--for-the-moonbase-testnet--1287-)
  * [Testnet Fountain for Developers on Bobabase L2](#testnet-fountain-for-developers-on-bobabase-l2)
  * [Bridging](#bridging)
  * [Analytics and eth_getLogs for Bobabase](#analytics-and-eth-getlogs-for-bobabase)
  * [Bobabase Addresses](#bobabase-addresses)
  * [Bobabase Links and Endpoints](#bobabase-links-and-endpoints)
- [Bobabeam L2 (1294) for the Moonbeam L1 (1284)](#bobabeam-l2--1294--for-the-moonbeam-l1--1284-)
  * [Bobabeam Addresses](#bobabeam-addresses)
  * [Analytics and eth_getLogs for Bobabeam](#analytics-and-eth-getlogs-for-bobabeam)
  * [Bobabeam Links and Endpoints](#bobabeam-links-and-endpoints)

# Bobabase L2 (1297) for the Moonbase Testnet (1287)

## Testnet Fountain for Developers on Bobabase L2

There is a Bobabase testnet [fountain](https://gateway.bobabase.boba.network) for `BOBA`. Authentication is via Twitter - please go to the gateway and connect your MetaMask wallet to the Bobabase L2. In **gateway > wallet**, you will see the `Developer Twitter/Turing test token fountain`. This system uses Turing hybrid compute to interact with Twitter.

## Bridging

The standard bridges for `GLMR` (aka `DEV` on Moonbase) and `BOBA` are active, so you can can both bridge and exit `GLMR` and `BOBA` from Moonbase to Bobabase and back. The exit delay (the fraud proof window) has been set to 5 minutes (it's normally 7 days) to make development easier.

## Analytics and eth_getLogs for Bobabase

If you have unusual `getLogs` needs, especially calls from `0 to latest`, the main RPC will block you, since this is how most DoS attacks work. In those cases, we encourage you to run your own RPC endpoint on your own replica of Bobabase. We have prepared Docker images for you, so this should only take a few minutes. To access these images:

* clone the `boba` repo
* switch to `alt-l1` branch.
* Add `.env` in [boba-node](https://github.com/bobanetwork/boba/tree/alt-l1/boba_community/boba-node) folder

  ```
  RELEASE_VERSION=v0.X.X
  ```

The bobabase's docker-compose file is in [`boba-community/boba-node/docker-compose-bobabase.yml`](https://github.com/bobanetwork/boba/tree/alt-l1/boba_community/boba-node)

```bash
$ docker compose -f docker-compose-bobabase.yml pull
$ docker compose -f docker-compose-bobabase.yml up
```

The DTL will first sync with the chain. During the sync, you will see the DTL and Replica gradually catch up with the Boba L2. This can take several minutes to several hours, depending on which chain you are replicating.

## Bobabase Addresses

For **primary contracts and addresses** see [packages/contracts/deployments/bobabase/README.md](../../packages/contracts/deployments/bobabase/README.md)

For **secondary addresses**, such as L2 Tokens and Messengers, please see the [Bobabase address registration dump](../../packages/boba/register/addresses/addressesBobaBase_0xF8d0bF3a1411AC973A606f90B2d1ee0840e5979B.json).

## Bobabase Links and Endpoints

|                   |                                                              |
| ----------------- | ------------------------------------------------------------ |
| ChainID           | 1297                                                         |
| RPC               | [https://bobabase.boba.network](https://bobabase.boba.network) |
| Replica RPC       | [https://replica.bobabase.boba.network](https://replica.bobabase.boba.network) |
| Gateway           | [https://gateway.bobabase.boba.network](https://gateway.bobabase.boba.network) |
| Blockexplorer     | [https://blockexplorer.bobabase.boba.network](https://blockexplorer.bobabase.boba.network) |
| Websocket         | [wss://wss.bobabase.boba.network](wss://wss.bobabase.boba.network) |
| Replica Websocket | [wss://replica-wss.bobabeam.boba.network](wss://replica-wss.bobabeam.boba.network) |

# Bobabeam L2 (1294) for the Moonbeam L1 (1284)

## Analytics and eth_getLogs for Bobabeam

To access these images:

* clone the `boba` repo

* switch to `alt-l1` branch.

* Add `.env` in [boba-node](https://github.com/bobanetwork/boba/tree/alt-l1/boba_community/boba-node) folder

  ```
  RELEASE_VERSION=v0.X.X
  ```

The bobabeam's docker-compose file is in [`boba-community/boba-node/docker-compose-bobabeam.yml`](https://github.com/bobanetwork/boba/tree/alt-l1/boba_community/boba-node)

```bash
$ docker compose -f docker-compose-bobabeam.yml pull
$ docker compose -f docker-compose-bobabeam.yml up
```

## Bobabeam Addresses

For **primary contracts and addresses** see [packages/contracts/deployments/bobabeam/README.md](../../packages/contracts/deployments/bobabeam/README.md)

For **secondary addresses**, such as L2 Tokens and Messengers, please see the [Bobabeam address registration dump](../../packages/boba/register/addresses/addressBobaBeam_0x564c10A60af35a07f0EA8Be3106a4D81014b21a0.json).

## Bobabeam Links and Endpoints

|                   |                                                              |
| ----------------- | ------------------------------------------------------------ |
| ChainID           | 1294                                                         |
| RPC               | [https://bobabeam.boba.network](https://bobabeam.boba.network) |
| Replica RPC       | [https://replica.bobabeam.boba.network](https://replica.bobabeam.boba.network) |
| Gateway           | [https://gateway.bobabeam.boba.network](https://gateway.bobabeam.boba.network) |
| Blockexplorer     | [https://blockexplorer.bobabeam.boba.network](https://blockexplorer.bobabeam.boba.network) |
| Websocket         | [wss://wss.bobabeam.boba.network](wss://wss.bobabeam.boba.network) |
| Replica Websocket | [wss://replica-wss.bobabeam.boba.network](wss://replica-wss.bobabeam.boba.network) |
