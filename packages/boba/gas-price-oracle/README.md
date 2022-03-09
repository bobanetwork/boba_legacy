# Gas Price Oracle

This service is responsible for updating the `gasPrice` in the `OVM_GasPriceOracle.sol` contract, so the Sequencer can fetch the latest `gasPrice` and update the L2 gas over time.

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

## Building & Running

1. Make sure dependencies are installed - run `yarn` in the base directory
2. Build `yarn build`
3. Run `yarn start`

## L2 Gas Fee

The L2 gas fee is

```
gasFee = gasPrice * gasLimit
```

**GAS PRICE** The gas price is fixed and is equal to **1 GWei**. Notably, the way fees are calculated on L2 differ from what you might be used to on L1, where the gas price can be adjusted e.g. to ensure faster mining. Since there is no mining on L2, the gas price is fixed.

**GAS LIMIT** On L2, we vary the gas limit to accommodate the ever-changing costs of running the L2. This can be confusing, since on L1, the gas limits are constants that depend only on the _type_ of transaction - e.g. on L1, a standard ETH transfer requires a gas limit of 21,000 units of gas.

**GAS LIMIT SETTINGS** You _could_ use the maximum gas limit. The estimated gas limit is based on `rollup_gasPrices`, which is composed of `L1SecurityFee` and `L2GasPrice` based on the following expression:

```
estimatedGasLimit = L1SecurityFee / L2GasPrice + L2EstimatedExecutionGasLimit
```

The `L1SecurityFee` changes gradually to reflect our service cost, primarily, the cost of writing state roots into L1, and the significant cost of relaying messages from L1 to L2 (e.g. deposits) and back from L2 to L1 (e.g. exits). _Unlike other L2's, we include the cost of relaying messages in our gas limits_, so you do not have to pay two different fees or have to worry about relaying your messages.

## L1 Security Fee

The L1 security fee is for the cost of submitting the state roots and tx roots to L1. It's calculated via

```
L1BasePrice * scalar * (overhead + dataLength)
```

The `overhead` is the `x%` percentage of the average gas usage of the L1 txs that submitting the state and tx roots within last 1000 blocks. We adjust `x ` based on our operation cost.
