#!/bin/bash

#if ! [ -x "$(command -v yq)" ]; then
#  echo 'Error: yq is not installed. brew install yq' >&2
#  exit 1
#fi

if [[ $BUILD == 2 ]]; then
  echo 'You set BUILD to 2, which means that we will use existing docker images on your computer'
fi

if [[ $BUILD == 1 ]]; then
  echo 'You set BUILD to 1, which means that all your dockers will be (re)built'
fi

if [[ $BUILD == 0 ]]; then
  echo 'You set BUILD to 0, which means that you want to pull Docker images from Dockerhub'
fi

if [[ $DAEMON == 1 ]]; then
  echo 'You set DAEMON to 1, which means that your local L1/L2 will run in the background'
fi

if [[ $DAEMON == 0 ]]; then
  echo 'You set DAEMON to 0, which means that your local L1/L2 will run in the front and you will see all the debug log information'
fi

if [[ $(uname -m) == 'arm64' ]]; then
  echo 'Building for Mac silicon using linux/arm64'
fi

#Build dependencies, if needed
if [[ $BUILD == 1 ]]; then
  yarn
  yarn build
fi

if [[ $DOCKER_FILE == "" ]] ; then
  DOCKER_FILE="docker-compose.yml"
  echo "Using default docker-compose file: $DOCKER_FILE"
else
  echo "Using docker-compose file: $DOCKER_FILE"
fi

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null && pwd)"

if [[ $BUILD == 1 ]]; then
  docker-compose -f $DOCKER_FILE build --parallel -- l2geth l1_chain
  docker-compose -f $DOCKER_FILE build --parallel -- deployer dtl batch_submitter relayer integration_tests
  docker-compose -f $DOCKER_FILE build --parallel -- boba_message-relayer-fast boba_deployer
  docker-compose -f $DOCKER_FILE build --parallel -- verifier replica
  docker-compose -f $DOCKER_FILE build  fraud-detector

elif [[ $BUILD == 0 ]]; then
  docker-compose -f "$DIR/$DOCKER_FILE" pull
  echo 1
fi

if [[ $DAEMON == 1 ]]; then
  docker-compose \
    -f "$DIR/$DOCKER_FILE" \
    up --no-build --detach -V
else
  docker-compose \
    -f "$DIR/$DOCKER_FILE" \
    up --no-build -V --no-recreate
fi
