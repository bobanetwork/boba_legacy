# @eth-optimism/integration-tests

## Setup

Follow installation + build instructions in the [primary README](../README.md). Then, run:

```bash
yarn build
yarn test:integration
```

## Running tests

### Testing a live network

Create an `.env` file and fill it out. Look at `.env.example` to know which variables to include.

Once you have your environment set up, run:

```bash
yarn test:integration:live
```

You can also set environment variables on the command line instead of inside `.env` if you want:

```bash
L1_URL=whatever L2_URL=whatever yarn test:integration:live
```

Note that this can take an extremely long time (~1hr).


### Run integration tests locally without rebuilding
```
yarn && yarn build
export L1_URL=http://localhost:9545/
export L2_URL=http://localhost:8545/
export URL=http://localhost:8080/addresses.json
export BASE_URL=http://localhost:8080/addresses.json
export BOBA_URL=http://localhost:8080/boba-addr.json
export AA_BOBA_URL=http://localhost:8080/aa-addr.json
export BUNDLER_URL=http://localhost:3000/rpc
export ENABLE_GAS_REPORT=1
export NO_NETWORK=1
export RETRIES=200
export L2_CHAINID=31338 #unfortunately, elsewhere the L2_CHAINID is called CHAIN_ID
export PRIVATE_KEY='0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
export PRIVATE_KEY_2='0xc526ee95bf44d8fc405a158bb884d9d1238d99f0612e9f33d006bb0789009aaa'
export PRIVATE_KEY_3='0x8166f546bab6da521a8369cab06c5d2b9e46670292d85c875ee9ec20e84ffb61'
export BOBALINK_PRIVATE_KEY='0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e'
cd integration-tests
npx hardhat test --network boba --no-compile --config ./hardhat.config.ts test/eth-l2/boba_aa_fee_boba.spec
```
