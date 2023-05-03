---
description: A collection of links and addresses to get started on Boba-Fantom
---

# Contract Addresses Boba/Fantom

* [Bobaopera Testnet L2 (4051) for the Fantom Testnet (4002)](network-fantom.md#bobaopera-testnet-l2--4051--for-the-fantom-testnet--4002-)
  * [Testnet Fountain for Developers on Bobaopera L2](network-fantom.md#testnet-fountain-for-developers-on-bobaopera-testnet-l2)
  * [Bridging](network-fantom.md#bridging)
  * [Analytics and eth\_getLogs](network-fantom.md#Analytics-and-eth-getlogs)
  * [Bobaopera Testnet Addresses](network-fantom.md#bobaopera-testnet-addresses)
  * [Bobaopera Testnet Links and Endpoints](network-fantom.md#bobaopera-testnet-links-and-endpoints)
* [Bobaopera L2 (301) for the Fantom L1 (250)](network-fantom.md#bobaopera-l2--301--for-the-fantom-l1--250-)
  * [Bobaopera Addresses](network-fantom.md#bobaopera-addresses)
  * [Analytics and eth\_getLogs for Bobaopera](network-fantom.md#analytics-and-eth-getlogs-for-bobaopera)
  * [Bobaopera Links and Endpoints](network-fantom.md#bobaopera-links-and-endpoints)



<figure><img src="../../.gitbook/assets/Artboard 1 (1) (3).png" alt=""><figcaption></figcaption></figure>

### Testnet Fountain for Developers on Bobaopera Testnet L2

There is a Bobaopera testnet [fountain](https://gateway.boba.network) for `BOBA`. Authentication is via Twitter - please go to the gateway and connect your MetaMask wallet to the Bobaopera Testnet L2. In **gateway > wallet**, you will see the `Developer Twitter/Turing test token fountain`. This system uses Turing hybrid compute to interact with Twitter.

### Bridging

The standard bridges for `FTM` and `BOBA` are active, so you can can both bridge and exit `FTM` and `BOBA` from Famtom Testnet to Bobaopera Testnet and back.

### Analytics and eth\_getLogs

If you have unusual `getLogs` needs, especially calls from `0 to latest`, the main RPC will block you, since this is how most DoS attacks work. In those cases, we encourage you to run your own RPC endpoint on your own replica of Bobaopera. We have prepared Docker images for you, so this should only take a few minutes. To access these images:

* clone the `boba` repo
* switch to `alt-l1` branch.
*   Add `.env` in [boba-node](https://github.com/bobanetwork/boba/tree/alt-l1/boba\_community/boba-node) folder

    ```
    RELEASE_VERSION=v0.X.X
    ```

The docker-compose file is in [`boba-community/boba-node/docker-compose-bobaopera-testnet.yml`](https://github.com/bobanetwork/boba/tree/alt-l1/boba\_community/boba-node).

```bash
$ docker compose -f docker-compose-bobaopera-testnet.yml pull
$ docker compose -f docker-compose-bobaopera-testnet.yml up
```

The DTL will first sync with the chain. During the sync, you will see the DTL and Replica gradually catch up with the Boba L2. This can take several minutes to several hours, depending on which chain you are replicating.

### Bobaopera Testnet Addresses

For **primary contracts and addresses** see [packages/contracts/deployments/bobaoperatestnet/README.md](../../packages/contracts/deployments/bobaoperatestnet/)

For **secondary addresses**, such as L2 Tokens and Messengers, please see the [Bobaopera Testnet address registration dump](../../packages/boba/register/addresses/addressesBobaOperaTestnet\_0x12ad9f501149D3FDd703cC10c567F416B7F0af8b.json).

### Bobaopera Testnet Links and Endpoints

|               |                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------ |
| ChainID       | 4051                                                                                       |
| RPC           | [https://testnet.bobaopera.boba.network](https://testnet.bobaopera.boba.network)           |
| Replica RPC   | [https://replica.testnet.bobaopera.boba.network](https://replica.testnet.bobaopera.boba.network) |
| Gateway       | [https://gateway.boba.network](https://gateway.boba.network)             |
| Blockexplorer | [https://blockexplorer.testnet.bobaopera.boba.network](https://blockexplorer.testnet.bobaopera.boba.network) |
| Websocket     | [wss://wss.testnet.bobaopera.boba.network](wss://wss.testnet.bobaopera.boba.network)       |
| Gas Cap       | 50000000                                                                                   |



<figure><img src="../../.gitbook/assets/Artboard 2 (1) (3).png" alt=""><figcaption></figcaption></figure>

### Analytics and eth\_getLogs for Bobaopera

To access these images:

* clone the `boba` repo
* switch to `alt-l1` branch.
*   Add `.env` in [boba-node](https://github.com/bobanetwork/boba/tree/alt-l1/boba\_community/boba-node) folder

    ```
    RELEASE_VERSION=v0.X.X
    ```

The bobaopera's docker-compose file is in [`boba-community/boba-node/docker-compose-bobaopera.yml`](https://github.com/bobanetwork/boba/tree/alt-l1/boba\_community/boba-node)

```bash
$ docker compose -f docker-compose-bobaopera.yml pull
$ docker compose -f docker-compose-bobaopera.yml up
```

### Bobaopera Addresses (tbd)

For **primary contracts and addresses** see [packages/contracts/deployments/bobaopera/README.md](../../packages/contracts/deployments/bobaopera/)

For **secondary addresses**, such as L2 Tokens and Messengers, please see the [Bobaopera address registration dump](../../packages/boba/register/addresses/addressesBobaOpera\_0xTBATBATBATBA.json).

### Bobaopera Links and Endpoints (tbd)

|               |                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------ |
| ChainID       | 301                                                                                        |
| RPC           | [https://bobaopera.boba.network](https://bobaopera.boba.network)                           |
| Replica RPC   | [https://replica.bobaopera.boba.network](https://replica.bobaopera.boba.network)           |
| Gateway       | [https://gateway.boba.network](https://gateway.boba.network)             |
| Blockexplorer | [https://blockexplorer.bobaopera.boba.network](https://blockexplorer.bobaopera.boba.network) |
| Websocket     | [wss://wss.bobaopera.boba.network](wss://wss.bobaopera.boba.network)                       |
| Gas Cap       | 50000000                                                                                   |
