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

The recent growth of L2 scaling solutions is typically explained in terms of improved speed and reduced cost; however there is an additional benefit which has received less attention but may be even more important. Specifically, many of the L2s involve **unitary sequencers** and this opens the door to advanced computation on (or at least coordinated by) Ethereum. 

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
//This tests the eth_call pathway by returning a customized greeting for the specified locale. This only requires a passthrough call to the helper contract.
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

Note how calling `GetResponse()` with `rType=1` triggers the revert, and note how the paratmers and other data needed by Geth are packed into the revert string via `genRequestRLP(methods[method_idx], _slot)`:
```
if (rType == 1)
    require (rType == 2, string(genRequestRLP(methods[method_idx], _slot)));
``` 

## Preconfigured AWS Lambda code for Testing

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

### Stableswap re-parametrisation 

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





