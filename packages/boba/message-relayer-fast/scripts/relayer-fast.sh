#!/bin/bash

set -e

RETRIES=${RETRIES:-60}
echo $URL

if [[ ! -z "$URL" ]]; then
    # get the addrs from the URL provided
    ADDRESSES=$(curl --fail --show-error --silent --retry-connrefused --retry $RETRIES --retry-delay 5 $URL)
    # set the env
    echo $ADDRESSES
    export ADDRESS_MANAGER_ADDRESS=$(echo $ADDRESSES | jq -r '.AddressManager')
fi
echo $BOBA_URL
if [[ ! -z "$BOBA_URL" ]]; then
    # get the addrs from the URL provided
    ADDRESSES=$(curl --fail --show-error --silent --retry-connrefused --retry $RETRIES --retry-delay 5 $BOBA_URL)
    # set the env
    echo $ADDRESSES
    export L1_MESSENGER_FAST=$(echo $ADDRESSES | jq -r '.Proxy__L1CrossDomainMessengerFast')
fi


# go
exec node ./exec/run-message-relayer-fast.js
