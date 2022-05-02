# Price Data Feeds - Overview

Price Feed oracles allow smart contracts to work with external data and open the path to many more use cases. Boba has several options to get real world price data directly into your contracts - each different in the way they operate to procure data for smart contracts to consume:

1. Boba-Straw
2. Witnet
3. Turing

## 1. Boba-Straw

Boba-Straw, Boba's self-operated price feed oracle is based on ChainLink's implementation and can handle price data aggregation from multiple trusted external entities (data oracles), on-chain. Currently, Boba-Straw is powered by Folkvang, our first data oracle. To further increase reliability and precision, we are adding more data-sources. Data oracles accumulate BOBA for every submission to offset operational and gas costs. To be a data-provider oracle and earn BOBA refer to the section below.

### Feeds supported

*Mainnet*: [ETH/USD, BOBA/USD, WBTC/USD, OMG/USD]

*Rinkeby*: [ETH/USD, BOBA/USD, WBTC/USD, OMG/USD]

*Fee*: free

[[*Quick-Link - Mainnet*]](https://blockexplorer.boba.network/address/0x01a109AB8603ad1B6Ef5f3B2B00d4847e6E554b1)

[[*Quick-Link - Rinkeby*]](https://blockexplorer.rinkeby.boba.network/address/0xf3EBFc93C53694E3679c52ACacB9C7fD6d7f362E)

### I want to be a data source

To be a data oracle and help Boba-Straw by submitting price data:

- You must have reliable, independent price data. While price data from all oracles is aggregated and determined on-chain, more layers of data-aggregation helps build reliability

- You must react to the rounds for aggregation, to seamlessly work with other independent data providers

To find the when and hows of submitting data, let's take a quick look at the round structure first.

### Rounds and on-chain aggregation

Token price data aggregation happens in rounds, triggered by oracles when there is a need for price update. The 'price' answer of the latest *finalized round* is the latest price. Here, `finalized round` refers to a round with >= min submissions.

For a round of aggregation, independent oracles submit their 'price' answers. When a round receives enough submissions (>= min submissions), the price update is accepted and computed to the median of all submissions for the specific round. Then for a further price update we move to the next round.

The 'price' answer for the round isn't finalized/accepted until the round has received a certain 'min no of answer submissions' from separate oracles. While the round moves between having min < submissions < max, the computed answer can vary depending on the data received up till that point. And after the 'max no of submissions on the round' the 'price' answer is finalized and fixed. If a round does not receive 'min no of answer submissions', the round can be superseded after a timeout period (currently 3mins).

### Submitting price data

To be eligible to submit price data, the oracle (and the oracle admin) addresses needs to be added by the admin

- oracle - the address that will submit the price

- oracle admin - the address that will control withdrawals of accumulated $BOBA

The rules of the game to manage the round co-ordination between all the independent data oracles are:

- Trigger a round if you notice a price update that needs to be recorded

- Keep checking and provide your answer for the round if someone else has triggered a round

- Make sure you do not try to trigger a new round when the last round is unfinished and the timeout period hasn't elapsed. There is a 'restartDelay' - the minimum number of rounds you have to wait before you can trigger a new round.

Use the **`function oracleRoundState(address _oracle, uint32 _queriedRoundId)`** to determine eligibility for specific roundId. The same method **`oracleRoundstate(_oracle, 0)`** can also be used to suggest the next eligible round for the oracle.

The main contracts to interact with are the respective FluxAggregators for each feed.

*To submit data to the feed* the oracles need to call **`submit(roundId, value)`**.

Here, `value` is the price to submit, note: in decimals as returned by the contract (currently set to 8) and `roundId` refers to round, which is consecutive and starts from 1 for the specific feed. The oracle can only submit once for a specific round.

For more info please refer to:

[[contracts]](../../packages/boba/contracts/contracts/oracle)

[[examples]](../../boba_examples/boba-straw)

### I want my contracts to receive data

To fetch price feed data directly into your contracts, make your contract call the "Feed Registry" to extract the current and historical prices for all the feeds on Boba-Straw:

*Feed Registry (Mainnet)*: 0x01a109AB8603ad1B6Ef5f3B2B00d4847e6E554b1

*Feed Registry (Rinkeby)*: 0xf3EBFc93C53694E3679c52ACacB9C7fD6d7f362E

Feeds are registered to the registry in the form of base/quote pairs, these terms used here and throughout - 'base' refers to the crypto asset/token and 'quote' refers to the asset (or fiat currency) to use as a reference for the price.

A quick note on fees and subscription: Currently the feed is free to use for the contracts. Once we transition to the BOBA subscription model, you would have to pay BOBA and pre-subscribe your contracts (time based) to extract data from the feed.

### Extracting the price

To get the latest price data call method **`latestRoundData(base, quote)`**. To get the price data from a certain past round (historical price) call method **`getRoundData(base, quote, roundId)`**. The `roundId` supplied here is phaseId plus aggregator roundId, for reference query the latest `roundId`. The answer returned will be of the form of decimals specified on the contract call method **`decimals(base, quote)`**. For example,

```javascript
import "@boba/contracts/oracle/FeedRegistry.sol"

contract MyContract {

address feedRegistryAddress = '0x01a109AB8603ad1B6Ef5f3B2B00d4847e6E554b1';

    function readFromPriceFeed() external view returns(int256) {
        FeedRegistry feedRegistry = FeedRegistry(feedRegistryAddress);

        address bobaTokenAddress = '0xa18bF3994C0Cc6E3b63ac420308E5383f53120D7';
        address USD = address(840);

        (,int256 value,,uint256 time,) = feedRegistry.latestRoundData(bobaTokenAddress, USD);
        // do something with time

        return value;
    }

}
```

`base` is always the token address and `quote` is fiat in the ISO_4217 form.

### Alternate data queries

While the above is the recommended way to ask for the price data, and check time along with it, there is also the option to only query the price:

For the latest price call **`latestAnswer(base, quote)`**.

For the price from a certain past round call **`getAnswer(base, quote, roundId)`**. `roundId` supplied here is `phaseId` plus aggregator `roundId`.

For the latest completed round call **`latestRound(base, quote)`**.

To get the latest timestamp call **`latestTimestamp(base, quote)`**.

## 2. Witnet Price Feeds

Witnet is a decentralized oracle network, with multiple price feeds currently live on Boba. The price feed is backed by several witnesses/witnet nodes whose data are aggregated and averaged to provide a decentralized and reliable price. It easy to listen to Witnet's price feed. Please refer to Witnet's official guide at [https://docs.witnet.io](https://docs.witnet.io).

### Feeds supported

*Mainnet*: [BOBA/USDT, BTC/USD, ETH/USD, FRAX/USDT, USDC/USD, USDT/USD]

*Rinkeby*: [BOBA/USDT, BTC/USD, ETH/USD, FRAX/USDT, FXS/USDT, OMG/BTC, OMG/ETH, OMG/USDT, USDC/USD, USDT/USD]

## 3. Turing

Turing is Boba's off-chain compute system and among many other things you can fetch real-world market price data. Turing gives you the flexibility to select and set up your own data source. Or even select and work with any other reliable service that can help provide such data. In the background, Turing works with a modified L2Geth, by intercepting and injecting real world responses into the transaction. Learn more about Turing [here](../../packages/boba/turing/README.md). See [calling APIs](../../packages/boba/turing/README.md#feature-highlight-2-using-turing-to-access-apis-from-within-your-solidity-smart-contract) for detailed instructions.

Note: Unlike a feed contract where every data query remains on-chain, Turing requests are a call to an external endpoint to retrieve data - which are subject to unavailability or distortion. **Best practices include using decentralized on-chain oracles and/or off-chain 'augmentation' where off-chain compute is used to estimate the reliability of on-chain oracles**.

### Feeds supported

*Rinkeby/Mainnet*: potentially everything, dependent on your source

*Fee*: 0.01 BOBA per Turing request
