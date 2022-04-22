#!/bin/sh

set -e

RETRIES=${RETRIES:-40}

if [[ ! -z "$URL" ]]; then
    # get the addrs from the URL provided
    ADDRESSES=$(curl --fail --show-error --silent --retry-connrefused --retry $RETRIES --retry-delay 5 $URL)
    # set the env
    export CTC_ADDRESS=$(echo $ADDRESSES | jq -r '.CanonicalTransactionChain')
    export SCC_ADDRESS=$(echo $ADDRESSES | jq -r '.StateCommitmentChain')
    export ADDRESS_MANAGER_ADDRESS=$(echo $ADDRESSES | jq -r '.AddressManager')
fi


echo "waits for l2geth to be up"
curl --fail \
    --show-error \
    --silent \
    --retry-connrefused \
    --retry $RETRIES \
    --retry-delay 1 \
    --output /dev/null \
    $L2_ETH_RPC

echo "waits for kms to be up"
curl \
    -X POST \
    --silent \
    --fail \
    --show-error \
    -H "Content-Type: application/json" \
    -H "X-Amz-Target:TrentService.ListKeys" \
    --retry-connrefused \
    --retry $RETRIES \
    --retry-delay 3 \
    --output /dev/null \
    $BATCH_SUBMITTER_KMS_ENDPOINT

# go
exec batch-submitter "$@"
