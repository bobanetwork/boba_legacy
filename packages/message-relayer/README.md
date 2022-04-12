[![codecov](https://codecov.io/gh/ethereum-optimism/optimism/branch/master/graph/badge.svg?token=0VTG7PG7YR&flag=message-relayer)](https://codecov.io/gh/ethereum-optimism/optimism)
# @eth-optimism/message-relayer

This package contains: A service for relaying messages from L2 to L1. This service can also be used to relay fast messages for the L1CrossDomainMessengerFast without waiting for the dispute period.

The message relayer uses L1MultiMessageRelayer/L1MultiMessageRelayerFast to relay messages together in batches.

## Usage

**To start the classic message relayer:**
- specify the env variables, use env.example for reference
- run:
```
yarn start
```

**To start the message relayer fast:**
- specify the env variables, use env.example for reference
- set FAST_RELAYER=true
- run:
```
yarn start
```
