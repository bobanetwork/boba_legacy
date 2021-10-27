#!/bin/bash
set -e

RETRIES=${RETRIES:-120}
JSON='{"jsonrpc":"2.0","id":0,"method":"rollup_getInfo","params":[]}'

if [[ ! -z "$URL" ]]; then
    # get the addrs from the URL provided
    ADDRESSES=$(curl --fail --show-error --silent --retry-connrefused --retry $RETRIES --retry-delay 5 $URL)
    export ADDRESS_MANAGER=$(echo $ADDRESSES | jq -r '.AddressManager')
fi

if [[ ! -z "$BOBA_URL" ]]; then
    # get the addrs from the URL provided
    ADDRESSES=$(curl --fail --show-error --silent --retry-connrefused --retry $RETRIES --retry-delay 5 $BOBA_URL)
    echo $ADDRESSES | jq -r '.L2LiquidityPool'
fi

# wait for the sequencer to be up
curl \
    --silent \
    --fail \
    --show-error \
    -H "Content-Type: application/json" \
    --retry-connrefused \
    --retry $RETRIES \
    --retry-delay 3 \
    -d $JSON \
    --output /dev/null \
    $L2_URL

npx hardhat test --network optimism --no-compile
