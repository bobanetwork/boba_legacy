# Introduction to Turing

- [Introduction to Turing](#introduction-to-turing)
  * [What is Turing?](#what-is-turing-)
  * [Technical Backdrop](#technical-backdrop)
  * [Basic System Architecture](#basic-system-architecture)
  * [Current Limitations: Prototyping use only](#current-limitations--prototyping-use-only)
  * [Hello World](#hello-world)
  * [Under the hood](#under-to-hood)
  * [Key code snippets](#key-code-snippets)
  * [Preconfigured AWS Lambda code for Testing](#preconfigured-aws-lambda-code-for-testing)
    + [Trivial Add and Multiply](#trivial-add-and-multiply)
    + [Stableswap re-parametrisation](#stableswap-re-parametrisation)
    
## What is Turing?

Boba's **Turing** is a system for _hybrid compute_, defined as enabling Solidity smart contracts to interact with conventional compute endpoints via a modified L2 Geth.  Unlike Bitcoin, Ethereum is both a blockchain and a general-purpose computer. Sustained (and increasing) demand for Ethereum is congesting the network and, indirectly, makes it extremely expensive to use Ethereum for anything but trivial computation. Beyond limited speed and memory, and extreme cost, the architecture of the Ethereum EVM was never designed for, and is therefore not well suited for, contemporary algorithms from finance, algorithmic trading, artificial intelligence, creative content, audio and film, games, and computer science. Turing is designed to address these limitations. 

## Technical Backdrop

The recent growth of L2 scaling solutions is typically explained in terms of improved speed and reduced cost; however there is an additional benefit which has received less attention but may be even more important. Specifically, many of the L2s involve **unitary sequencers**, opening the door to advanced computation on (or at least coordinated by) Ethereum. 

The key problem has been the difficulty of achieving distributed consensus when nodes/miners are performing computations lacking a single correct answer. Certainly, there is no difficulty for miners to confirm the validity of a hash, but there is no obvious mechanism for the same miners to agree on the 'right' answer of a stochastic gradient decent. Due to the stochastic nature of the algorithm, every miner will arrive at a slightly different answers and all of those will be mathematically correct. Related areas encompass 'verifiable computation' and 'distributed computation'. For the L2s such as Boba, there is no mining and there is only one sequencer, which bypasses the classical barriers to advanced computation in the Ethereum ecosystem. 

## Basic System Architecture

Turing involves a small number of simple helper contracts, a modified Geth, and traditional compute endpoints including AWS lambda. The system is based on, loosely speaking, sending information to Geth via data hidden in revert strings, which uses that information to coordinate and trigger interactions with traditional compute endpoints. Specifically, a calling contract packs information into a revert string and _deliberately_ causes a call to a target contract to revert. The modified Geth intercepts those reverts, unpacks the data (such as input parameters and URIs such as `https://kkfpq0g9y0.execute-api.us-west-1.amazonaws.com/default/turing_add`), and calls the endpoint with those parameters. After receiving a response, Geth injects it into the target contract's memory, allowing the original caller to (indirectly) receive responses from the outside world.

## Current Limitations: Prototyping use only

Turing is *NOT* ready for production use, but is a technical prototype designed for pilots and exploring possible system architectures and design patterns for hybrid compute. Major current deficiencies are:

1. Effectively no error handling
2. Absence of unit and integration tests
3. The current system is incompatible with fraud detection, fraud proving, and replay. This is because we are not currently storing all the data that would be needed for an outside observer to re-compute the state of chain, thereby verifying the consistency of the input transactions and the state roots, for example.
4. Due to points 1 to 3, Turing can only be used on local test systems and is not available on `rinkeby.boba.network` or `mainnet.boba.network`. 

## Hello World

Spin up a local test stack. Duplicate `env.example`, make changes if needed, and then save as `.env`. Then, build and test the contracts.

```bash

$ yarn build
$ yarn test

```

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

```
if (rType == 1)
    require (rType == 2, string(genRequestRLP(methods[method_idx], _slot)));
``` 

## Pre-configured AWS Lambda code for Testing

### Trivial Add and Multiply

Calling 

```bash

curl -X POST \
'https://kkfpq0g9y0.execute-api.us-west-1.amazonaws.com/default/turing_add' \
-H 'content-type: application/json' \
-d '{"key1":"0.73","key2":"9.62"}'

```

returns

```bash
{"sum":10.35,"mul":7.022599999999999}
```

You can see how AWS Lambda is configured at `Lambda > Functions > turing_add`. The function is implemented in javascript:

```javascript

exports.handler = async (event) => {
    
    //caller provides two floats to add or multiply in body
    const input = JSON.parse(event.body)
    
    const float1 = parseFloat(input["key1"])
    const float2 = parseFloat(input["key2"])
    
    const sum = float1 + float2
    const mul = float1 * float2
    
    console.log("Sum of parameters:",sum)
    console.log("Product of parameters:",mul)
    
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            sum: sum,
            mul: mul
        }),
    };
    return response;
}

```

### Stableswap re-parametrization 

Calling 

```bash

curl -X POST \
'https://b8ooz5uu6b.execute-api.us-west-1.amazonaws.com/default/turing_stableswap' \
-H 'content-type: application/json' \
-d '{"x_in":"39.9595","L_x":"300.92","L_y":"100.87","A":"9.73"}'

````

will return new values for `x` and `y`:

```bash
{"x_in": 39.9595, "x": 340.8795, "y": 27.0, "A": 9.73}
```

The code that is being invoked at AWS is:

```python

def lambda_handler(event, context):

    input = json.loads(event["body"])
    
    # Prepare the inputs
    x_in = float(input["x_in"])
    L_x = float(input["L_x"])
    L_y = float(input["L_y"])
    a = float(input["A"])
    
    print("DEBUG: Inputs - x_in:",x_in, ' L_x:', L_x, ' L_y:', L_y, ' A:', a)
    
    # Do the math
    initializeLiquidity(L_x,L_y)
    
    changeA(a)
    
    swap_x(x_in)
    
    return {
        'statusCode': 200,
        'body': json.dumps({"x_in":x_in,"x":x,"y":y,"A":A})
    }

```



## Execution flow

1. Message arrives via RPC

TURING handler.go potentially relevant incoming RPC msg="{\"jsonrpc\":\"2.0\",\"id\":51,\"method\":\"eth_sendRawTransaction

l2geth_1           | DEBUG[12-09|00:37:10.956] TURING handler.go handleCall starting    Method=eth_sendRawTransaction

l2geth_1           | DEBUG[12-09|00:37:10.956] TURING api.go entering SendRawTransaction

l2geth_1           | DEBUG[12-09|00:37:10.958] TURING api_backend.go SendTx             signedTx

l2geth_1           | DEBUG[12-09|00:37:10.960] TURING sync_service.go acquired txLock in ValidateAndApply 
l2geth_1           | TRACE[12-09|00:37:10.960] Sequencer transaction validation         hash=0x5ad7d8269f350f8c199ae16b54e136326dceb329d167af74b170a9401da701db
l2geth_1           | DEBUG[12-09|00:37:10.960] TURING sync_service.go entering applyTransactionToTip 
l2geth_1           | DEBUG[12-09|00:37:10.961] Applying transaction to tip              index=29    hash=0x5ad7d8269f350f8c199ae16b54e136326dceb329d167af74b170a9401da701db origin=sequencer
l2geth_1           | DEBUG[12-09|00:37:10.961] TURING sync_service.go Waiting to apply  index=29    hash=0x5ad7d8269f350f8c199ae16b54e136326dceb329d167af74b170a9401da701db
l2geth_1           | TRACE[12-09|00:37:10.961] Waiting for transaction to be added to chain hash=0x5ad7d8269f350f8c199ae16b54e136326dceb329d167af74b170a9401da701db
l2geth_1           | DEBUG[12-09|00:37:10.961] Attempting to commit rollup transaction  hash=0x5ad7d8269f350f8c199ae16b54e136326dceb329d167af74b170a9401da701db
l2geth_1           | DEBUG[12-09|00:37:10.961] TURING worker.go entering commitNewTx 
l2geth_1           | DEBUG[12-09|00:37:10.961] TURING state_processor.go entering ApplyTransaction 
l2geth_1           | DEBUG[12-09|00:37:10.962] Adding L1 fee                            l1-fee=12731100026887800832

*Potential Error to look for*

If you see this, this is a true `out-of-gas` and you are using the wrong `gasLimit`. Consider `gasLimit: 3000000` 
```
l2geth_1           | DEBUG[12-09|00:37:10.962] TURING processing contract               Address=0xe675d25Eb3cdA9BF81055c962e0DA794Add2662C
l2geth_1           | DEBUG[12-09|00:37:10.962] TURING processing contract               Address=0x000000000000000000636F6e736F6c652e6c6f67
l2geth_1           | DEBUG[12-09|00:37:10.962] VM returned with error                   err="contract creation code storage out of gas"
```

*All is well*
If everything is working, you should see:

```
l2geth_1           | DEBUG[12-09|00:42:08.887] TURING processing contract               Address=0x488516e15E671491BdaB7f0b9c5045E670a80431
l2geth_1           | DEBUG[12-09|00:42:08.887] TURING processing contract               Address=0x000000000000000000636F6e736F6c652e6c6f67
l2geth_1           | DEBUG[12-09|00:42:08.887] TURING state_processor.go ApplyMessage result failed=false err=nil                                    gas=2450561             
```


3. `l2geth/core/vm/evm.go func (evm *EVM) Call(caller ContractRef...`

In `Call`, we check the reverting transactions for the magic string

```javascript
    // Call executes the contract associated with the addr with the given input as
    // parameters. It also handles any necessary value transfer required and takes
    // the necessary steps to create accounts and reverses the state in case of an
    // execution error or failed value transfer.
    
    func (evm *EVM) Call
    ...
    ...
    ...
        //Was this a TURING request - let's check the ret for the _OMGXTURING_ string
        if err != nil {
            if ! bytes.HasPrefix(contract.CodeAddr.Bytes(), deadPrefix) {
                isTuring := bytes.Contains(ret, []byte("_OMGXTURING_"))

```

At this point, the Call has reverted AND there is the magic prefix.

Next, prepare the various datastructures we need: the `revert` string and also the `input` string - which we are going to manipulate.

This information is then sent to `bobaTuringCall`

func bobaTuringCall(reqString []byte, oldValue hexutil.Bytes) hexutil.Bytes {





## old material to merge

# Project Turing

- [Project Turing](#project-turing)
  * [1. Context](#1-context)
  * [2. What we are not trying to do](#2-what-we-are-not-trying-to-do)
  * [3. Some simple use cases](#3-some-simple-use-cases)
  * [4. What's special about an L2?](#4-what-s-special-about-an-l2-)
  * [5. A hierarchy of problems and approaches](#5-a-hierarchy-of-problems-and-approaches)
    + [5.1. Baseline - focus on injecting real world data into L2 (and thereby into L1).](#1-baseline---focus-on-injecting-real-world-data-into-l2--and-thereby-into-l1-)
    + [5.2. Better - Add ability to EASILY trigger off-chain compute](#2-better---add-ability-to-easily-trigger-off-chain-compute)
    + [5.3. Long Term - the Horizon.](#3-long-term---the-horizon)

## 1. Context

Although Ethereum is Turing-complete, the congestion of the network and the exorbitant gas prices preclude all but the most essential computations from taking place on mainchain. 

Smart contracts live in a local world defined by their chain. By design, smart contracts cannot readily trigger off-chain events. This is because in a system with distributed consensus, all miners must:

1. Be trying to solve the _same_ problem and be operating on the the same inputs, and,
2. Once a solution has been found, it must be trivial (and fast) for all the other miners to check that solution's validity.

If smart contracts could directly call off-chain APIs, different instances of the chain would struggle to agree on its next state, due to:

1. **System latencies**. Each node would have to accomodate variable delays before responses arrive from the outside world. For example, an API might take 65 ms to return the result of `call.AWSlambda(Train_AMM)` to one node, whereas another node might need to wait 600 seconds for the response. There are solutions to this, but they are typically neither elegant nor scalable.
2. **Non-deterministic external operations**. Random number generators, stochastic gradient decent, or even different compute platforms with different numerical precision/truncation would greatly complicate distributed consensus. Specifically, there could be numerous mathematically correct answers to _what is the next state of the chain given some set of contract interactions_. By contrast, in a typical blockchain, all miners, when given the same inputs, know precisely what the correct outputs are. 

## 2. What we are not trying to do

There has been a general tendency in the literature to conflate 'off-chain compute' with 'distributed, verifiable computation'. It's certainly possible to do both at the same time, such as in `TrueBit`, but the example of ChainLink illustrates that solving even a tiny part of the problem can be extremely useful and valuable. For the purposes of this exercise, we are **not** trying to solve the more general problem of distributed, verifiable computation, at least not as a first step.

## 3. Some simple use cases

* An exchange runs an AMM with periodic rebalancing. Today, the exchange might do this by deploying an entirely new set of smart contracts, or, manually updating weight matrices and constants. For example, they could monitor the chain, detect events, compute, and push new weights/constants into an AMM. This loop may involve bespoke scripts, multiple architectures, people, and other steps to close the 'detect->compute->update' contract update loop. Imagine a system that makes this easy.

* An insurance company wishes to offer policies to people via smart contracts. The insurance company has spent 30 years building a prequalification stack, but it is not obvious how to translate that into a set of smart contracts. Don't laugh - a drone company offering automated hail damage detection was almost bankrupted because insurance companies did not want to know the _actual_ extent of hail damage, but rather they wanted to know the _estimated_ hail damage as sampled through a 10x10 grid by a human on a ladder - because that's what all their risk models were built around. Note that what was important here was not the precision of the estimate, but the compatibility of the new tech with existing workflows, programming languages, endpoints, company inertia etc. 

* A complex DeFi project wishes to save gas and is hitting bytecode length issues. Moreover, they have special timing needs, and wish to prevent manipulation and frontrunning. So, offload the bulky, complex code and the timing-critical code to Turing.

* As above, except focusing on SMC and FHE - completely impossible to do that on chain.  

## 4. What's special about an L2?

Most obviously, if there is only one sequencer, then in principle, many of the traditional issues (see Section 1) do not apply, since in an L2, there is no such thing as distributed consensus - transaction ordering is whatever the L2 says it is. For example, the L2 could put transactions/interactions into a 'pending' ring-buffer until an external API returns, and then, the transactions/interactions would be flushed into the transaction queue and batch submitted to L1.  

## 5. A hierarchy of problems and approaches 

### 1. Baseline - focus on injecting real world data into L2 (and thereby into L1).

Allow e.g. ChainLink to push larger amounts of data at lower cost by making it possible to submit an array of transactions into the OMGX sequencer. The main goal here is not to solve the grand unified distributed compute problem, it would be to allow ChainLink to push more data more quickly at lower cost into a system that is trust-rooted in Ethereum.

### 2. Better - Add ability to EASILY trigger off-chain compute

Extend the L2 daemon (message relayer) to detect smart contract interactions that set a `refresh` flag: 

```javascript

//in AMM.sol
string public endpoint = 'https://api-id.execute-api.us-east-2.amazonaws.com'
bool public TCR_refresh; //TCR is a Turing Compute Request
uint256 public last_updated;
uint _AMM_weights[3] = [1, 2, 3];

//core logic
if(blocktime - last_updated > 20) {
  TCR_refresh = true;
}

//called by external API to refresh AMM weights
//also resets counter and TCR flag
function updateAMMWeights( uint AMM_weights[3] ) { 
    _AMM_weights = AMM_weights; 
    last_updated = blocktime;
    TCR_refresh = false; 
}

```

```javascript

//in Daemon
string contract_to_monitor = '0x123456789';
string trigger_flag = 'TCR_refresh';
string API_to_call = null;

API_to_call = await ComplicatedAMMContract.API_URI()
//console.log(API_to_call)
//'https://api-id.execute-api.us-east-2.amazonaws.com'

//core logic
if(await ComplicatedAMMContract.TCR_refresh()) {
  newWeights = await curl API_to_call
}

if(newWeights) {
 let updated = await ComplicatedAMMContract.updateAMMWeights(newWeights)
 await updated.wait()
}

```

The smart contract could store the correct endpoint to call, similar to the `string metadata` field that is now used to store NFT URIs. Contract developers could point the smart contracts at different endpoints, or could update the code running at those endpoints, knowing that the smart contracts will then start to use the new logic. This would also allow code to be offloaded from the chain, with only basic logic being contained in the smart contract itself. This could also be a way to save gas and/or to deal with the L2 18kb size limit on bytecode. 

### 3. Long Term - the Horizon.

In this approach, the compute operations coordinated by the daemon would not end up at typically only one place, e.g. an AWS Lambda endpoint, but would flow into a distributed compute system similar in spirit to TruBit. That system could build on Approach 2 (immediately above) but would have additional logic to farm out the TCRs, verify the results, and reward the verifiers and the people providing the compute power. 












