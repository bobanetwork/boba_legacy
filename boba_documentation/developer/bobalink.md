---
description: Boba Network docs for using BobaLink on L2
---

# BobaLink

BobaLink is a service that allows developers to get ChainLink's price feed data on L2.

## BobaLink basic

The core idea of BobaLink is to use [Turing](./turing.md) in L2 smart contract to call outside API endpoint and write the price feed data to it. The API endpoint gets the price feed from the ChainLink smart contract on L1.

```solidity
function getChainLinkQuote(uint256 _roundId) public onlyOwner returns (uint256 , int256, uint256) {
    bytes memory encRequest = abi.encode(turingChainLinkPriceFeedAddr, _roundId);
    bytes memory encResponse = turingHelper.TuringTx(turingUrl, encRequest);

    emit TuringDebug(encResponse);

    (uint256 _CLRoundId, int256 _CLSubmission, uint256 _CLLatestRoundId) = abi.decode(encResponse,(uint256,int256,uint256));

    emit GetChainLinkQuote(turingUrl, _CLRoundId, _CLSubmission, _CLLatestRoundId);

    return (_CLRoundId, _CLSubmission, _CLLatestRoundId);
}
```

In order to keep tracking of ChainLink's smart contract, the `roundId` of BobaLink is same as ChainLink's. To keep things simple and clear, we add the following function to override the starting `roundId`. This allows us to start the round from a specific Id. 

> Note: This means that you are not able to get the history data before the starting round.

```solidity
// override the latestRoundId, startingRound and reportingRoundId
uint80 _startingRound = getStartingRound(_oracle);
if (reportingRoundId == 0) {
    reportingRoundId = _roundId;
    overrideStaringRoundId = _roundId;
    // override startingRoundId
    _startingRound = _roundId;
    // override latestRoundId
    latestRoundId = _roundId;
}
```

Sometimes, we might have the outage to submit data using [Turing](./turing.md). In order to ensure that we can update the data during this circumstance, we add `emergencySubmit()` to submit the data from ChainLink's smart contract.

```solidity
function emergencySubmit(uint256 _roundId, int256 _submission, uint256 _CLLatestRoundId) external {}
```

## How to get price feed

You can write smart contracts that consume Price Feeds using several languages, but this guide shows examples using the following languages:

### Solidity

To consume price data, your smart contract should reference [`AggregatorV3Interface`](https://github.com/smartcontractkit/chainlink/blob/master/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol), which defines the external functions implemented by Data Feeds.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract PriceConsumerV3 {
    AggregatorV3Interface internal priceFeed;

    /**
     * Network: Goerli
     * Aggregator: ETH/USD
     * Address: 0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e
     */
    constructor() {
        priceFeed = AggregatorV3Interface(
            BOBA_LINK_ADDRESS
        );
    }

    /**
     * Returns the latest price
     */
    function getLatestPrice() public view returns (int) {
        (
            ,
            /*uint80 roundID*/ int price /*uint startedAt*/ /*uint timeStamp*/ /*uint80 answeredInRound*/,
            ,
            ,

        ) = priceFeed.latestRoundData();
        return price;
    }
}
```

### Javascript

This example uses [web3.js](https://web3js.readthedocs.io/) to retrieve feed data from the BobaLink.

```javascript
/**
 * THIS IS EXAMPLE CODE THAT USES HARDCODED VALUES FOR CLARITY.
 * THIS IS EXAMPLE CODE THAT USES UNAUDITED CODE.
 * DO NOT USE THIS CODE IN PRODUCTION.
 */

const Web3 = require("web3") // for nodejs only
const web3 = new Web3("https://rpc.ankr.com/eth_goerli")
const aggregatorV3InterfaceABI = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "description",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint80", name: "_roundId", type: "uint80" }],
    name: "getRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "version",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
]
const addr = "0xA39434A63A52E749F02807ae27335515BA4b07F7"
const priceFeed = new web3.eth.Contract(aggregatorV3InterfaceABI, addr)
priceFeed.methods
  .latestRoundData()
  .call()
  .then((roundData) => {
    // Do something with roundData
    console.log("Latest Round Data", roundData)
  })
```

## Contract Addresses
