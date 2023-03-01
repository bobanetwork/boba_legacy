#!/bin/bash -xe
#echo prepack for "contracts" package

cd `dirname $0`/..
pwd

yarn clean
yarn compile

mkdir -p artifacts_clean
cp `find  ./artifacts/contracts -type f | grep -v -E 'Test|dbg|gnosis|bls|IOracle'` artifacts_clean/
rm -rf artifacts/*
mv artifacts_clean/* artifacts/
rmdir artifacts_clean
npx typechain --target ethers-v5 --out-dir types  artifacts/**
npx tsc index.ts -d --outDir dist
