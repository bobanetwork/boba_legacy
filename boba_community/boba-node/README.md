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
$ docker compose pull
```

Then, add your Infura key to `boba_community/boba-node/docker-compose.yaml`. If you do not have an Infura key, you can obtain one for free from [Infura](https://infura.io) or any other node provider.

```bash
x-l1_rpc_dtl: &l1_rpc_dtl
  DATA_TRANSPORT_LAYER__L1_RPC_ENDPOINT: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY'

x-l1_rpc_geth: &l1_rpc_geth
  ETH1_HTTP: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY'
```

Bring up the services:

```bash

docker-compose up

```

There will be occasional updates to both services. You can update them by running:

```bash
docker compose pull
```

and bringing the services up again. We suggest you keep the storage volume of the replica mounted on the host. The replica stores its data in `/root/.ethereum/`.
