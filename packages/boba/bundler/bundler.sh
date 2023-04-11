#!/bin/sh
set -e

node --trace-warnings --no-deprecation bundler.js --minBalance $MIN_BALANCE --mnemonic $MNEMONIC_OR_PK --network $L2_NODE_WEB3_URL --entryPoint $ENTRYPOINT --beneficiary $BENEFICIARY --addressManager $ADDRESS_MANAGER_ADDRESS --l1NodeWeb3Url $L1_NODE_WEB3_URL --maxBundleGas $MAX_BUNDLE_GAS --unsafe $UNSAFE
