# Running a Boba node (replica)

The [boba_community/boba-node](../../boba_community/boba-node) repo runs a replica of the Boba L2geth, which is useful for generating analytics for blockexplorers and other specialized use cases.

## Basic Considerations

1. Running a local Boba node (replica) does not allow you to mine ETH, OMG, or BOBA. There is no mining on L2.  

2. If you looking for best possible rpc read data (lowest possible latency) you are **strongly advised** not to run your own node, but to use **https://lightning-replica.boba.network**. This is an autoscaling rpc endpoint that speaks directly to the core Boba L2 geth.  

3. The Boba L2 is (at present) a single proposer/sequencer system and the only way to write transactions is via **https://mainnet.boba.network**. You cannot use a local node to write transactions.

4. If your application _does not need autoscaling and low latency_, and can tolerate sync delays, you can run your own Boba node (replica). This replica will try to follow the core L2 geth via data provided by Infura and **https://lightning-replica.boba.network**, so it will necessarily lag behind **https://lightning-replica.boba.network**.  

5. Please design your rpc connectors in a resource efficient manner. Notably, calling `eth_getLogs(fromBlock: 0)` 1000 times per second serves no conceivable purpose since the Ethereum blocktime is 12 seconds and the Boba blocktime is > 1 second. All that does is to degrade your replica and trigger rate-limiting and/or IP blocking at **https://lightning-replica.boba.network**.  

## Prerequisites

\- docker
\- docker-compose

## Start Replica service

**Requirements**: you will need a command line and Docker. Before filing GitHub issues, please make sure Docker is installed and *running*.

**Open a terminal window**. Clone the project and install needed dependencies:

```bash
$ git clone https://github.com/bobanetwork/boba.git
$ cd boba_community/boba-node

$ docker compose pull # for mainnet
# or...
$ docker compose -f docker-compose-rinkeby.yml pull #for rinkeby
```

Then, add your Infura key to `boba_community/boba-node/docker-compose.yaml`. If you do not have an Infura key, you can obtain one for free from [Infura](https://infura.io) or any other node provider.

```bash
x-l1_rpc_dtl: &l1_rpc_dtl
  DATA_TRANSPORT_LAYER__L1_RPC_ENDPOINT: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY'

x-l1_rpc_geth: &l1_rpc_geth
  ETH1_HTTP: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY'
```

For Rinkeby, replace `https://mainnet.infura.io/` with `https://rinkeby.infura.io/`. Then, select the correct state dump file from `/state-dumps`, move it up one level, and rename it to `state-dump.latest.json`. Then, bring up the services:

```bash
$ docker-compose up  # for mainnet
# or...
$ docker compose -f docker-compose-rinkeby.yml up #for rinkeby
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

There will be occasional updates to both services. You can update them by running:

```bash
docker compose pull
```

and bringing the services up again. **We suggest you keep the storage volume of the replica mounted on the host**. The replica stores its data in `/root/.ethereum/`.
