#!/bin/bash

export SHELL=/bin/bash
set +eo pipefail

until $(cat lele | grep "BobaDao.deploy.ts:\nError: transaction failed"); do
  _counter=$(cat lele | grep -c "BobaDao.deploy.ts:")
  echo $_counter
  if [ $_counter -gt 1 ]; then
    echo "Detected a failure in Boba Deployer. Will retry."
    echo $(docker-compose logs boba_deployer)
    docker-compose down boba_deployer
    docker-compose up -d boba_deployer
    exit 0
  else
    echo "Nothing really"
  fi
done
