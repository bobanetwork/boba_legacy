#!/bin/bash
set -e

RETRIES=${RETRIES:-20}
JSON='{"jsonrpc":"2.0","id":0,"method":"net_version","params":[]}'

# wait for the base layer to be up
curl \
    --fail \
    --show-error \
    --silent \
    -H "Content-Type: application/json" \
    --retry-connrefused \
    --retry $RETRIES \
    --retry-delay 1 \
    -d $JSON \
    $L1_NODE_WEB3_URL

yarn run deploy

if [ -n "$DTL_REGISTRY_URL" ] ; then

    echo "Will upload addresses.json to DTL"
    curl \
        --show-error \
        --silent \
        -H "Content-Type: application/json" \
        --retry-connrefused \
        --retry $RETRIES \
        --retry-delay 5 \
        -T dist/dumps/addresses.json \
        "$DTL_REGISTRY_URL"
fi

function envSet() {
    VAR=$1
    export $VAR=$(cat ./dist/dumps/addresses.json | jq -r ".$2")
}

# set the address to the proxy gateway if possible
envSet L1_STANDARD_BRIDGE_ADDRESS Proxy__L1StandardBridge
if [ $L1_STANDARD_BRIDGE_ADDRESS == null ]; then
    envSet L1_STANDARD_BRIDGE_ADDRESS L1StandardBridge
fi

envSet L1_CROSS_DOMAIN_MESSENGER_ADDRESS Proxy__L1CrossDomainMessenger
if [ $L1_CROSS_DOMAIN_MESSENGER_ADDRESS == null ]; then
    envSet L1_CROSS_DOMAIN_MESSENGER_ADDRESS L1CrossDomainMessenger
fi

envSet L1_BOBA_TOKEN_ADDRESS TK_L1BOBA

# build the dump file
yarn run build:dump

if [ -n "$DTL_STATE_DUMP_REGISTRY_URL" ] ; then
    echo "Will upload state-dump.latest.json to DTL"
    curl \
        --show-error \
        --silent \
        -H "Content-Type: application/octet-stream" \
        --retry-connrefused \
        --retry $RETRIES \
        --retry-delay 5 \
        -T dist/dumps/state-dump.latest.json \
        "$DTL_STATE_DUMP_REGISTRY_URL"
    echo
    echo "Upload done."
fi

