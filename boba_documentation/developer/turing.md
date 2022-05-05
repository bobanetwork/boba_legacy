---
description: How to build with Turing
---

Turing is a system for interacting with the outside world from within solidity smart contracts. Ethereum is a computer with multiple strong constraints on its internal architecture and operations, all required for decentralization. As such, things that most developers take for granted - low cost data storage, audio and image processing, advanced math, millisecond response times, random number generation, and the ability to talk to any other computer - can be difficult or even impossible to run on the Ethereum "CPU". Of course, the benefits of decentralization far outweigh those limitations, and therefore, tools are desirable to add missing functionality to the Ethereum ecosystem. Turing is one such tool.

Turing is a **pipe** between (**1**) Boba's Geth (aka sequencer), which takes transactions, advances the state, and forms blocks, and (**2**) your server. To use this pipe, all you need is a smart contract on Boba that makes Turing calls and an external server that accepts these calls and returns data in a format that can be understood by the EVM. This is not hard to do and we provide many examples which will allow you to quickly build a working Turing system. 

## Turing Basic Parts

A typical Turing system for gaming or Web3 social networking<>blockchain interoperability has four parts: 

1. A contract that uses Turing, such as by calling `bytes memory encResponse = myHelper.TuringTx(serverURL, encRequest);`   

2. A second contract, the `TuringHelper`, which serves as your standardized door to Turing.

3. Some BOBA. Each Turing call costs 0.01 BOBA, equivalent to about 1 cent at the moment. This fee covers the cost of writing all input calldata and responses from your servers to Ethereum Mainnet.

4. A server which accepts POST requests from Boba's Geth and returns data to it in the right format. 

## Turing Functions and Feature Set

Turing is a general purpose pipe between computers and this pipe does not have a native feature set (e.g. storage, cron jobs, cryptographic operations, gaming engines, blockchain history lookups, ...). Rather, _it's up to you_ to deploy servers or endpoints to perform those functions and then expose the right functionality/data to external callers. For many situations, serverless endpoints such as AWS Lambda or Google Cloud Services allow you to build complex logic in just a few lines of code, so if you have not done that before, it's surprisingly easy and we provide many examples for you to use and copy.

## **Turing is not an Oracle**

Turing is general-purpose pipe between computers and not an Oracle. Decentralized Oracles were invented to solve a very specific problem, which is _decentralized trustless approximation of the truth_ (e.g. temperature in NYC, the price of BTC/USD, ...) for later consumption on-chain (e.g. by a DEX or lending protocol). A pipe between computers such as Turing has no direct bearing on questions of data authenticity, timeliness, and trust, but rather, those must be tackled by the smart contract deployer and data provider(s) in whatever way is most suitable to their specific use case, industry, and application. To reiterate, Turing is a pipe, not an Oracle. 

## Data Push vs. Just-in-time Data Pull

On chain Oracles typically operate in a **push** manner, meaning that they update data on a fixed schedule (e.g. every 15 seconds), even when those data are not being used. This `push` update schedule allows calling smart contracts to have confidence that the data they pull are current, but a fixed push update cycle comes at high gas expense that does not decrease in time of low data utilization. 

A system like Turing is typically configured in the opposite manner, as a **pull** system, where nothing happens until a smart contract needs data or compute. In that case, the external API services the Turing call `just in time` during the EVM execution flow. This means that systems that use Turing have zero baseline gas consumption and provide compute or data only when needed. 

## Turing is Atomic

Turing is invoked when needed during the normal EVM execution flow, and therefore, transactions are atomic. Notably, computations later in the EVM execution flow can operate on responses from your off-chain servers all in one transaction.  

## Transparency and Verification 

As noted, Turing is not an Oracle. However, Turing writes all initial calldata and server responses to Ethereum Mainnet, and therefore, external parties can see those inputs and outputs. In theory, this many allow third parties to detect fraud or even challenge Turing calls, but such functionality remains to be developed.  

## Turing Security and Access Control

Since developers (i.e. **you**) control all of their keys and Turing is just a pipe, there are no special security considerations when using Turing. Notably - _we do not provide data or compute endpoints for you to query_ - you have to build, secure, and run those. 

Turing has two security/control features: 

* First, when you set up Turing, you register the address of your `TuringHelper` with the `TuringBilling` contract. This prevents unauthorized contracts from using your on chain infrastructure. 

* Second, the Boba Geth provides the address of the calling contract to your servers and endpoints. This allows you to limit use of your public data- or compute- endpoints to contracts that you have specifically approved. 

The first mechanism prevents unauthorized use of your on-chain resources and the second one prevents unauthorized use of off-chain resources.

## Let's get started!

Here are five fully worked out examples for you to build on:

* Use Turing to build a [CAPTCHA-gated token faucet](../../boba\_community/turing-captcha-faucet/README.md)
* Use Turing to [mint NFTs with random attributives](../../boba\_community/turing-monsters/README.md)
* Do all [stableswap quadratic math off-chain, just in time](../../packages/boba/turing/test/003_stable_swap.ts)
* Query [centralized off-chain price feeds](../../packages/boba/turing/test/005_lending.ts). Note - these cannot replace on-chain oracles and this approach should not be used for production use. An on-chain oracle such as ChainLink is the better design pattern.
* Connect [on-chain events with commercial KYC providers](../../boba\_community/turing-kyc/README.md) 

There is more information on setting up your own servers and compute endpoints here: 

* [Turing API Endpoints](../../packages/boba/turing/AWS\_code/AWS\_lambda\_setup.md)

Separately, there is a new system to help you deploy all the right contracts and set up a working test system at [[Mainnet: turing.boba.network]](https://turing.boba.network) and [[Rinkeby: turing.rinkeby.boba.network]](https://turing.rinkeby.boba.network). 

Have fun using Turing and contact us right away if you run into any problems! 

[Telegram for Developers](https://t.me/bobadev)\
[Project Telegram](https://t.me/bobanetwork )\
[Discord](https://discord.com/invite/YFweUKCb8a)
