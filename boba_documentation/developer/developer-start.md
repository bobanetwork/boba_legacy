---
description: Introduction to Boba network for Developers
---

# Welcome to Boba

## Basics

Welcome to Boba. Boba is a compute-focused L2. We believe that L2s can play a unique role in augmenting the base _compute_ capabilities of the Ethereum ecosystem. You can learn more about Turing hybrid compute [here](../../packages/boba/turing/README.md). Boba is built on the Optimistic Rollup developed by [Optimism](https://optimism.io). Aside from its main focus, augmenting compute, Boba differs from Optimism by:

  * providing additional cross-chain messaging such as a `message-relayer-fast`
  * using different gas pricing logic
  * providing a swap-based system for rapid L2->L1 exits (without the 7 day delay)
  * providing a community fraud-detector that allows transactions to be independently verified by anyone
  * interacting with L2 ETH using the normal ETH methods (`msg.value`, `send eth_sendTransaction`, and `provider.getBalance(address)`) rather than as WETH
  * being organized as a DAO
  * native NFT bridging
  * automatically relaying classical 7-day exit messages to L1 for you, rather than this being a separate step

## Deploying standard contracts

For most contracts, the deploy experience is exactly like deploying on Ethereum. You will need to have some ETH (or Rinkeby ETH) on Boba and you will have to change your RPC endpoint to either `https://mainnet.boba.network` or `https://rinkeby.boba.network`. That's it!

The [Mainnet blockexplorer](https://blockexplorer.boba.network) and the [Rinkeby blockexplorer](https://blockexplorer.rinkeby.boba.network) are similar to Etherscan. The [Mainnet gateway](https://gateway.boba.network) and the [Rinkeby gateway](https://gateway.rinkeby.boba.network) allow you to see your balances and bridge funds, among many other functions.

## Example contracts ready to deploy

1. [Turing Monsters](../../boba_community/turing-monsters/README.md) _NFTs with on-chain svg and using the Turing random number generator_

2. [Truffle ERC20](../../boba_examples/truffle-erc20/README.md) _A basic ERC20 deployment using Truffle_

3. [Bitcoin Price Feeds](../../packages/boba/turing/test/005_lending.ts) _A smart contract that pulls price data from a commercial off-chain endpoint_

4. [Stableswap using off-chain compute](../../packages/boba/turing/test/003_stable_swap.ts) _A smart contract using an off-chain compute endpoint to solve the stableswap quadratic using floating point math_

## Feature: Using Turing Hybrid Compute

Turing is a system for interacting with the outside world from within solidity smart contracts. All data returned from external APIs, such as random numbers and real-time financial data, are deposited into a public data-storage contract on Ethereum Mainnet. This extra data allows replicas, verifiers, and fraud-detectors to reproduce and validate the Boba L2 blockchain, block by block.

[Turing Getting Started - NFTs](../../packages/boba/turing/README.md#feature-highlight-1-using-turing-to-mint-an-nft-with-256-random-attributes-in-a-single-transaction)

[Turing Getting Started - External API](../../packages/boba/turing/README.md#feature-highlight-2-using-turing-to-access-apis-from-within-your-solidity-smart-contract)

## Feature: Obtaining on-chain price data

Price Feed oracles are an essential part of Boba, which allow smart contracts to work with external data and open the path to many more use cases. Currently Boba has several options to get real world price data directly into your contracts - each different in the way they operate to procure data for smart contracts to consume:

1. [Boba Straw](../../boba_documentation/developer/price-feeds.md#1.-Boba-Straw)
2. [Witnet](https://docs.witnet.io/smart-contracts/supported-chains)
3. [Turing](../../packages/boba/turing/README.md)

[Full Price Feed documentation](../../boba_documentation/developer/price-feeds.md)

## Feature: Bridging NFTs from L2 to L1

NFTs can be minted on Boba and can also be exported to Ethereum, if desired. The minting process is identical to Ethereum. The Boba-specific interchain NFT bridging system and contracts are [documented here](../../boba_examples/nft_bridging/README.md).

## Running a Boba rpc node (replica)

The [boba-node repo](../../boba_community/boba-node/README.md) runs a local replica of the Boba L2geth, which is useful for generating analytics for blockexplorers. A Boba node can also relay transactions to the sequencer.

## Running a Community verifier and fraud detector

The [fraud-detector repo](../../boba_community/fraud-detector/README.md) runs a `Verfier` geth and a *fraud-detector* service on your computer. In `Verifier` mode, the geth will sync from L1 and use the transaction data from the L1 contracts to compute what the state roots should be, *if the operator is honest*. A separate service, the *fraud-detector*, can then be used to discover potential fraud. Fraud detection consists of requesting a state root from Boba and requesting a state root from your Verifier. If those state roots match, then the operator has been honest. If they do not match, then, that _might_ be due to fraud, or, could also indicate indexing errors, timestamp errors, or chain configuration errors. The central idea is that if two (or more) geths injects the same transactions, then they should write the same blocks with the same state roots. If they don't, then there is a problem somewhere. Fundamentally, the security of rollups has little to do with math or cryptography - rather, security arises from the operator publicly depositing transactions and their corresponding state roots, and then having many independent nodes check those data for possible discrepancies.

## Helping to Develop Boba

If you would like to help develop Boba, it is straightforward to run the entire system locally, with [just a few commands](../../boba_documentation/developer/local-stack.md). Note: this is only relevant to developers who wish to develop Boba core services. For most test uses, it's simpler to use the [live testnet](https://rinkeby.boba.network).
