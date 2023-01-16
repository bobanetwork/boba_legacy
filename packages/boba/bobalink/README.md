# BobaLink

This service monitors the ChainLink's contracts and sends the requests to L2 BobaLink contracts, which use  Turing to update the price feed.

## Configuration

All configuration is done via environment variables. See all variables at [.env.example](.env.example); copy into a `.env` file before running.

|                       | Description                             | Default |
| --------------------- | --------------------------------------- | ------- |
| L1_NODE_WEB3_URL      | The endpoint of Layer 1                 |         |
| L2_NODE_WEB3_URL      | The endpoint of Layer 2                 |         |
| BOBALINK_REPORTER_KEY | the private key for submitting the data |         |
| POLLING_INTERVAL      | The polling interval of fetching data   | 12000   |
| SET_GAS_PRICE_TO_ZERO | Whether set the gas price to 0          | 0       |

## Building & Running

1. Make sure dependencies are installed - run `yarn` in the base directory
2. Build `yarn build`
3. Run `yarn start`
