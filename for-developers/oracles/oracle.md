# Boba Straw Price Feed Oracle

## Credit: Chainlink

This Price Feed Oracle is forked from the [Chainlink contracts](https://github.com/smartcontractkit/chainlink). For more information, please see:

[https://github.com/smartcontractkit/chainlink](https://github.com/smartcontractkit/chainlink)

[https://github.com/smartcontractkit/feed-registry](https://github.com/smartcontractkit/feed-registry)



<figure><img src="../../.gitbook/assets/overview.png" alt=""><figcaption></figcaption></figure>

The Price Feed Oracle works to provide the latest or past market price of specific tokens, aggregated from (>=1) trusted external entities (hereafter referred to as oracles). Token price aggregation happens in rounds, triggered by oracles. For a round of aggregation, multiple oracles submit their 'price' answers and the final determined answer is the median of all submissions. The 'price' answer for the round isn't finalized/accepted until the round has received a certain 'min no of answer submissions' from separate oracles. While the round moves between having min < submissions < max, the computed answer can vary depending on the data received up till that point. And after the 'max no of submissions on the round' the 'price' answer is finalized and fixed. If a round does not receive 'min no of answer submissions', the round can be superseded after a timeout period. The Terms used here and throughout - 'base' refers to the crypto asset/token and 'quote' refers to the asset (or fiat currency) to use as a reference for the price.



<figure><img src="../../.gitbook/assets/for price data recipients.png" alt=""><figcaption></figcaption></figure>

Price is aggregated in individual FluxAggregator contracts, however the FeedRegistry contract stores the current Aggregator contract in use for a specific base/quote pair and allows to extract the feed data from a central point. On the FeedRegistry, use the following methods:

* To get the latest price data, call _**`latestRoundData(base, quote)`**_.
* To get the price data from a certain past round (historical price) , call _**`getRoundData(base, quote, roundId)`**_. _**`roundId`**_ supplied here is phaseId plus aggregator roundId. The answer returned will be of the form of decimals specified on the contract, call _**`decimals(base, quote)`**_.

The methods above return additional data that can be used to ensure fresh data are received. Alternatively, you can can query only the price:

* To get the latest price, call _**`latestAnswer(base, quote)`**_.
* To get the price from a certain past round, call _**`getAnswer(base, quote, roundId)`**_. _**`roundId`**_ supplied here is phaseId plus aggregator roundId.
* To get the latest completed round, call _**`latestRound(base, quote)`**_.
* To get the latest timestamp, call _**`latestTimestamp(base, quote)`**_.

To extract other informational data please refer to the FeedRegistry contract.



<figure><img src="../../.gitbook/assets/for price data submitters.png" alt=""><figcaption></figcaption></figure>

If you are an oracle (someone who is going to help by submitting price data), the main contracts to interact with are the respective FluxAggregators. Boba deploys and administers individual FluxAggregators for each asset feed. To be eligible to submit price data, the oracle (and the oracle admin) addresses needs to be added by the admin to respective FluxAggregators. Note - the _**`roundId`**_ here is the actual _**`roundId`**_ that the oracles use as a submission counter for the specific Aggregator, this is not equal to the _**`roundId`**_ obtained from the FeedRegistry, where phaseId combined with _**`roundId`**_ is returned.

### Submitting prices

Oracle helper methods for data submissions:

* To get details of queried round, including eligibility, call _**`oracleRoundState(oracle, roundId)`**_.
* In case an oracle wants the roundId to be suggested, call _**`oracleRoundState(oracle, 0)`**_. This returns the suggested roundId that an oracle can submit next, depending on his past submission stats. Useful for multiple oracle settings.
* To submit data to the feed, the oracle has to call _**`submit(roundId, value)`**_ where value is the price to submit.
* The _**`roundId`**_ is consecutive, an oracle can submit only once for a specific round, for single oracle settings, oracles just need to submit data in consecutive rounds. Note - the price submissions should use the decimals specified in the contract.

### For single oracle settings

With only a single oracle in charge of the price data submissions the 'min no of answer submissions' count will be set to 1, and the restartDelay set to zero, which means that the single oracle's submission will be the finalized 'price' answer for the round and the same oracle has the power to start a round subsequently.

### For multiple oracle settings

A round started for reporting by an oracle, will have to meet the min number of submissions to have the answer for that round accepted (or) a timeout(s) should have elapsed, after which a subsequent round can be proposed.



<figure><img src="../../.gitbook/assets/supported token feeds.png" alt=""><figcaption></figcaption></figure>

Note - It's highly recommended to obtain the feed addresses from the FeedRegsitry instead (call _**`getFeed(base, quote)`**_). The addresses listed here might be outdated! Prices returned are in decimals (8) of the underlying quote.

### Rinkeby

[ETH-USD](https://testnet.bobascan.com/address/0xcEb40458ad6Dabe9cfC90A2ad062a071809c4E84#transactions)\
[BOBA-USD](https://testnet.bobascan.com/address/0xd05AA5531b8e8DaB3BEe675f133dF3e330d9adA8#transactions)\
[OMG-USD](oracle.md)\
[WBTC-USD](oracle.md)

### Mainnet

[ETH-USD](https://bobascan.com/address/0x50E383121021F4E8060C794d79Ada77195532c7a#transactions)\
[BOBA-USD](https://bobascan.com/address/0x987AEd89f5BDC3eb863282DBB76065bFe398be17#transactions)\
[OMG-USD](oracle.md)\
[WBTC-USD](oracle.md)
