# Checking Boba Mainnet for Fraud

- [Fraud Detector](#fraud-detector)
  * [0. Concepts](#0-concepts)
  * [1. Errors and State Root Mismatches in Boba](#1-known-errors-and-state-root-mismatches-in-boba)
  * [2. What do when you discover a state root mismatch](#2-what-do-when-you-discover-a-state-root-mismatch)
  * [3. Running the Fraud Detector, the Verifier, and the Data Transport Layer (DTL)](#3-running-the-fraud-detector--the-verifier--and-the-data-transport-layer--dtl-)

# Fraud Detector

Docker scripts and python source code for running a *Verifier*, a *DTL* (data transport layer), and a *fraud-detector* service.

## 0. Concepts

This repo allows you to:

1. Run your own Boba geth L2 on your computer. In this case, the geth L2 will run in its `Verifier` mode. In `Verifier` mode, the geth will sync from L1 and use the transaction data from the L1 contracts to compute what the state roots should be, *if the operator is honest*.

2. A separate service, the *fraud-detector*, can then be used to discover potential fraud. Briefly, the fraud detection process consists of requesting a state root from Boba and requesting a state root from your Verifier. If those state roots match, then, the operator has been honest. If they do not match, then, that **might** be due to fraud, or, could also indicate indexing errors, timestamp errors, or chain configuration errors.

The central idea is that if two (or more) geths injects the same transactions, then they should write the same blocks with the same state roots. If they don't, then there is a problem somewhere. Fundamentally, the security of rollups has little to do with math or cryptography - rather, security arises from the operator publicly depositing transactions and their corresponding state roots, and then, **having many independent nodes check those data for possible discrepancies**.

## 1. Known Errors and State Root Mismatches in Boba

* For the first 10 blocks, the chainID was set (incorrectly) to 28 rather than 288. Therefore, the EIP155 signatures fail for those blocks, and the Verifier cannot sync those blocks. This has been addressed by setting the L1_MAINNET_DEPLOYMENT_BLOCK to 10 blocks past the zero block.

* There is one state root mismatch at L2 block 155, arising from a two second discrepancy in a timestamp, that was ultimately caused by a too-small setting for the number of confirmations (DATA_TRANSPORT_LAYER__CONFIRMATIONS). This value was therefore increased.

## 2. What do when you discover a state root mismatch

Congratulations! The security of the L2 depends on community monitoring of the operator's actions. If you have discovered a state root mismatch, please file a GitHub issue (https://github.com/bobanetwork/boba/issues). We should have a good response/clarification for you quickly. In the future, with the Boba governance token, additional mechanisms will be released to incentivize and reward community monitoring of Boba.

## 3. Running the Fraud Detector, the Verifier, and the Data Transport Layer (DTL)

**Requirements**: you will need a command line and Docker. Before filing GitHub issues, please make sure Docker is installed and *running*.

**Open a terminal window**. First, clone the project and install needed dependencies:

```bash
$ git clone git@github.com:bobanetwork/boba.git
$ cd boba
$ yarn install
$ yarn build
```

Then, add your Infura key to `boba_community/fraud-detector/docker-compose-fraud-detector.yml`. If you do not have an Infura key, you can obtain one for free from [Infura](https://infura.io).

```bash
x-l1_rpc_dtl: &l1_rpc_dtl
  DATA_TRANSPORT_LAYER__L1_RPC_ENDPOINT: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY'

x-l1_node_web3_url: &l1_node_web3_url
  L1_NODE_WEB3_URL: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY'
```

Next, navigate to `boba_community/fraud-detector` and build the needed Docker images:

```
$ cd boba_community/fraud-detector
```

Next, spin up the `Fraud Detector` and other neccessary services (the `Verifier L2 Geth` and the `Data Transport Layer`)

```
$ docker-compose up
```

Finally, **Open another terminal window** and upload the `addresses.json` to the `data transport layer` service.

```bash
$ cd boba/boba_community/fraud-detector
$ curl -H "Content-Type: application/json" -T ./addresses.json http://localhost:8080/addresses.json
```

The system will start and the `Verifier L2 Geth` will begin to sync with the Boba L2 via data it deposited into the core Boba contracts on Ethereum Mainnet. **The sync process can take several hours to complete**. During the sync process, you will see the Verifier gradually catch up with the Boba L2:

```bash

fraud-detector_1   | INFO 20220226T190002 Waiting for verifier...
verifier_dtl_1     | {"level":30,"time":1645902005875,"method":"GET","url":"/eth/syncing?backend=l1","elapsed":1,"msg":"Served HTTP Request"}
verifier_l2geth_1  | INFO [02-26|19:00:05.876] Still syncing index=2228 tip=363424

```

When the `Verifier L2 Geth` has caught up, you will see it follow along with the Boba L2 Geth:

```bash

verifier_l2geth_1  | DEBUG[11-05|17:36:26.226] Reinjecting stale transactions           count=0
verifier_l2geth_1  | TRACE[11-05|17:36:26.226] Applying batched transaction             index=7828
verifier_l2geth_1  | TRACE[11-05|17:36:26.226] Applying indexed transaction             index=7828
verifier_l2geth_1  | DEBUG[11-05|17:36:26.226] Applying transaction to tip              index=7828  hash=0xbfbc45382be5b47ec39398af8db5401a39d0826201d10103e49d0821d425d40e origin=sequencer
verifier_l2geth_1  | TRACE[11-05|17:36:26.227] Waiting for transaction to be added to chain hash=0xbfbc45382be5b47ec39398af8db5401a39d0826201d10103e49d0821d425d40e
verifier_l2geth_1  | DEBUG[11-05|17:36:26.227] Attempting to commit rollup transaction  hash=0xbfbc45382be5b47ec39398af8db5401a39d0826201d10103e49d0821d425d40e
verifier_l2geth_1  | DEBUG[11-05|17:36:26.227] Adding L1 fee                            l1-fee=9693
verifier_l2geth_1  | INFO [11-05|17:36:26.228] New block                                index=7828  l1-timestamp=1636132977 l1-blocknumber=13557931 tx-hash=0xbfbc45382be5b47ec39398af8db5401a39d0826201d10103e49d0821d425d40e queue-orign=sequencer gas=234861  fees=0.00234861      elapsed=1.375ms
verifier_l2geth_1  | TRACE[11-05|17:36:26.228] Waiting for slot to sign and propagate   delay=0s
verifier_l2geth_1  | DEBUG[11-05|17:36:26.229] Persisted trie from memory database      nodes=48 size=14.23KiB  time=456.119µs   gcnodes=0 gcsize=0.00B gctime=0s livenodes=1 livesize=-1868160.00B
verifier_l2geth_1  | DEBUG[11-05|17:36:26.229] Reinjecting stale transactions           count=0
verifier_l2geth_1  | DEBUG[11-05|17:36:26.229] Miner got new head                       height=7829 block-hash=0x2a4ec268eb3816a09365880ad2e5fc8b89a5570e555838c2b93ccae21157af30 tx-hash=0xbfbc45382be5b47ec39398af8db5401a39d0826201d10103e49d0821d425d40e tx-hash=0xbfbc45382be5b47ec39398af8db5401a39d0826201d10103e49d0821d425d40e
verifier_dtl_1     | {"level":30,"time":1636133786230,"method":"GET","url":"/batch/transaction/latest","elapsed":1,"msg":"Served HTTP Request"}
verifier_dtl_1     | {"level":30,"time":1636133786232,"method":"GET","url":"/batch/transaction/latest","elapsed":1,"msg":"Served HTTP Request"}
verifier_l2geth_1  | DEBUG[11-05|17:36:26.243] Served eth_blockNumber                   conn=172.18.0.4:44544 reqid=147 t=24.086µs
verifier_l2geth_1  | DEBUG[11-05|17:36:26.244] Served eth_getBlockByNumber              conn=172.18.0.4:44544 reqid=148 t=177.276µs
fraud-detector_1   | INFO 20211105T173626 74 13508337 0xd05bfa4e2269e584b95348b070673d2f64a5ee8dbb198f7fa78ee7deac338007 0xd05bfa4e2269e584b95348b070673d2f64a5ee8dbb198f7fa78ee7deac338007 0xd05bfa4e2269e584b95348b070673d2f64a5ee8dbb198f7fa78ee7deac338007

```

At that point, the `Fraud Detector` can compare the public state roots (deposited into Ethereum by the Boba L2) with the state roots that you have computed:

```bash

fraud-detector_1   | INFO 20211105T173626 79 13508337
  0x4809dde56bb792a27ea26b16b75790705edcaf67c2f7db33bb95417277897c0d #the SCC-STATEROOT, written into Ethereum by Boba
  0x4809dde56bb792a27ea26b16b75790705edcaf67c2f7db33bb95417277897c0d #the L2-STATEROOT, as reported by Boba
  0x4809dde56bb792a27ea26b16b75790705edcaf67c2f7db33bb95417277897c0d #the VERIFIER-STATEROOT you just calculated

```

If all three of these roots agree, then Boba has been operating truthfully up to that block. If the `Fraud-Detector` finds a mismatch, it will log that problem for you. Once the `Fraud-Detector` has checked all the historical state roots, it will wait for new blocks to be written by Boba and check those, one by one:

```bash

...
fraud-detector_1   | INFO 20211105T175039 7788 13557689
  0x0b40758bc7b6c2f9a95dc4af995a3c514a3b217d58e426c4f12bc94a0d6c8a0c
  0x0b40758bc7b6c2f9a95dc4af995a3c514a3b217d58e426c4f12bc94a0d6c8a0c
  0x0b40758bc7b6c2f9a95dc4af995a3c514a3b217d58e426c4f12bc94a0d6c8a0c
fraud-detector_1   | DEBUG 20211105T175040 Caught up to L1 tip. Waiting for new events from startBlock 13557996
verifier_dtl_1     | {"level":30,"time":1636134645380,"highestSyncedL1Block":13558055,"targetL1Block":13558056,"msg":"Synchronizing events from Layer 1 (Ethereum)"}
...

```
