#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
DOCKERFILE="docker-compose.yml"

nix run .#dtl.copyToDockerDaemon
nix run .#deployer.copyToDockerDaemon
nix run .#boba-deployer.copyToDockerDaemon
nix run .#batch-submitter.copyToDockerDaemon
nix run .#l2geth.copyToDockerDaemon
nix run .#hardhat.copyToDockerDaemon
nix run .#gas-price-oracle.copyToDockerDaemon
nix run .#monitor.copyToDockerDaemon
nix run .#relayer.copyToDockerDaemon
nix run .#integration-tests.copyToDockerDaemon
nix run .#fraud-detector.copyToDockerDaemon

if [[ $DAEMON == 1 ]]; then
    docker-compose \
    -f $DIR/$DOCKERFILE \
    up --detach -V
else
    docker-compose \
    -f $DIR/$DOCKERFILE \
    up -V
fi
