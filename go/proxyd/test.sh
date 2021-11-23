#!/bin/bash
URL='http://127.0.0.1:8081'

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
if [[ $RESULT_1 == 1 ]]; then
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

if [[ $RESULT_2 == 1 ]]; then
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

if [[ $RESULT_3 == "1sdsasd-32783-dsjfhsujd" ]]; then
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
  --data '[{"jsonrpc": "2.0", "id": "1sdsasd-32783-dsjfhsujdasdf", "method": "eth_blockNumber", "params": []}]' \
  | jq -r '.id'
)

if [[ $RESULT_4 == "1sdsasd-32783-dsjfhsujdasdf" ]]; then
  echo 'PASSED TEST CASE 4'
else
  echo "FAILED TEST CASE 4: id - $RESULT_4"
fi

echo "----------------------------------------------"

echo "TEST CASE 5 -- BATCH REQUEST MULTIPLE"
RESULT_5=$(curl -s --request POST \
  --url $URL \
  --header 'Content-Type: application/json' \
  --data '[{"jsonrpc": "2.0", "id": "1sdsasd-32783-dsjfhsujd", "method": "eth_blockNumber", "params": []}, {"jsonrpc": "2.0", "id": "1sdsasd-32783-dsjfhsujd", "method": "eth_blockNumber", "params": []}]')
echo $RESULT_5
RESULT_5_1=$(echo $RESULT_5 | jq .[0].id)
RESULT_5_2=$(echo $RESULT_5 | jq .[-1].id)
if [[ "$RESULT_5_1" != "null" ]]; then
  echo 'PASSED TEST CASE 5'
else
  echo "FAILED TEST CASE 5: id - $RESULT_5_1"
fi
if [[ "$RESULT_5_2" != "null" ]]; then
  echo 'PASSED TEST CASE 5'
else
  echo "FAILED TEST CASE 5: id - $RESULT_5_2"
fi

echo "----------------------------------------------"

echo "TEST CASE 6 -- ERRROR REQUEST"
RESULT_6=$(curl -s \
  --request POST \
  --url $URL \
  --header 'Content-Type: application/json' \
  --data '{"jsonrpc": "2.0", "id": 1, "method": "eth_blockNumberrr", "params": []}' | jq -r .error.message)

if [[ $RESULT_6 == "rpc method is not whitelisted" ]]; then
  echo 'PASSED TEST CASE 6'
else
  echo "FAILED TEST CASE 6: $RESULT_6"
fi

echo "----------------------------------------------"


echo "TEST CASE 7 -- BATCH REQUEST MULTIPLE"
RESULT_7=$(curl -s --request POST \
  --url $URL \
  --header 'Content-Type: application/json' \
  --data '[{"jsonrpc": "2.0", "id": "1sdsasd-32783-dsjfhsujda", "method": "eth_chainId", "params": []}, {"jsonrpc": "2.0", "id": "1sdsasd-32783-dsjfhsujd", "method": "eth_blockNumber", "params": []}, {"jsonrpc": "2.0", "id": "1sdsasd-32783-dsjfhsujd", "method": "eth_blockNumber", "params": []}]')
echo $RESULT_7
RESULT_7_1=$(echo $RESULT_7 | jq .[0].id)
RESULT_7_2=$(echo $RESULT_7 | jq .[1].id)
RESULT_7_3=$(echo $RESULT_7 | jq .[-1].id)
if [[ "$RESULT_7_1" != "null" ]]; then
  echo 'PASSED TEST CASE 5'
else
  echo "FAILED TEST CASE 7: id - $RESULT_7_1"
fi
if [[ "$RESULT_7_2" != "null" ]]; then
  echo 'PASSED TEST CASE 7'
else
  echo "FAILED TEST CASE 7: id - $RESULT_7_2"
fi
if [[ "$RESULT_7_3" != "null" ]]; then
  echo 'PASSED TEST CASE 7'
else
  echo "FAILED TEST CASE 7: id - $RESULT_7_3"
fi

echo "----------------------------------------------"
