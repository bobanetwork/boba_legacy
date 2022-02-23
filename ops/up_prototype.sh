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

# Deploy the basics - L1 and DTL
docker-compose up -d l1_chain dtl
sleep 5

# Deploy the L2, batch_submitter, and the relayer
echo "Starting Optimism deployer"
docker-compose up deployer
docker-compose up -d l2geth batch_submitter relayer
sleep 5

# Deploy the fast message relayer and the gas oracle
echo "Starting Boba deployer (slow)"
docker-compose up boba_deployer
docker-compose up -d boba_message-relayer-fast gas_oracle
sleep 5

echo "Base system is up"
(cd ../packages/boba/ng-prototype ; yarn deploy)
echo "Activated contracts, starting agents"

docker-compose up -d l1-agent l2-agent
echo "All containers started"
sleep 5

# Remove the "--tail 1" if you need to see logs from the setup process
docker-compose logs --tail 1 --follow
