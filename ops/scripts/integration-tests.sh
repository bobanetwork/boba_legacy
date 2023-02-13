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

echo "Calling: "$L1_URL
CURL_L1_CHAIN_ID=$(
  curl \
  --show-error \
  -H "Content-Type: application/json" \
  --retry $RETRIES \
  --retry-delay 3 \
  --retry-connrefused \
  -X POST \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'
  $L1_URL
)
L1_CHAIN_ID=$(echo $CURL_L1_CHAIN_ID | jq -r '.result')
# filter on chain id
if [ $L1_CHAIN_ID == 0x501 ]; then
  echo "Run tests targeting non-standard L1 chain id: $L1_CHAIN_ID"
  npx hardhat test ./test-alt-l1/*.ts --network boba --no-compile --config ./hardhat.config.ts "$@"
else
  echo "Run tests targeting standard L1 chain id: $L1_CHAIN_ID"
  npx hardhat test ./test/*.ts --network boba --no-compile --config ./hardhat.config.ts "$@"
fi

