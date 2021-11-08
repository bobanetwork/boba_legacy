#!/bin/bash

RETRIES=60
URL=http://127.0.0.1:8080/addresses.json
until $(curl --silent --fail --output /dev/null "$URL"); 
do
    sleep 20
    echo "Will wait $((RETRIES--)) more times for $URL to be up..."

    if [ "$RETRIES" -lt 0 ]; then
        echo "Timeout waiting for base contract deployment"
        exit 1
    fi
done

echo "BOBA base contracts are deployed"
RETRIES=60
URL2=http://127.0.0.1:8080/boba-addr.json

until $(curl --silent --fail --output /dev/null "$URL2"); 
do
    sleep 20
    echo "Will wait $((RETRIES--)) more times for $URL2 to be up..."

    if [ "$RETRIES" -lt 0 ]; then
        echo "Timeout waiting for Boba contract deployment"
        exit 1
    fi
done

echo "BOBA contracts are deployed"
echo $(curl --silent $URL2)
L2LIQUIDITY_POOL=$(curl --silent $URL2 | jq -r .L2LiquidityPool)
echo $L2LIQUIDITY_POOL

if [[ $L2LIQUIDITY_POOL =~ "0x" ]]; then
    echo "Pass: Found L2 Liquidity Pool contract address"
    exit 0
else
    echo "Error: Did not find L2 Liquidity Pool contract address"
    exit 1
fi