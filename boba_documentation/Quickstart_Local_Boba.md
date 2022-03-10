# Running the Boba stack locally

- [Running the Boba stack locally](#running-the-boba-stack-locally)
  * [Basics](#basics)
  * [Spinning up the stack](#spinning-up-the-stack)
    + [Helpful commands](#helpful-commands)
    + [Running unit tests](#running-unit-tests)
    + [Running integration tests](#running-integration-tests)

## Basics

**Note: this is only relevant to developers who wish to work on Boba core services. For most test uses, it's simpler to use https://rinkeby.boba.network**.

Clone the repository, open it, and install nodejs packages with `yarn`:

```bash
$ git clone git@github.com:bobanetwork/boba.git
$ cd optimism-v2
$ yarn clean
$ yarn
$ yarn build
```

Then, make sure you have Docker installed _and make sure Docker is running_. Finally, build and run the entire stack:

```bash
$ cd ops
$ BUILD=1 DAEMON=0 ./up_local.sh
```

## Spinning up the stack

Stack spin-up can take 15 minutes or more. There are many interdependent services to bring up with two waves of contract deployment and initialisation. Recommended settings - 10 CPUs, 30 to 40 GB of memory. You can inspect the Docker `Dashboard>Containers/All>Ops` for the progress of the `ops_deployer` _or_ you can run this script to wait for the sequencer to be up:

```bash
./scripts/wait-for-sequencer.sh
```

If the command returns with no log output, the sequencer is up. Once the sequencer is up, you can inspect the Docker `Dashboard>Containers/All>Ops` for the progress of `ops_boba_deployer` _or_ you can run the following script to wait for the Boba contracts (e.g. the fast message relay system) to be deployed:

```bash
./scripts/wait-for-boba.sh
```

When the command returns with `Pass: Found L2 Liquidity Pool contract address`, the entire Boba stack has come up correctly.

### Helpful commands

* _Running out of space on your Docker, or having other having hard to debug issues_? Run `docker system prune -a --volumes` and then rebuild the images.
* _To (re)build individual base services_: `docker-compose build -- l2geth`
* _To (re)build individual Boba typescript services_: `docker-compose build -- builder` and then `docker-compose build -- dtl` for example.

### Running unit tests

To run unit tests for a specific package:

```bash
$ cd packages/package-to-test
$ yarn test
```

### Running integration tests

Make sure you are in the `ops` folder and then run

```bash
$ docker-compose run integration_tests
```

Expect the full test suite to complete in between *30 minutes* to *two hours* depending on your computer hardware.
