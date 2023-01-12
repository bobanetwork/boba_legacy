# Builds an image using Buildx. Usage:
# build <name> <tag> <dockerfile> <context>
function build() {
    echo "Building $1."
    echo "Tag: $2"
    echo "Dockerfile: $3"
    echo "Context: $4"
    docker buildx build \
        --tag "$2" \
        --cache-from "type=local,src=/tmp/.buildx-cache/$1" \
        --cache-to="type=local,dest=/tmp/.buildx-cache-new/$1" \
        --file "$3" \
        --load "$4" \
        &
}

mkdir -p /tmp/.buildx-cache-new
build l2geth "bobanetwork/l2geth:latest" "./l2geth/Dockerfile" .
build l1chain "bobanetwork/hardhat-node:latest" "./ops/docker/hardhat/Dockerfile" ./ops/docker/hardhat

wait

build deployer "bobanetwork/deployer:latest" "./ops/docker/Dockerfile.deployer" .
build dtl "bobanetwork/data-transport-layer:latest" "./ops/docker/Dockerfile.data-transport-layer" .
build relayer "bobanetwork/message-relayer:latest" "./ops/docker/Dockerfile.message-relayer" .
build relayer-fast "bobanetwork/boba_message-relayer-fast:latest" "./ops/docker/Dockerfile.message-relayer" .
build f "bobanetwork/fault-detector:latest" "./ops/docker/Dockerfile.fault-detector" .
build integration-tests "bobanetwork/integration-tests:latest" "./ops/docker/Dockerfile.integration-tests" .

wait
