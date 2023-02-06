#!/bin/bash

set -e

RETRIES=100
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

RETRIES=100
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

# go go go
exec yarn start
