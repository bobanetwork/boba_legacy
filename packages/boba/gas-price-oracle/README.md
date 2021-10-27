# Gas Price Oracle

This service is responsible for updating the `gasPrice` in the `OVM_GasPriceOracle.sol` contract, so the Sequencer can fetch the latest `gasPrice` and update the L2 gas price over time.

## Configuration

All configuration is done via environment variables. See all variables at [.env.example](.env.example); copy into a `.env` file before running.

| Environment Variables               | Description                                                  | Default        |
| ----------------------------------- | ------------------------------------------------------------ | -------------- |
| L1_NODE_WEB3_URL                    | The endpoint of Layer 1                                      |                |
| L2_NODE_WEB3_URL                    | The endpoint of Layer 2                                      |                |
| DEPLOYER_PRIVATE_KEY                | The owner of `OVM_GasPriceOracle`                            |                |
| SEQUENCER_PRIVATE_KEY               | The private key of sequencer account                         |                |
| PROPOSER_PRIVATE_KEY                | The private key of proposer account                          |                |
| RELAYER_PRIVATE_KEY                 | The private key of relayer account                           |                |
| FAST_RELAYER_PRIVATE_KEY            | The private key of fast relayer account                      |                |
| GAS_PRICE_ORACLE_ADDRESS            | The address of `OVM_GasPriceOracle`                          |                |
| GAS_PRICE_ORACLE_FLOOR_PRICE        | The minimum L2 gas price                                     | 150000         |
| GAS_PRICE_ORACLE_ROOF_PRICE         | The maximum L2 gas price                                     | 20000000       |
| GAS_PRICE_ORACLE_MIN_PERCENT_CHANGE | The gas price will be updated if it exceeds the minimum price percent change. | 0.1            |
| POLLING_INTERVAL                    | The polling interval                                         | 10 * 60 * 1000 |
| ETHERSCAN_API                       | The API Key of Etherscan                                     |                |

## Building & Running

1. Make sure dependencies are installed - run `yarn` in the base directory
2. Build `yarn build`
3. Run `yarn start`

## L2 Gas Fee

The L2 gas fee is

```
gasFee = gasPrice * gasLimit
```

**GAS PRICE** The gas price is fixed and is equal to **0.015 GWei**. **DON'T CHANGE IT!** Notably, the way fees are calculated on L2 differ from what you might be used to on L1, where the gas price can be adjusted e.g. to ensure faster mining. Since there is no mining on L2, the gas price is fixed.

**GAS LIMIT** On L2, we vary the gas limit to accommodate the ever-changing costs of running the L2. This can be confusing, since on L1, the gas limits are constants that depend only on the _type_ of transaction - e.g. on L1, a standard ETH transfer requires a gas limit of 21,000 units of gas.

**GAS LIMIT SETTINGS** You _could_ use the maximum gas limit, but that would incur wasteful spending. We provide an oracle to help you pick a smaller, more cost effective setting. The estimated gas limit is based on `rollup_gasPrices`, which is composed of `L1GasPrice` and `L2GasPrice` based on the following expression:

```
estimatedGasLimit = calculateL1GasLimit(data) * L1GasPrice + L2GasPrice * L2EstimatedExecutionGasLimit
```

The `L2GasPrice` changes gradually to reflect our service cost, primarily, the cost of writing state roots into L1, and the significant cost of relaying messages from L1 to L2 (e.g. deposits) and back from L2 to L1 (e.g. exits). _Unlike other L2's, we include the cost of relaying messages in our gas limits_, so you do not have to pay two different fees or have to worry about relaying your messages.

## Algorithm

The service fetches the L1 ETH balances of the `sequencer`, `proposer`, `relayer` and `fast relayer` in each polling interval. Based on the ETH balances, we calculate the costs of maintaining the Layer 2.

* `L1ETHBalance`: The ETH balances of all accounts
* `L1ETHCostFee`: The ETH we pay to maintain the Layer 2, starting from the (most recent) start time of the gas oracle service

The service also fetches the L2 gas fees collected by us based on `gasUsage * gasPrice` and the L2 block numbers in each polling interval. We also calculate the average gas usage per block. Together, this allows us to estimate the gas price.

* `L2ETHCollectFee`: The ETH fees that we collected from the Layer 2 transactions.
* `avgL2GasLimitPerBlock` : The average gas limit per block in each polling interval
* `numberOfBlocksInterval`: The increased number of blocks in each pooling interval

The estimated gas usages in the next interval are therefore

```
estimatedGasUsage = avgL2GasLimitPerBlock * numberOfBlocksInterval
```

The estimated L2 gas price that we should charge in the next interval is

```
estimatedL2GasPrice = (L1ETHCostFee - L2ETHCollectFee) / estimatedGasUsage
```

## Special Cases

When the estimated L2 gas price is lower than the `GAS_PRICE_ORACLE_FLOOR_PRICE`, we set the gas price as the `GAS_PRICE_ORACLE_FLOOR_PRICE`.

When the estimated L2 gas price is larger than the `GAS_PRICE_ORACLE_ROOF_PRICE`, we set the gas price as the `GAS_PRICE_ORACLE_ROOF_PRICE`. We do this to cap your cost.

If the newly estimated L2 gas price falls out of a tolerance band of `(1 + GAS_PRICE_ORACLE_MIN_PERCENT_CHANGE) * latestGasPriceInContract` and `(1 - GAS_PRICE_ORACLE_MIN_PERCENT_CHANGE) * latestGasPriceInContract`, we update the gas price.

## Considerations

1. The choice of `numberOfBlocksInterval` can affect the gas price significantly. We have tired to find a balance between rapidly changing gas prices - which would lead to many failed transactions - and a fixed gas price, which would be hard to sustain in the face of ETH spikes.
2. When the service starts, the gas price always starts at the `GAS_PRICE_ORACLE_FLOOR_PRICE`.
3. The `GAS_PRICE_ORACLE_FLOOR_PRICE` and `GAS_PRICE_ORACLE_ROOF_PRICE` are not easily determined in test environments.
