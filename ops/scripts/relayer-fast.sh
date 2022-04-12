#!/bin/bash

set -e

RETRIES=60
echo $URL
until $(curl --silent --fail --output /dev/null "$URL"); do
  sleep 10
  echo "Will wait $((RETRIES--)) more times for $URL to be up..."

  if [ "$RETRIES" -lt 0 ]; then
    echo "Timeout waiting for base addresses at $URL"
    exit 1
  fi
done
echo "Base addresses available at $URL"

RETRIES=60
echo $BOBA_URL
until $(curl --fail --output /dev/null "$BOBA_URL"); do
  sleep 10
  echo "Will wait $((RETRIES--)) more times for $BOBA_URL to be up..."

  if [ "$RETRIES" -lt 0 ]; then
    echo "Timeout waiting for boba addresses at $BOBA_URL"
    exit 1
  fi
done
echo "Boba addresses available at $BOBA_URL"

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

# go go go
exec yarn start