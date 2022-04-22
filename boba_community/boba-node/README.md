# Running a Boba node (replica)

User-facing instructions are [here](https://docs.boba.network/developer-docs/011_running-replica-node).

## Minimal Instructions

This repo runs a local replica of the Boba L2geth, which is useful for generating analytics for blockexplorers.

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
