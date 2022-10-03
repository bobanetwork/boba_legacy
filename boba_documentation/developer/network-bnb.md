---
description: A collection of links and addresses to get started on Boba-BNB
---

- [Boba BNB Testnet L2 (9728) for the BNB Testnet (97)](#boba-bnb-testnet-l2--9728--for-the-bnb-testnet--97-)
  * [Testnet Fountain for Developers on Boba BNB Testnet L2](#testnet-fountain-for-developers-on-boba-bnb-testnet-l2)
  * [Bridging](#bridging)
  * [Analytics and eth_getLogs for Boba BNB Testnet](#analytics-and-eth-getlogs-for-boba-bnb-testnet)
  * [Boba BNB Testnet Addresses](#boba-bnb-testnet-addresses)
  * [Boba BNB Testnet Links and Endpoints](#boba-bnb-testnet-links-and-endpoints)
- [Boba BNB  L2 (56288) for the BNB L1 (56)](#boba-bnb-testnet-l2--56288--for-the-bnb-l1--56-)
  * [Boba BNB Addresses](#boba-bnb-addresses)
  * [Analytics and eth_getLogs for Boba BNB](#analytics-and-eth-getlogs-for-boba-bnb)
  * [Boba BNB Links and Endpoints](#boba-bnb-links-and-endpoints)
  
# Boba BNB Testnet L2 (9728) for the BNB Testnet (97)

## Testnet Fountain for Developers on BNB Testnet L2

There is a Boba BNB testnet [fountain](https://gateway.testnet.bnb.boba.network) for `BOBA`. Authentication is via Twitter - please go to the gateway and connect your MetaMask wallet to the Boba BNB testnet L2. In **gateway > wallet**, you will see the `Developer Twitter/Turing test token fountain`. This system uses Turing hybrid compute to interact with Twitter.

## Bridging

The standard bridges for `GLMR` (aka `DEV` on Moonbase) and `BOBA` are active, so you can can both bridge and exit `GLMR` and `BOBA` from BNB testnet to Boba BNB testnet and back. The exit delay (the fraud proof window) has been set to 5 minutes (it's normally 7 days) to make development easier.

## Analytics and eth_getLogs

If you have unusual `getLogs` needs, especially calls from `0 to latest`, the main RPC will block you, since this is how most DoS attacks work. In those cases, we encourage you to run your own RPC endpoint on your own replica of Boba BNB testnet. We have prepared Docker images for you, so this should only take a few minutes. To access these images:

* clone the `boba` repo
* switch to `alt-l1` branch.
* Add `.env` in [boba-node](https://github.com/bobanetwork/boba/tree/alt-l1/boba_community/boba-node) folder

  ```
  RELEASE_VERSION=v0.X.X
  ```

The docker-compose file is in [`boba-community/boba-node/docker-compose-bobabnb-testnet.yml`](https://github.com/bobanetwork/boba/tree/alt-l1/boba_community/boba-node).

```bash
$ docker compose -f docker-compose-bobabnb-testnet.yml pull
$ docker compose -f docker-compose-bobabnb-testnet.yml up
```

The DTL will first sync with the chain. During the sync, you will see the DTL and Replica gradually catch up with the Boba L2. This can take several minutes to several hours, depending on which chain you are replicating.

## Boba BNB Testnet Addresses

For **primary contracts and addresses** see [packages/contracts/deployments/bobabnbtestnet/README.md](../../packages/contracts/deployments/bobabnbtestnet/README.md)

For **secondary addresses**, such as L2 Tokens and Messengers, please see the [Boba BNB testnet address registration dump](../../packages/boba/register/addresses/addressBobaBnbTestnet_0xAee1fb3f4353a9060aEC3943fE932b6Efe35CdAa.json).

## Boba BNB Testnet Links and Endpoints

|               |                                                              |
| ------------- | ------------------------------------------------------------ |
| ChainID       | 9728                                                         |
| RPC           | [https://testnet.bnb.boba.network](https://testnet.bnb.boba.network) |
| Replica RPC   | [https://replica.testnet.bnb.boba.network](https://replica.testnet.bnb.boba.network) |
| Gateway       | [https://gateway.testnet.bnb.boba.network](https://gateway.testnet.bnb.boba.network) |
| Blockexplorer | [https://blockexplorer.testnet.bnb.boba.network](https://blockexplorer.testnet.bnb.boba.network) |
| Websocket     | [wss://wss.testnet.bnb.boba.network](wss://wss.testnet.bnb.boba.network) |

# Boba BNB L2 (56288) for the BNB L1 (56)

## Analytics and eth_getLogs for Bobabeam

To access these images:

* clone the `boba` repo

* switch to `alt-l1` branch.

* Add `.env` in [boba-node](https://github.com/bobanetwork/boba/tree/alt-l1/boba_community/boba-node) folder

  ```
  RELEASE_VERSION=v0.X.X
  ```

The bobabeam's docker-compose file is in [`boba-community/boba-node/docker-compose-bobabnb.yml`](https://github.com/bobanetwork/boba/tree/alt-l1/boba_community/boba-node)

```bash
$ docker compose -f docker-compose-bobabnb.yml pull
$ docker compose -f docker-compose-bobabnb.yml up
```



## Boba BNB Addresses

For **primary contracts and addresses** see [packages/contracts/deployments/bobabnb/README.md](../../packages/contracts/deployments/bobabnb/README.md)

For **secondary addresses**, such as L2 Tokens and Messengers, please see the [Boba BNB address registration dump](../../packages/boba/register/addresses/addressBobaBnb_0xeb989B25597259cfa51Bd396cE1d4B085EC4c753.json).

## Boba BNB Links and Endpoints (tbd)

|               |                                                              |
| ------------- | ------------------------------------------------------------ |
| ChainID       | 56288                                                        |
| RPC           | [https://bnb.boba.network](https://bnb.boba.network)         |
| Replica RPC   | [https://replica.bnb.boba.network](https://replica.bnb.boba.network) |
| Gateway       | [https://gateway.bnb.boba.network](https://gateway.bnb.boba.network) |
| Blockexplorer | [https://blockexplorer.bnb.boba.network](https://blockexplorer.bnb.boba.network) |
| Websocket     | [wss://wss.bnb.boba.network](wss://wss.bnb.boba.network)     |
