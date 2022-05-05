#!/bin/bash
set -e

RETRIES=${RETRIES:-120}
JSON='{"jsonrpc":"2.0","id":0,"method":"rollup_getInfo","params":[]}'
echo "Calling: "$URL
if [[ ! -z "$URL" ]]; then
    # get the addrs from the URL provided
    ADDRESSES=$(curl --fail --show-error --silent --retry-connrefused --retry $RETRIES --retry-delay 5 $URL)
    export ADDRESS_MANAGER=$(echo $ADDRESSES | jq -r '.AddressManager')
fi
echo "Calling: "$BOBA_URL
if [[ ! -z "$BOBA_URL" ]]; then
    # get the addrs from the URL provided
    ADDRESSES=$(curl --fail --show-error --silent --retry-connrefused --retry $RETRIES --retry-delay 5 $BOBA_URL)
    echo $ADDRESSES | jq -r '.L2LiquidityPool'
fi
echo "Calling: "$L2_URL
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

sed -i -e "s/grep: new RegExp(''),/grep: new RegExp('$TEST_GREP_FILTER'),/g" ./hardhat.config.ts
cat ./hardhat.config.ts
echo $TEST_GREP_FILTER
echo "Now run:"
npx hardhat test --network boba --no-compile --config ./hardhat.config.ts "$@"
