# Running a Boba node (replica)

This material has been moved to the main Boba user docs [here](https://docs.boba.network/developer-docs/011_running-replica-node).

## Minimal Instructions

This repo runs a local replica of the Boba L2geth, which is useful for generating analyics for blockexplorers.

## Prerequisites

\- docker

\- docker-compose

## Start Replica service

**Requirements**: you will need a command line and Docker. Before filing GitHub issues, please make sure Docker is installed and *running*. 

**Open a terminal window**. Clone the project and install needed dependencies:

```bash
$ git clone git@github.com:omgnetwork/optimism-v2.git
$ cd optimism-v2
$ yarn install
$ yarn build
$ cd boba_community/boba-node
```

Then, add your Infura key to `boba_community/boba-node/docker-compose-replica.yaml`. If you do not have an Infura key, you can obtain one for free from [Infura](https://infura.io). 

```bash
x-l1_rpc_dtl: &l1_rpc_dtl
  DATA_TRANSPORT_LAYER__L1_RPC_ENDPOINT: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY'

x-l1_rpc_geth: &l1_rpc_geth
  ETH1_HTTP: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY'
```

Next, build the packages:

```bash

docker-compose -f docker-compose-replica.yml build

```

Finally, bring up the services:

```bash

docker-compose -f docker-compose-replica.yml up

```