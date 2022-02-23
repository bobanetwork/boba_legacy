# NG - A Zipup

EARLY DRAFT - CHANGING CONTINUOUSLY

This directory contains the Portal and Ethpool contracts, along with a deployer script.

## Running the prototype

```bash
$ cd optimism-v2
$ yarn clean
$ yarn
$ yarn build
$ cd ops
$ BUILD=1 ./up_prototype.sh
```

## Philosophy

There are only two hard problems in distributed systems:  

2 - Exactly-once delivery 

1 - Guaranteed order of messages 

2 - Exactly-once delivery

(courtesy of @mathiasverraes)

## Basics

At the heart of all L2s is the ability to move information back and forth between two chains. Together, the *cost* of these messages, the *speed* of the messages, and the *security* of the messages, determine major performance characteristics of the L2 such as cost savings relative to L1, snappy performance, and secure bridges.

Currently, Optimistic Rollups use a combination of services (the `message-relayer`, numerous contracts on L1 and L2, the `data-translation-layer` indexing system, and the `batch-submitter`) to shuttle information. 

Aside from **who** is moving the information, it is also important to consider the order in which these messages flow. For example, a chain could send an unordered cloud of messages to the other chain and rely on it to order them, identify missing messages, request re-sending of missed messages, and gradually converge on an ordered gap-fee message stack for processing. Alternatively, a system can be contemplated in which a source sends a message to a recipient and then waits for it to arrive before proceeding. For example, only once message _123_ has been received, the system would then move on to message _124_, and so forth. This approach is more like a zipper, where two separate zipper elements are durably brought together in a very specific order by the zipper's slider.

By thinking of two chains as zipper elements being zipped together by a moving slider, interesting possibilities emerge. For example, the L1->L2 message traffic itself can be converted into a linear stream of connected elements, through a rolling hash (aka recursive hashing or rolling checksum) where the hash of message _123_ influences the hash of message _124_ and so forth. One of the benefits of such an approach is that fast bridges can be (partially) protected from 51% attacks.

NG is an L2 with a cross-chain communications system that can run in parallel with an Optimistic Rollup - NG and Optimism services can coexist side by side, making it possible to transition from a canonical Optimistic Rollup to alternative designs. Optimism messages can tunnel through NG.  

NG is based on two agents, the **L1-agent** and the **L2-agent**. Each agent monitors the other chain's events and acts on its own chain. So `L2_Agent` handles the L1->L2 traffic, and vice versa. These agents interact with a new set of contracts, most notably `L1_BobaPortal.sol` and `L2_BobaPortal.sol`. These portal contracts handle interacting with standard Optimism message traffic and also store new types of data, such as rolling hashes that are uses to secure message streams. 

Notably, the system imposes *strong constraints* on the communications channel in terms of timing, monotonically, and continuity:

```javascript
//L2_BobaPortal.sol
  require(msgSequence == lastSeqIn + 1, "Unexpected sequence count");
  lastSeqIn += 1;

  require(L1Block >= lastL1Block, "L1Block must not decrease");
  lastL1Block = L1Block;
  
  require(L1Timestamp >= lastL1Timestamp, "L1Timestamp must not decrease");
  lastL1Timestamp = L1Timestamp;

  bytes32 msgHash = keccak256(abi.encodePacked(header,payload));
  hashIn = keccak256(abi.encodePacked(hashIn,msgHash));
    
  require(hashIn == l1Hash, "Rolling hash mismatch");
``` 

## Features

**User-triggered proof of liveliness with penalty**

A user can challenge the system to complete a round-trip message cycle within a fixed time window. It costs ETH to do this. If the system is unable to respond in time then the user may claim a larger amount of ETH. A failed challenge will pause all other cross-chain messaging until the underlying condition is resolved (*TBD*). The idea is to impose a penalty on the sequencer when they are failing to provide the service. 

```
  function HealthCheckStart ()
```

**Smart bridges with auto-fallback**

```
  /* Adds L1 liquidity, which is available for fast exits as soon as the L2
     side receives the notice that it has been added. User may withdraw some
     or all from L1 at a later time, but this will be processed through the
     Slow channel. Rewards are calculated and paid on L2
  */
  function addLiquidity(uint amount, address tokenAddr) public payable
```

**Support for Optimism Message Tunneling**

```
  // Tunnel an Optimism message, bypassing CTC
  function TunnelMsg(bytes memory payload) public {
```

**Storage of Outbound Rolling Hashes**

In an Optimistic rollup, the L2 deposits state roots and transactions. In NG, the `L2_BobaPortal.sentHashes` structure stores a permanent record of 
all outbound rolling hashes. This can be used for an Optimism-style inclusion proof. It also guards against some forms of tampering in the 
round-trip health check protocol, by ensuring that the most recent rolling hash known to the L1 contract was in fact generated by this 
L2 contract rather than a man-in-the-middle attacker.

## Stack spinup

Changes to the `dcoker-compose.yml`

```batch
  l1-agent:
    depends_on:
     - l1_chain
     - l2geth
    image: bobanetwork/l1-agent
    deploy:
      replicas: 1
    build:
      context: ..
      dockerfile: ./ops/docker/Dockerfile.l1-agent
      
  l2-agent:
    depends_on:
     - l1_chain
     - l2geth
    image: bobanetwork/l2-agent
    deploy:
      replicas: 1
    build:
      context: ..
      dockerfile: ./ops/docker/Dockerfile.l2-agent
```

## Tests

Testing the tunneling and new relay system. These tests are partially broken right now. 

```bash
$ yarn test:integration # this runs test/ng-test.ts
```

## Main components of NG

* **L1-agent.py** L1-agent proof of concept. Handles the L2->L1 traffic. Watches for events on L2 and calls L1 portal to act on them.

All messages are batched - there are `Slow` and `Fast` messages. The slow messages are subject to the usual 7 day delay. 

**SlowScanner** goes through the chain and assembles batches of Slow messages which are older than the fraud window. These are then handed off to the Submitter. There is some
duplicated effort because this thread is re-processing messages which were already handled on the Fast path (to register the message hash etc) but this is better than
having to store the parsed message data off-chain for 7 days.

The **Submitter** thread is responsible for taking finished batches out of the queues and submitting them to the contracts. Failed submissions are retried. In future, this thread should have the ability to modify a pending submission with an increasing gas price if it is not confirmed within a reasonable interval (replacing the problematic "ynatm" approach which is used in the existing services). For now the Slow batches are only processed when the Fast queue is idle, but there should be some limit to ensure that Slow operations can't stall forever. 

**SccScanner(env,A)** scans the L1 chain to extract SCC batches which are needed to generate proofs for the Optimism message tunnel.

**srProof(ctx, l2bn)** finds the state root and then generates its proof for the specified L2 block number

* **L2-agent.py** L2-agent proof of concept. Acts on L2 and watches the L1; thereby handles the L1->L2 traffic. For example, certain messages will trigger the L2 portal to minting oETH. The L2-agent is simpler than the L1 agent because the L2-agent does not need to create proofs for Optimism message tunneling.

`L1_BobaPortal.sol`

`L2_BobaPortal.sol`






