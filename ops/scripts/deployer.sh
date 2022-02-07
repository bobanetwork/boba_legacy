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

    # there's a resource race - where DTL can't start without an address manager address
    # and deployer can't upload it's addresses without DTL being up
    # so this little python server pushes the address manager into dtl.sh startup sequence
    # so that DTL can initialize itself (and the diff between upstream is thus reduced to minimum)
    # after this sequence the deployer exits gracefully
    echo "Starting server in background."
    python3 -m http.server \
        --bind "0.0.0.0" 8082 \
        --directory ./dist/dumps &

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

