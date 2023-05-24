#!/bin/bash -xe
#echo prepack for "contracts" package

cd `dirname $0`/..
pwd

mkdir -p artifacts_clean
cp `find  ./artifacts/contracts -type f | grep -v -E 'Test|dbg|gnosis|bls|IOracle'` artifacts_clean/
typechain --target ethers-v5 --out-dir types artifacts_clean/**
rm -r artifacts_clean
npx tsc index.ts -d --outDir dist
