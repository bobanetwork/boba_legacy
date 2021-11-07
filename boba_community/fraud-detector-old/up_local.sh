#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"

DOCKERFILE="docker-detect.yml"

docker-compose -f $DIR/$DOCKERFILE up --no-build

