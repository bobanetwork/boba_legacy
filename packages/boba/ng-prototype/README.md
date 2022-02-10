This directory contains the Portal and Ethpool contracts, along with
a deployer script.

## Running the prototype

```bash
$ cd optimism-v2
$ yarn clean
$ yarn
$ yarn build
$ cd ops
$ BUILD=1 ./up_prototype.sh
```

## Tests

Testing the tunneling and new relay system

```bash
$ yarn test:integration //this runs test/ng-test.ts
```

