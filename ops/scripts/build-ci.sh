yarn
yarn build

docker-compose build --parallel -- builder l2geth l1_chain
docker-compose build --parallel -- deployer dtl batch_submitter relayer integration_tests
docker-compose build --parallel -- boba_message-relayer-fast boba_deployer fraud-detector aa_deployer

docker ps

wait
