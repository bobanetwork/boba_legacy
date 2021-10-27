- [Fraud Detector](#fraud-detector)
  * [0. Concepts](#0-concepts)
  * [1. Errors and State Root Mismatches in the Boba Mainnet](#1-errors-and-state-root-mismatches-in-the-boba-mainnet)
  * [2. What do when you discover a state root mismatch](#2-what-do-when-you-discover-a-state-root-mismatch)
  * [3. Running the Fraud Detector, the Verifier, and the Data Transport Layer (DTL)](#3-running-the-fraud-detector--the-verifier--and-the-data-transport-layer--dtl-)

# Fraud Detector

A docker script for running a *Verifier*, a *DTL* (data transport layer), and a *fraud-detector* service.

## 0. Concepts

This repo allows you to: 

1. Run your own Boba geth L2 on your computer. In this case, the geth L2 will run in its `Verifier` mode. In `Verifier` mode, the geth will sync from L1 and use the transaction data from the L1 contracts to compute what the state roots should be, *if the operator is honest*.

2. A separate service, the *fraud-detector*, can then be used to discover potential fraud. Briefly, the fraud detection process consists of requesting a state root from Boba Mainnet L1 and requesting a state root from your Verifier. If those state roots match, then, the operator has been honest. If they do not match, then, that **might** be due to fraud, or, could also indicate indexing or timestamp errors, or chain configuration errors.

The central idea is that if two (or more) systems look at the same transactions, then they should all generate the same state roots. If they don't, then there is a problem somewhere. Fundamentally, the security of rollups has little to do with math or cryptography - rather, security arises from the operator publicly depositing transactions and their corresponding state roots, and then, **having many independent nodes check those data for possible discrepancies**.

## 1. Errors and State Root Mismatches in the Boba Mainnet

* For the first 10 blocks, the chainID was set (incorrectly) to 28 rather than 288. Therefore, the EIP155 signatures fail for those blocks, and the Verifier cannot sync those blocks. This has been addressed by setting the L1_MAINNET_DEPLOYMENT_BLOCK to 10 blocks past the zero block. 

* There is one state root mismatch at L2 block 155, arising from a two second discrepancy in a timestamp, that was ultimately caused by a too-small setting for the number of confirmations (DATA_TRANSPORT_LAYER__CONFIRMATIONS). This value was therefore increased to 4. The 2 second block 155 timestamp discrepancy has been addressed in a custom docker image (`omgx/data-transport-layer:rc1.0-surgery`). 

## 2. What do when you discover a state root mismatch

Congratulations! The security of the L2 depends on community monitoring of the operator's actions. If you have discovered a state root mismatch, please file a GitHub issue (https://github.com/omgnetwork/optimism/issues). We should have a good response / clarification for you quickly. In the future, with the Boba governance token, additional mechanisms will be released to incentivize and reward community monitoring of the Boba L2.  

## 3. Running the Fraud Detector, the Verifier, and the Data Transport Layer (DTL)

**Requirements**: you will need a command line and Docker.

**Open a terminal window**. Create a `.env` file from the provided example (`env.example`) and paste in your Infura key. You can get a free Infura key at https://infura.io. Your `.env` should then look like this (except that you will be using your Infura key):

```bash

L1_NODE_WEB3_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
ADDRESS_MANAGER_ADDRESS=0x8376ac6C3f73a25Dd994E0b0669ca7ee0C02F089
L1_MAINNET_DEPLOYMENT_BLOCK=13011896

```

Then, start the Fraud Prover, Verifier, and DTL by:

```bash

$ ./up_local.sh

```

The L2 will spin up and begin to sync with the Boba L1. **NOTE: the sync process can take ~2 hours to complete**. During the sync process, you will see the Verifier gradually catch up with the Boba L2:

```bash

data_transport_layer_1  | {"level":30,"time":1632868364830,"method":"GET","url":"/eth/syncing?backend=l1","elapsed":0,"msg":"Served HTTP Request"}
geth_l2_1               | INFO [09-28|22:32:44.831] Still syncing                            index=9 tip=2706
data_transport_layer_1  | {"level":30,"time":1632868374830,"method":"GET","url":"/eth/syncing?backend=l1","elapsed":1,"msg":"Served HTTP Request"}
geth_l2_1               | INFO [09-28|22:32:54.831] Still syncing                            index=11 tip=2706

```

When your Verifier has caught up with the Boba L2, then you will see it fetching transactions and performing other L2 operations: 

```bash

data_transport_layer_1  | {"level":30,"time":1632875212812,"method":"GET","url":"/batch/transaction/latest","elapsed":1,"msg":"Served HTTP Request"}
geth_l2_1               | INFO [09-29|00:26:52.813] Set L2 Gas Price                         gasprice=0

```

The Fraud Detector will then fire up and cache relevant events from the chain. After caching older chain data, which should take at most 30 minutes, the Fraud Detector will then verify each state root: 

```bash

data_transport_layer_1  | {"level":30,"time":1632965735657,"method":"GET","url":"/eth/gasprice","elapsed":1310,"msg":"Served HTTP Request"}
geth_l2_1               | INFO [09-30|01:35:35.658] Set L1 Gas Price                         gasprice=88121008566
data_transport_layer_1  | {"level":30,"time":1632965735660,"method":"GET","url":"/batch/transaction/latest","elapsed":1,"msg":"Served HTTP Request"}
geth_l2_1               | INFO [09-30|01:35:35.661] Set L2 Gas Price                         gasprice=3000000000
fraud_detector_1        | New L1 blocks to inspect: 41
fraud_detector_1        | Scanning L1 from 13324134 to 13324175
fraud_detector_1        | Adding 0 new L2blocks: []
geth_l2_1               | DEBUG[09-30|01:35:36.232] Served eth_getBlockByNumber              conn=172.18.0.4:40504 reqid=858 t=219.754µs
fraud_detector_1        | {"level":30,"time":1632965736232,
      "L2_block":825,
      "operatorSR":"0x26ec701d6375df51b074c8e9efb1f07e7edcd1e8bcd10a2c356442db80a45fe1",
      "verifierSR":"0x26ec701d6375df51b074c8e9efb1f07e7edcd1e8bcd10a2c356442db80a45fe1",
      "msg":"State root MATCH - verified ✓"
    }
fraud_detector_1        | 
fraud_detector_1        | ***********************************************************
fraud_detector_1        | State root MATCH - verified ✓ L2 Block number 825
fraud_detector_1        | ***********************************************************

```