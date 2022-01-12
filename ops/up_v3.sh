#!/bin/bash
#
# Script to start up a local V3 prototype system.
#
# NOTE - the deployer steps are very slow because the L1 chain operates
# with a fixed block time rather than auto-mining a block per transaction.
# The deployers could be re-written to do more stuff in parallel. For now,
# schedule a coffee break.
set -x

#Build if requested
if [[ $BUILD == 1 ]]; then
  yarn
  yarn build
  docker-compose build
fi

docker-compose up l1_chain dtl &
sleep 10
echo "Starting Optimism deployer"

docker-compose up deployer
docker-compose up l2geth batch_submitter relayer &
sleep 10
echo "Starting Boba deployer (slow)"
docker-compose up boba_deployer
docker-compose up boba_message-relayer-fast gas_oracle &
sleep 10
echo "Base system is up"
(cd ../packages/boba/v3-prototype ; yarn deploy)
echo "Activated V3 contracts"

