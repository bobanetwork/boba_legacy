#!/bin/bash

set -e

RETRIES=${RETRIES:-1000}

until $(curl --silent --fail \
    --output /dev/null \
    -H "Content-Type: application/json" \
    --data "$JSON" "$VERIFIER_WEB3_URL"); do
  sleep 5
  echo "Will wait $((RETRIES--)) more times for $VERIFIER_WEB3_URL to be up and fully synced..."

  if [ "$RETRIES" -lt 0 ]; then
    echo "Timeout waiting for verifier at $VERIFIER_WEB3_URL"
    exit 1
  fi
done
echo "Connected to Verifier at $VERIFIER_WEB3_URL"

# go
exec node ./exec/run-fraud-detector.js
