#!/bin/bash
URL='http://localhost:8545'

echo "SET URL TO: $URL"

echo "----------------------------------------------"

echo "TEST CASE 1 -- STANDARD REQUEST ID NUMBER"
RESULT_1=$(curl -s \
  --request POST \
  --url $URL \
  --header 'Content-Type: application/json' \
  --data '{"jsonrpc": "2.0", "id": 1, "method": "eth_blockNumber", "params": []}' \
  | jq -r '.id'
)
if [ $RESULT_1 == 1 ]; then
  echo 'PASSED TEST CASE 1'
else
  echo "FAILED TEST CASE 1: id - $RESULT_1"
fi

echo "----------------------------------------------"

echo "TEST CASE 2 -- STANDARD REQUEST ID STRING"
RESULT_2=$(curl -s \
  --request POST \
  --url $URL \
  --header 'Content-Type: application/json' \
  --data '{"jsonrpc": "2.0", "id": "1", "method": "eth_blockNumber", "params": []}' \
  | jq -r '.id'
)

if [ $RESULT_2 == 1 ]; then
  echo 'PASSED TEST CASE 2'
else
  echo "FAILED TEST CASE 2: id - $RESULT_2"
fi

echo "----------------------------------------------"

echo "TEST CASE 3 -- STANDARD REQUEST ID RANDOM STRING"
RESULT_3=$(curl -s \
  --request POST \
  --url $URL \
  --header 'Content-Type: application/json' \
  --data '{"jsonrpc": "2.0", "id": "1sdsasd-32783-dsjfhsujd", "method": "eth_blockNumber", "params": []}' \
  | jq -r '.id'
)

if [ $RESULT_3 == "1sdsasd-32783-dsjfhsujd" ]; then
  echo 'PASSED TEST CASE 3'
else
  echo "FAILED TEST CASE 3: id - $RESULT_3"
fi

echo "----------------------------------------------"

echo "TEST CASE 4 -- BATCH REQUEST SINGLE"
RESULT_4=$(curl -s \
  --request POST \
  --url $URL \
  --header 'Content-Type: application/json' \
  --data '[{"jsonrpc": "2.0", "id": "1sdsasd-32783-dsjfhsujd", "method": "eth_blockNumber", "params": []}]' \
  | jq -r '.id'
)

if [ $RESULT_4 == "1sdsasd-32783-dsjfhsujd" ]; then
  echo 'PASSED TEST CASE 4'
else
  echo "FAILED TEST CASE 4: id - $RESULT_4"
fi

echo "----------------------------------------------"

echo "TEST CASE 5 -- BATCH REQUEST MULTIPLE"
RESULT_5=$(curl -s \
  --request POST \
  --url $URL \
  --header 'Content-Type: application/json' \
  --data '[{"jsonrpc": "2.0", "id": "1sdsasd-32783-dsjfhsujd", "method": "eth_blockNumber", "params": []}, {"jsonrpc": "2.0", "id": "1sdsasd-32783-dsjfhsujd", "method": "eth_blockNumber", "params": []}]' \
  | jq -r '.id'
)

if [ "$RESULT_5" != "null" ]; then
  echo 'PASSED TEST CASE 5'
else
  echo "FAILED TEST CASE 5: id - $RESULT_5"
fi
