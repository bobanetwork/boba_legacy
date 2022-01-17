# Price Feed Oracle
- [For Price Data Recipients](#For-Price-Data-Recipients)
- [For Price Data Submitters (Oracles)](#For-Price-Data-Submitters-(Oracles))
- [Supported Token Feeds](#Supported-Token-Feeds)

The Price Feed Oracle works to provide - latest(or)past market price data of some specific tokens, aggregated from (>=1) trusted external entities(hereafter referred to as oracles).
[(see supported tokens on readme)](#Supported-Token-Feeds)

Token price aggregation happens in rounds, triggered by oracles. For a round of aggregation, multiple oracles submit their 'price' answers and the final determined answer is the median of all submissions. The 'price' answer for the round isn't finalized/accepted until the round has received a certain 'min no of answer submissions' from separate oracles. While the round moves between having min < submissions < max, the computed answer can vary depending on the data received up till that point. And after the 'max no of submissions on the round' the 'price' answer is finalized and fixed.
If a round does not recieve 'min no of answer submissions', the round can be superseded after a timeout period.

The Terms used here and throughout - 'base' refer to the crypto asset/token and 'quote' refers to the asset(or fiat currency) to use as a reference for the price.


## For Price Data Recipients
Price is aggregated in individual FluxAggregator contracts, however the FeedRegistry contract stores the current Aggregator contract in use for a specific base/quote pair and allows to extract the feed data from a central point. \
On the FeedRegistry, use the following methods

*To get the latest price data -* \
call method ***`latestRoundData(base, quote)`***

*To get the price data from a certain past round (historical price) -* \
call method ***`getRoundData(base, quote, roundId)`*** \
roundId supplied here is phaseId plus aggregator roundId

*The answer returned will be of the form of decimals specified on the contract-* \
call method ***`decimals(base, quote)`***

The methods above return additional data that can be used to ensure fresh data is recieved \
Alternatively, can query only the price \
*To get the latest price -* \
call method ***`latestAnswer(base, quote)`***

*To get the price from a certain past round -* \
call method ***`getAnswer(base, quote, roundId)`*** \
roundId supplied here is phaseId plus aggregator roundId

*To get the latest completed round-* \
call method ***`latestRound(base, quote)`***

*To get the latest timestamp-* \
call method ***`latestTimestamp(base, quote)`***

To extract other informational data please refer to the FeedRegistry contract


## For Price Data Submitters (Oracles)
IF you are an oracle (some-one who is going to help by submitting price data), the main contracts to interact with are the respective FluxAggregators.

Boba Network deploys and administers individual FluxAggregators for each asset feed. In order to be eligible to submit price data, the oracle (and the oracle admin) addresses needs to be added by the admin to respective FluxAggregators

Note- the roundId here is the actual roundId that the oracles use as a submission counter for the specific Aggregator, this is not equal to the roundId obtained from the FeedRegistry, where phaseId combined with roundId is returned

### Submitting price
Oracle helper methods for data submissions \
*To get details of queried round, including eligibility-* \
call method ***`oracleRoundState(oracle, roundId)`***

*in case an oracle wants the roundId to be suggested instead-* \
call method ***`oracleRoundState(oracle, 0)`*** \
This returns the suggested roundId that an oracle can submit next, depending on his past submission stats. useful for multiple oracle settings

*To submit data to the feed-* \
the oracle has to call ***`submit(roundId, value)`*** \
where value is the price to submit

the roundId is consecutive, an oracle can submit only once for a specific round, for single oracle settings, oracles just need to submit data in consecutive rounds

Note - the price submissions should aid the decimals specified on the contract

#### For single oracle settings
with only a single oracle in charge of the price data submissions-
the 'min no of answer submissions' count will be set to 1, and the restartDelay set to zero, which would mean that the single oracle's submission would be the finalized 'price' answer for the round and the same oracle would have the power to start a round subsequently.

#### For multiple oracle settings
A round started for reporting by an oracle, will have to meet the min number of submissions to have the answer for that round accepted (or) a timeout(s) should have elapsed, after which a subsequent round can be proposed


## Supported Token Feeds