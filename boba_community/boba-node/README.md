# Running a Boba node (replica)

This material has been moved to the main Boba user docs [here](https://docs.boba.network/user-docs/010_replica).






# Community Boba Node (Replica) Service

The `ops/docker-compose-replica.yml` docker-compose runs a local replica of the Boba L2geth, which is useful for generating analyics for blockexplorers.

## Prerequisites

\- docker
\- docker-compose

## Start Replica service

**Requirements**: you will need a command line and Docker. Before filing GitHub issues, please make sure Docker is installed and *running*. 

**Open a terminal window**. First, clone the project and install needed dependencies:

```bash
$ git clone git@github.com:omgnetwork/optimism-v2.git
$ cd optimism-v2
$ yarn install
$ yarn build
```


docker-compose -f docker-compose-replica.yml up


Then, add your Infura key to `boba_community/fraud-detector/deployments/mainnet/env`. If you do not have an Infura key, you can obtain one for free from [Infura](https://infura.io). 

```bash

#boba_community/fraud-detector/deployments/mainnet/env

TARGET_NAME="mainnet"
L1_RPC_ENDPOINT="https://mainnet.infura.io/v3/YOUR_INFURA_KEY_HERE"
L2_RPC_ENDPOINT="https://mainnet.boba.network"
ETH1_CTC_DEPLOYMENT_HEIGHT=13502893
ADDRESS_MANAGER="0x8376ac6C3f73a25Dd994E0b0669ca7ee0C02F089"
L2_CHAIN_ID=288

```

Next, navigate to `boba_community/fraud-detector` and build the needed Docker images:

```
$ cd boba_community/fraud-detector
$ docker-compose -f docker-compose-fraud-detector.yml --env-file deployments/local/env build
```

You may need to create the default docker network:

```
$ docker network create ops_default
```

Finally, spin up the `Fraud Detector` and other neccessary services (the `Verifier L2 Geth` and the `Data Transport Layer`)

```
$ docker-compose -f docker-compose-fraud-detector.yml --env-file deployments/mainnet/env up
```

The system will start and the `Verifier L2 Geth` will begin to sync with the Boba L2 via data it deposited into the core Boba contracts on Ethereum Mainnet. **The sync process can take 1/2 hour to complete**. During the sync process, you will see the Verifier gradually catch up with the Boba L2:

```bash

verifier_dtl_1    | {"level":30,"time":...,"highestSyncedL1Block":...,"targetL1Block":...,"msg":"Synchronizing events from Layer 1 (Ethereum)"}
verifier_l2geth_1 | INFO [11-05|17:12:47.725] Still syncing                            index=69 tip=7806
fraud-detector_1  | INFO 20211105T171441 Waiting for verifier...

```

### Configuration

Replace `INFURA_KEY` with your own key in [docker-compose-replica-service.yml](.ops/docker-compose-replica-service.yml). You can get a free Infura key from https://infura.io.

### Start the docker

Start the replica service via:

```bash
cd ops
docker-compose -f docker-compose-replica-service.yml up
```

This will pull two images from docker hub:

* [`data-tranport-layer`](https://hub.docker.com/layers/156092207/bobanetwork/data-transport-layer/production-v1/images/sha256-07d4415aab46863b8c7996c1c40f6221f3ac3f697485ccc262a3a6f0478aa4fb?context=explore): service that indexes transaction data from the L1 chain and L2 chain

* [`replica`](https://hub.docker.com/layers/157390249/bobanetwork/replica/production-v1/images/sha256-fc85c0db75352a911f49ba44372e087e54bd7123963f83a11084939f75581b37?context=explore): L2 geth node running in sync mode

### Common Errors

If you get this:

```bash
(node:1) UnhandledPromiseRejectionWarning: Error: could not detect network (event="noNetwork", code=NETWORK_ERROR, version=providers/5.1.0)
```

then you forgot to replace `INFURA_KEY` in this line: `DATA_TRANSPORT_LAYER__L1_RPC_ENDPOINT: https://rinkeby.infura.io/v3/INFURA_KEY` with your Infura key. Your Infura key will be a string like `c655138ed943455123456789123456789c`, so the final line will look something like this:

```bash
DATA_TRANSPORT_LAYER__L1_RPC_ENDPOINT: https://rinkeby.infura.io/v3/c655138ed943455123456789123456789c
```

