# @eth-optimism/regenesis-surgery

## What is this?

`regenesis-surgery` contains a series of scripts and tests necessary to perform a regenesis on Optimistic Ethereum.

## Getting started

After cloning and switching to the repository, install dependencies:

```bash
$ yarn
```

### Configuration

We're using `dotenv` for our configuration.
To configure the project, clone this repository and copy the `env.example` file to `.env`.

Move the `state-dump.prod.json` and `state-dump.latest.json` to the `state-dump` folder.

> state-dump.prod.json is the dump file from the production environment
>
> state-dump.latest.json is the dump file for the new netowrk

### Runnign scripts

To run an individual script directly:

```bash
$ yarn surgery:v1-to-v2
```

### Test ERC20s

```bash
$ yarn surgery:v1-to-v2:boba
```

It checks the `decimals()`, `name()`, `symbol()` and `l1Token()` of L2 ERC20s to make sure it is consistent with L1 ERC20s.

### Test Core

```bash
$ yarn surgery:v1-to-v2:core
```

It checks the params inside the core contracts.
