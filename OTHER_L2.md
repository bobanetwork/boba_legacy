<div align="center">
  <h1>L2 as a service</h1>
</div>

## Basic Changes Needed to Scale Other L1s

The key differences that need to be considered are:

1. RPC endpoints,
2. Contract addresses, 
3. Chain IDs, and, 
4. The fee token.

The settings need to be changed in dozens of places, so the easiest way to tackle this is as a PR on top of the base system.

As the deployment proceeds, various new files will be generated, such as the `state-dump` file which defines the intial state of the L2. 

## Proof of concept Step 1 - deploy the L1 contracts

The first step is to test deploy our L1 base contracts on the new L1's testnet. If the deployment succeeds, that's already a good sign. A local copy of the L2 stack them can be connected to those contracts on the new chain. So, your computer will run the services and the L2, and those will be connected to the new L1's testnet. 

**File changes needed**

The `.env` needs four funded keys containing the new L1's fee token and rpc endpoint (`process.env.L1_NODE_WEB3_URL`). Here are all the things we usually set (see `docker-compose.yaml`):

```
  FRAUD_PROOF_WINDOW_SECONDS: 0
  L1_NODE_WEB3_URL: http://l1_chain:8545
  << : *deployer_pk
  << : *sequencer_pk
  << : *proposer_pk
  << : *relayer_pk
  # setting the whitelist owner to address(0) disables the whitelist
  WHITELIST_OWNER: "0x0000000000000000000000000000000000000000"
  L2_CHAIN_ID: 31338
  L2_BLOCK_GAS_LIMIT: 11000000
  L1_FEE_WALLET_ADDRESS: "0x391716d440c151c42cdf1c95c1d83a5427bca52c"
  BLOCK_SIGNER_ADDRESS: "0x00000398232E2064F896018496b4b44b3D62751F"
  GAS_PRICE_ORACLE_OWNER: "0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199"
  GAS_PRICE_ORACLE_OVERHEAD: "2750"
  GAS_PRICE_ORACLE_SCALAR: "1500000"
  GAS_PRICE_ORACLE_L1_BASE_FEE: "1"
  GAS_PRICE_ORACLE_GAS_PRICE: "1000000000"
  GAS_PRICE_ORACLE_DECIMALS: "6"
```

There are defaults in many places that relate to BOBA and ETH, which are proably not relevant to the new chain. Conceptulally, the new chain's native token will replace ETH, and BOBA is largely unchanged. So the things to do are:

1. Set up four funded accounts and provide the keys to the `docker-compose.yaml`
2. Change the `L1_NODE_WEB3_URL`
3. for test/debuffing purposes, the `L2_CHAIN_ID` can be left at `31338`, assuming you are running the stack locally
3. You also need the `L1_FEE_WALLET_ADDRESS`, `BLOCK_SIGNER_ADDRESS`, and `GAS_PRICE_ORACLE_OWNER`. Question - what do we normally do with those? 

## Common problems 

1. Forgetting to change settings in the dozens of configurations files
2. Changes in fees/gas
3. Missing functionality from the "EVM-compatible" chains. 

## Proof of concept Step 2 - Connect the local contracts to those contracts

The key idea is that your local L2 will now write transactions into those new contracts on the new L1. The major issues there are address configuration.

For example, the `SDK` stores key addresses in `SDK\src\utils\contracts.ts` and the new chain needs to be added there - just follow the structure for the other chains.