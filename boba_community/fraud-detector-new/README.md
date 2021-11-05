# Checking Boba Mainnet for Fraud

## Getting started

First, make sure Docker is installed and running. Then, add your Infura key to `/deployments/mainnet/env`. If you do not have an Infura key, you can obtain one for free from [Infura](https://infura.io). 

```bash

#/deployments/mainnet/env

TARGET_NAME="mainnet"
L1_RPC_ENDPOINT="https://mainnet.infura.io/v3/YOUR_INFURA_KEY_HERE"
L2_RPC_ENDPOINT="https://mainnet.boba.network"
ETH1_CTC_DEPLOYMENT_HEIGHT=13502893
ADDRESS_MANAGER="0x8376ac6C3f73a25Dd994E0b0669ca7ee0C02F089"
L2_CHAIN_ID=288

```

## Build the needed Docker images

```
docker-compose -f docker-compose-fraud-detector.yml --env-file deployments/local/env build
```

## Create the default docker network (if needed)

```
docker network create ops_default
```

## Spin up the `Fraud Detector` and other neccessary services (the `Verifier L2 Geth` and the `Data Transport Layer`)

```
docker-compose -f docker-compose-fraud-detector.yml --env-file deployments/mainnet/env up
```

The system will start and the `Verifier L2 Geth` will begin to sync with the Boba L2 via data it deposited into the core Boba contracts on Ethereum Mainnet:

```bash

verifier_dtl_1    | {"level":30,"time":...,"highestSyncedL1Block":...,"targetL1Block":...,"msg":"Synchronizing events from Layer 1 (Ethereum)"}
verifier_l2geth_1 | INFO [11-05|17:12:47.725] Still syncing                            index=69 tip=7806
fraud-detector_1  | INFO 20211105T171441 Waiting for verifier...

```

After some delay (approximately one hour per 5000 blocks) the Verifier L2 Geth will be fully synced and `fraud-detector.py` can begin its work.

