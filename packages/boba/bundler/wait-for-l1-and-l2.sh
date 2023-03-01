#!/bin/bash

# Copyright Optimism PBC 2020
# MIT License
# github.com/ethereum-optimism

cmd="$@"

if [ ! -z "$URL" ]; then
    RETRIES=${RETRIES:-50}
    until $(curl --silent --fail \
        --output /dev/null \
        "$URL"); do
      sleep 1
      echo "Will wait $((RETRIES--)) more times for $URL to be up..."

      if [ "$RETRIES" -lt 0 ]; then
        echo "Timeout waiting for contract deployment"
        exit 1
      fi
    done
    echo "Rollup contracts are deployed"

    if [ ! -z "$AA_DEPLOYER" ]; then
        RETRIES=${RETRIES:-50}
        until $(curl --fail \
            --output /dev/null \
            "$AA_DEPLOYER"); do
          sleep 10
          echo "Will wait $((RETRIES--)) more times for $AA_DEPLOYER to be up..."

          if [ "$RETRIES" -lt 0 ]; then
            echo "Timeout waiting for boba deployment"
            exit 1
          fi
        done
        echo "Boba contracts are deployed"
    fi

    ADDRESS_MANAGER_ADDRESS=$(curl --silent $URL | jq -r .AddressManager)
    exec env \
        ADDRESS_MANAGER_ADDRESS=$ADDRESS_MANAGER_ADDRESS \
        $cmd
else
    exec $cmd
fi
