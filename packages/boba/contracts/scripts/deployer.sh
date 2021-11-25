#!/bin/bash
set -e

# This is what deploys all the right BOBA contracts
yarn run deploy

# Register the deployed addresses with DTL
if [ -n "$DTL_REGISTRY_URL" ] ; then
  echo "Will upload addresses.json to $DTL_REGISTRY_URL"
  curl \
    --fail \
    --show-error \
    --silent \
    -H "Content-Type: application/json" \
    --retry-connrefused \
    --retry $RETRIES \
    --retry-delay 5 \
    -T dist/dumps/addresses.json \
    "$DTL_REGISTRY_URL"
  echo
  echo "Upload done."
fi