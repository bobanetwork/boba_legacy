# Running a Boba node (replica)

The [boba_community/boba-node](../../boba_community/boba-node) repo runs a replica of the Boba L2geth, which is useful for generating analytics for blockexplorers and other specialized use cases.

## Basic Considerations

1. Running a local Boba node (replica) does not allow you to mine ETH, OMG, or BOBA. There is no mining on L2.

2. If you looking for best possible rpc read data (lowest possible latency) you are **strongly advised** not to run your own node, but to use **https://replica.boba.network**. This is an autoscaling rpc endpoint that speaks directly to the core Boba L2 geth.

3. The Boba L2 is (at present) a single proposer/sequencer system and the only way to write transactions is via **https://mainnet.boba.network**. You cannot use a local node to write transactions.

4. If your application _does not need autoscaling and low latency_, and can tolerate sync delays, you can run your own Boba node (replica). This replica will try to follow the core L2 geth via data provided by Infura and **https://replica.boba.network**, so it will necessarily lag behind **https://replica.boba.network**.

5. Please design your rpc connectors in a resource efficient manner. Notably, calling `eth_getLogs(fromBlock: 0)` 1000 times per second serves no conceivable purpose since the Ethereum blocktime is 12 seconds and the Boba blocktime is > 1 second. All that does is to degrade your replica and trigger rate-limiting and/or IP blocking at **https://replica.boba.network**.

## Prerequisites

\- docker
\- docker-compose

## Start Replica service

**Requirements**: you will need a command line and Docker. Before filing GitHub issues, please make sure Docker is installed and *running*.

**Open a terminal window**. Clone the project and install needed dependencies:

```bash
$ git clone https://github.com/bobanetwork/boba.git
$ cd boba_community/boba-node
```

**Create a .env file**. Create a  `.env` file in `boba_community/boba-node`. 

```yaml
# release tag
RELEASE_VERSION=v0.X.X
```

**Pull images**

```bash
$ docker compose pull # for mainnet
# or...
$ docker compose -f docker-compose-goerli.yml pull #for goerli
```

**Start your replica node**

```bash
$ docker-compose up  # for mainnet
# or...
$ docker compose -f docker-compose-goerli.yml up #for goerli
```

The DTL will first sync with the chain. During the sync, you will see the DTL and Replica gradually catch up with the Boba L2. This can take several minutes to several hours, depending on which chain you are replicating.

**DTL syncing**

```bash
dtl        | {"level":30,"time":1650658119224,"fromBlock":13001,"toBlock":14001,"msg":"Synchronizing unconfirmed transactions from Layer 2 (Optimism)"}
```

**Replica replaying transactions**

```bash
dtl        | {"level":30,"time":1650659925936,"method":"GET","url":"/transaction/index/8074?backend=l2","elapsed":0,"msg":"Served HTTP Request"}
replica    | TRACE[04-22|20:38:45.938] Applying indexed transaction             index=8074
replica    | DEBUG[04-22|20:38:45.938] Applying transaction to tip              index=8074  hash=0x6ae363fcfe8ef71f115d643844b0bed340e95f8a9ec311b466f952b38c94b18b origin=sequencer
replica    | TRACE[04-22|20:38:45.938] Waiting for transaction to be added to chain hash=0x6ae363fcfe8ef71f115d643844b0bed340e95f8a9ec311b466f952b38c94b18b
replica    | DEBUG[04-22|20:38:45.938] Attempting to commit rollup transaction  hash=0x6ae363fcfe8ef71f115d643844b0bed340e95f8a9ec311b466f952b38c94b18b
replica    | DEBUG[04-22|20:38:45.941] Adding extra L2 fee                      extra-l2-fee=543000000000
replica    | DEBUG[04-22|20:38:45.941] Total fee                                total-fee=500543000000000
```

## Updating services

There will be occasional updates to both services. You can update them by updating `RELEASE_VERSION` in the `.env` file first, then running:

```bash
docker compose pull
```

and bringing the services up again. **We suggest you keep the storage volume of the replica mounted on the host**. The replica stores its data in `/root/.ethereum/`.
