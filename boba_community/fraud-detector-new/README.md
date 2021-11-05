# Checking Boba Mainnet for Fraud

- [Fraud Detector](#fraud-detector)
  * [0. Concepts](#0-concepts)
  * [1. Errors and State Root Mismatches in the Boba Mainnet](#1-errors-and-state-root-mismatches-in-the-boba-mainnet)
  * [2. What do when you discover a state root mismatch](#2-what-do-when-you-discover-a-state-root-mismatch)
  * [3. Running the Fraud Detector, the Verifier, and the Data Transport Layer (DTL)](#3-running-the-fraud-detector--the-verifier--and-the-data-transport-layer--dtl-)

# Fraud Detector

Docker scripts and python source code for running a *Verifier*, a *DTL* (data transport layer), and a *fraud-detector* service.

## 0. Concepts

This repo allows you to: 

1. Run your own Boba geth L2 on your computer. In this case, the geth L2 will run in its `Verifier` mode. In `Verifier` mode, the geth will sync from L1 and use the transaction data from the L1 contracts to compute what the state roots should be, *if the operator is honest*.

2. A separate service, the *fraud-detector*, can then be used to discover potential fraud. Briefly, the fraud detection process consists of requesting a state root from Boba Mainnet L1 and requesting a state root from your Verifier. If those state roots match, then, the operator has been honest. If they do not match, then, that **might** be due to fraud, or, could also indicate indexing or timestamp errors, or chain configuration errors.

The central idea is that if two (or more) systems look at the same transactions, then they should all generate the same state roots. If they don't, then there is a problem somewhere. Fundamentally, the security of rollups has little to do with math or cryptography - rather, security arises from the operator publicly depositing transactions and their corresponding state roots, and then, **having many independent nodes check those data for possible discrepancies**.

## 1. Errors and State Root Mismatches in the Boba Mainnet

* For the first 10 blocks, the chainID was set (incorrectly) to 28 rather than 288. Therefore, the EIP155 signatures fail for those blocks, and the Verifier cannot sync those blocks. This has been addressed by setting the L1_MAINNET_DEPLOYMENT_BLOCK to 10 blocks past the zero block. 

* There is one state root mismatch at L2 block 155, arising from a two second discrepancy in a timestamp, that was ultimately caused by a too-small setting for the number of confirmations (DATA_TRANSPORT_LAYER__CONFIRMATIONS). This value was therefore increased to 4. The 2 second block 155 timestamp discrepancy has been addressed in a custom docker image (`omgx/data-transport-layer:rc1.0-surgery`). 

## 2. What do when you discover a state root mismatch

Congratulations! The security of the L2 depends on community monitoring of the operator's actions. If you have discovered a state root mismatch, please file a GitHub issue (https://github.com/omgnetwork/optimism-v2/issues). We should have a good response / clarification for you quickly. In the future, with the Boba governance token, additional mechanisms will be released to incentivize and reward community monitoring of the Boba L2.  

## 3. Running the Fraud Detector, the Verifier, and the Data Transport Layer (DTL)

**Requirements**: you will need a command line and Docker. Before filing GitHub issues, please make sure Docker is installed and *running*. 

**Open a terminal window**. Add your Infura key to `/deployments/mainnet/env`. If you do not have an Infura key, you can obtain one for free from [Infura](https://infura.io). 

```bash

#/deployments/mainnet/env

TARGET_NAME="mainnet"
L1_RPC_ENDPOINT="https://mainnet.infura.io/v3/YOUR_INFURA_KEY_HERE"
L2_RPC_ENDPOINT="https://mainnet.boba.network"
ETH1_CTC_DEPLOYMENT_HEIGHT=13502893
ADDRESS_MANAGER="0x8376ac6C3f73a25Dd994E0b0669ca7ee0C02F089"
L2_CHAIN_ID=288

```

Then, build the needed Docker images:

```
docker-compose -f docker-compose-fraud-detector.yml --env-file deployments/local/env build
```

You may need to create the default docker network:

```
docker network create ops_default
```

Finally, spin up the `Fraud Detector` and other neccessary services (the `Verifier L2 Geth` and the `Data Transport Layer`)

```
docker-compose -f docker-compose-fraud-detector.yml --env-file deployments/mainnet/env up
```

The system will start and the `Verifier L2 Geth` will begin to sync with the Boba L2 via data it deposited into the core Boba contracts on Ethereum Mainnet. **The sync process can take 2 hours to complete**. During the sync process, you will see the Verifier gradually catch up with the Boba L2:

```bash

verifier_dtl_1    | {"level":30,"time":...,"highestSyncedL1Block":...,"targetL1Block":...,"msg":"Synchronizing events from Layer 1 (Ethereum)"}
verifier_l2geth_1 | INFO [11-05|17:12:47.725] Still syncing                            index=69 tip=7806
fraud-detector_1  | INFO 20211105T171441 Waiting for verifier...

```

When your Verifier has caught up with the Boba L2, you will see the `Fraud Detector` verify state roots, one by one: 

```bash



```
