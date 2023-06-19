#!/bin/sh
set -e

node --trace-warnings --no-deprecation bundler.js --minBalance $MIN_BALANCE --mnemonic $MNEMONIC_OR_PK --network $L2_NODE_WEB3_URL --beneficiary $BENEFICIARY --addressManager $ADDRESS_MANAGER_ADDRESS --l1NodeWeb3Url $L1_NODE_WEB3_URL --maxBundleGas $MAX_BUNDLE_GAS --unsafe $UNSAFE --minStake 0.2 --minUnstakeDelay 86400
