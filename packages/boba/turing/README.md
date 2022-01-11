
# OUTDATED/OUTDATED/OUTDATED - MAJOR REVISION PENDING

# Introduction to Turing

- [Introduction to Turing](#introduction-to-turing)
  * [What is Turing?](#what-is-turing-)
  * [Motivation](#motivation)
  * [What we are **not** trying to do](#what-we-are---not---trying-to-do)
  * [Basic System Architecture](#basic-system-architecture)
  * [Current Limitations: Prototyping use only](#current-limitations--prototyping-use-only)
  * [Hello World](#hello-world)
  * [Under the hood](#under-the-hood)
  * [Key code snippets](#key-code-snippets)
  * [Some simple use cases](#some-simple-use-cases)
  * [Pre-configured AWS Lambda code for Testing](#pre-configured-aws-lambda-code-for-testing)
    + [Turing Simple Math](#turing-simple-math)
    + [Turing StableSwap example](#turing-stableswap-example)
  * [Turing Debugging](#turing-debugging)
  * [Long Term - the Horizon](#long-term---the-horizon)
    
## What is Turing?

Unlike Bitcoin, Ethereum is both a blockchain and a general-purpose computer. Although Ethereum is Turing-complete, the congestion of the network and the exorbitant gas prices preclude all but the most essential computations from taking place on Ethereum. Beyond limited speed and memory, and extreme cost, the architecture of the Ethereum EVM was not designed for, and is therefore not well suited for, contemporary algorithms from finance, algorithmic trading, artificial intelligence, creative content, audio and film, games, and computer science. Boba's **Turing** is designed to address these limitations. 

Turing is a system for _hybrid compute_, defined as enabling Solidity smart contracts to interact with conventional compute endpoints via a modified L2 Geth. This makes it very easy for developers to:
  * reuse existing Python, R, C++, Kera, Tensorflow, and other code  
  * reuse existing API endpoints (for algorithmic trading, big data, and AI)  
  * run calculations for 1 cent that would be cost millions on Ethereum  
  * run calculations in milliseconds that would be take decades on Ethereum  
  * not to worry about nearest-integer division, or other EVM specialties such as SQRT(3) = 1  
  * write complex `hybrid` contracts without worrying about the 24k bytecode limit   

## Motivation

Smart contracts live in a local world defined by their chain. By design, smart contracts cannot readily trigger off-chain events. This is because in a system with distributed consensus, all miners must:

1. Be trying to solve the _same_ problem and be operating on the the same inputs, and,  
2. Once a solution has been found, it must be trivial (and fast) for all the other miners to check that solution's validity.  

If smart contracts could directly call off-chain APIs, different nodes would struggle to agree on its next state, due to:

1. **System latencies**. Each node would have to accommodate variable delays before responses arrive from the outside world. For example, an API might take 65 ms to return the result of `call.AWSlambda(Train_AMM)` to one node, whereas another node might need to wait 600 seconds for the response. There are solutions to this, but they are typically neither elegant nor scalable.

2. **Non-deterministic external operations**. Random number generators, stochastic gradient decent, or even different compute platforms with different numerical precision/truncation complicate distributed consensus. Specifically, there could be numerous mathematically correct answers to _what is the next state of the chain given some set of contract interactions_. By contrast, in a typical blockchain, all miners, when given the same inputs, know precisely what the correct outputs are. 

The recent growth of L2 scaling solutions is typically explained in terms of improved speed and reduced cost; however there is an additional benefit which has received less attention but may be even more important. Specifically, there is no mining on the L2s and they involve **unitary sequencers**, which indirectly solves the above issues, opening the door to advanced computation coordinated by Ethereum. 

## What we are **not** trying to do

There has been a general tendency in the literature to conflate 'off-chain compute' with 'distributed, verifiable computation'. It's certainly possible to do both at the same time, such as (proposed) in `TrueBit`, but `ChainLink` illustrates that solving even a tiny part of the problem can be extremely useful and valuable. Turing in its present form does not address the more general problem of distributed, verifiable computation.

## Basic System Architecture

Turing involves a small number of simple helper contracts, a modified Geth, and traditional compute endpoints including AWS Lambda. The system is based on (1) sending information to Geth via data hidden in revert strings and (2) receiving information from Geth via overloaded calldata. Specifically, a calling contract packs information into a revert string and _deliberately_ causes a call to a target contract to revert. The modified Geth intercepts those reverts, unpacks the data (such as input parameters and URIs such as `https://kkfpq0g9y0.execute-api.us-west-1.amazonaws.com/default/turing_add`), and calls the endpoint with those parameters. After receiving a response, Geth caches it, packs it into the calldata, and re-runs the call, which now succeeds, returning the modified calldata to the original calling contract. In this way, a contract is able to trigger arbitrary compute endpoints and send and receive data from the outside world.

## Current Limitations: Prototyping use only

Turing is *NOT* ready for production use, but is a technical prototype designed for pilots and exploring possible system architectures and design patterns for hybrid compute. Major current deficiencies are:

1. Effectively no error handling
2. Absence of unit and integration tests
3. The current system is incompatible with fraud detection and fraud proving. This is because we are not currently storing all the data that would be needed for an outside observer to re-compute the state of chain, thereby verifying the consistency of the input transactions and the state roots, for example. However, Turing can already emit events which contain the needed information, and thus this issue can be addressed by adding additional functionality to fraud detectors and fraud provers.
4. Due to points 1 to 3, Turing can only be used on local test systems and is not (yet) available on `rinkeby.boba.network` or `mainnet.boba.network`. 

## Hello World

Spin up a local test stack. Then, build and test the contracts.

```bash

$ yarn build
$ yarn test:boba

```

The test suite will demonstrate basic functionality using a local http server.

## Under the hood

When you run `test`, a helper contract (`TuringHelper.sol`) will be deployed.

```javascript
    Factory__Helper = new ContractFactory(
      (TuringHelper.abi),
      (TuringHelper.bytecode),
      testWallet)
```

Among other information, the helper contract contains the compute URL endpoint that will be called when pre-defined methods are called. Those methods must first be registered:

```javascript
    //defines the URL that will be called by HelloTuring.sol
    helper = await Factory__Helper.deploy(urlStr, gasOverride)
    console.log("    Helper contract deployed as", helper.address, "on", "L2")
    await (helper.RegisterMethod(ethers.utils.toUtf8Bytes("hello")));
```

Next, a contract that uses Turing is deployed. It is initialized with the address of the Turing helper contract:

```javascript    
    Factory__Hello = new ContractFactory(
      (HelloTuringJson.abi),
      (HelloTuringJson.bytecode),
      testWallet)
    
    hello = await Factory__Hello.deploy(helper.address, gasOverride)
```

Finally, call Turing:

```javascript
    //This tests the eth_call pathway by returning a customized greeting for the specified locale. This only requires a pass through call to the helper contract.
    bytes memory response = myHelper.TuringCall(0, abi.encode(locale));

    //This tests the eth_sendRawTransaction pathway by fetching a personalized greeting string for the user's chosen locale and storing it for later reference.
    bytes memory response =  myHelper.TuringTx(0, abi.encode(locale));
```

## Key code snippets

A central code snippet is in `TuringHelper.sol`. 

```javascript
  
  /* TuringHelper.sol GetResponse
     This is the interface to the off-chain mechanism. Although
     marked as "public", it is only to be called by TuringCall() 
     or TuringTX().
     The _slot parameter is overloaded to represent either the
     request parameters or the off-chain response, with the rType
     parameter indicating which is which. 
     When called as a request (rType == 1), it reverts with 
     an encoded TURING string. 
     The modified l2geth intercepts this special revert, 
     performs the off-chain interaction, then rewrites the parameters 
     and calls the method again in "response" mode (rType == 2). 
     This response is then passed back to the caller.
  */
  function GetResponse(uint32 method_idx, uint32 rType, bytes memory _slot)
    public view returns (bytes memory) {

    require (msg.sender == address(this), "Turing:GetResponse:msg.sender != address(this)");
    require (method_idx < methods.length, "Turing:GetResponse:method not registered");
    require (rType == 1 || rType == 2, "Turing:GetResponse:rType != 1 || 2"); // l2geth can pass 0 here to indicate an error
    require (_slot.length > 0, "Turing:GetResponse:_slot.length == 0");

    if (rType == 1) {
      // knock knock - wake up the l2geth
      // force a revert
      // the if() avoids calling genRequestRLP unnecessarily
      require (rType == 2, string(genRequestRLP(methods[method_idx], _slot)));
    }
    //if (rType == 2) -> the l2geth has obtained fresh data for us
    return _slot;
  }
```

Note how calling `GetResponse()` with `rType=1` triggers the revert, and note how the parameters and other data needed by Geth are packed into the revert string via `genRequestRLP(methods[method_idx], _slot)`:

```javascript
    if (rType == 1)
        require (rType == 2, string(genRequestRLP(methods[method_idx], _slot)));
``` 

## Some simple use cases

* An exchange runs an AMM with periodic rebalancing. Today, the exchange might do this by deploying an entirely new set of smart contracts, or, manually updating weight matrices and constants. For example, they could monitor the chain, detect events, compute, and push new weights/constants into an AMM. This loop may involve bespoke scripts, multiple architectures, people, and other steps to close the 'detect->compute->update' contract update loop. Imagine a system that makes this easy.

* An insurance company wishes to offer policies to people via smart contracts. The insurance company has spent 30 years building a prequalification stack, but it is not obvious how to translate that into a set of smart contracts. Don't laugh - a drone company offering automated hail damage detection was almost bankrupted because insurance companies did not want to know the _actual_ extent of hail damage, but rather they wanted to know the _estimated_ hail damage as sampled through a 10x10 grid by a human on a ladder - because that's what all their risk models were built around. Note that what was important here was not the precision of the estimate, but the compatibility of the new tech with existing workflows, programming languages, endpoints, company inertia etc. 

* A complex DeFi project wishes to save gas and is hitting bytecode length issues. Moreover, they have special timing needs, and wish to prevent manipulation and frontrunning. So, offload the bulky, complex code and the timing-critical code to Turing.

* As above, except focusing on SMC and FHE - completely impossible to do that on chain.  

## Pre-configured AWS Lambda code for Testing

### Turing Simple Math

The Basic Math code is in `turing/AWS_code/turing_basicMath.py`. To test it from your terminal, run:

```bash
#Basic Math Curl Test
#run from your terminal 
curl -X POST \
    'https://i9iznmo33e.execute-api.us-east-1.amazonaws.com/basic_math' \
    -H 'content-type: application/json' \
    -d '{"key1":"0.73","key2":"9.62"}'

#returns
{"sum":10.35,"mul":7.022599999999999}%
```

### Turing StableSwap example

Since AWS Lambda can run `Python 3.9` you can take advantage of Python's full math support. Most obviously, you can work with floats, do not need to think about nearest integer division (`//`) and have the usual `sqrt()` and `math.pow()` functions to draw upon. The StableSwap code is in `turing/AWS_code/turing_stableSwap.py`. To test it from your terminal, run:

```bash
#StableSwap Curl Test
#run from your terminal 
curl -X POST \
    'https://i9iznmo33e.execute-api.us-east-1.amazonaws.com/stableSwap' \
    -H 'content-type: application/json' \
    -d '{"L_x":"10.0","L_y":"10.0","A":"1.00","x_in":"5.00","sol":"true"}'

#returns
{"x_in": 5.0, "y_out": 4.227083333333334, "x_new": 15.0, "y_prev": 10.0, "y_new": 5.772916666666666, "sol": true}%      
```

So in this example, putting in `5.0` token 'X' would give you `4.227` token 'Y'. You can compare and contrast the results you would get by running the calculation on the Ethereum EVM compared to on AWS by changing `"sol":"true"` to `"sol":"false"`.  

## Turing Debugging

Since Turing is based on (deliberate) reverts and rewriting of calldata, it can be tricky to debug. Most obviously, nothing will work if your contracts revert for reasons unrelated to Turing. 

**Step one is to make absolutely sure that your contracts are running correctly, and only then to add hybrid compute calls.**   

**Step two is to test your compute APIs via Curl to make sure they are working as intended.**

Generally, we use the MethodIDs to confirm correct depth and execution flow in the Geth log outputs if there is a problem. In virtually all cases, issues are not related to Turing itself but rather have to do with insufficient gas or incorrectly formatted compute inputs.

## Long Term - the Horizon

In this elaboration, the compute operations coordinated by the unitary Geth would not end up at typically only one place, e.g. an AWS Lambda endpoint, but would flow into a distributed compute system similar in spirit to `TruBit`. That system would need additional logic to farm out the TCRs, verify the results, and reward the verifiers and the people providing the compute power. 
