# Transaction Monitor

## Run locally
```bash
# Install dependecies and copy artifacts
yarn install
yarn copy
# Start transaction monitor service
yarn start
```

## Build a DockerHub

To build the docker image(note you only have to run `yarn copy` once):

```bash
# Install dependecies and copy artifacts
yarn install
yarn copy

# Build Monitor Image
cd ops
docker build . --file ./docker/Dockerfile.monitor --tag bobanetwork/monitor
docker push omg/transaction-monitor:production-v1
```
```bash
# Start Monitor
docker-compose up
```


## Monitor

### Global env

| Environment Variable  | Required? | Default Value                                   | Description                                  |
| --------------------- | --------- | ----------------------------------------------- | -------------------------------------------- |
| L1_NODE_WEB3_URL      | No        | http://localhost:8545                           | HTTP endpoint for a Layer 1 (Ethereum) node. |
| L2_NODE_WEB3_URL      | No        | [http://localhost:9545](http://localhost:9545/) | HTTP endpoint for a Layer 2                  |
| MYSQL_HOST_URL        | No        | 127.0.0.1                                       | HTTP endpoint for MySQL.                     |
| MYSQL_PORT            | No        | 3306                                            | Port for the MySQL connection.               |
| MYSQL_USERNAME        | Yes       | N/A                                             | Name of the user to connect with.            |
| MYSQL_PASSWORD        | Yes       | N/A                                             | The user's password.                         |
| MYSQL_DATABASE_NAME   | No        | BOBAV1                                          | Name for the database.                       |
| BOBA_DEPLOYER_URL     | Yes       | N/A                                             | The URL for querying addresses.json file     |
| FILTER_ENDPOINT       | Yes       | N/A                                             | The URL for querying boba-addr.json file     |
| L1_BLOCK_CONFIRMATION | No        | 0                                               | The block confirmation for L1                |

### Block and receipt monitor

| Environment Variable                  | Required? | Default Value | Description                              |
| ------------------------------------- | --------- | ------------- | ---------------------------------------- |
| TRANSACTION_MONITOR_INTERVAL          | No        | 3 seconds     | The polling interval for L2 transactions |
| CROSS_DOMAIN_MESSAGE_MONITOR_INTERVAL | No        | 15 minutes    | The polling interval for CDM             |
| L1_CROSS_DOMAIN_MESSAGE_WAITING_TIME  | No        | 5 minutes     | The waiting for messages from L1 to L2   |
| L2_CROSS_DOMAIN_MESSAGE_WAITING_TIME  | No        | 1 hour        | The waiting for messages from L2 to L1   |
| NUMBER_OF_BLOCKS_TO_FETCH             | No        | 10000000      | The block range in SDK                   |

### State root monitor

| Environment Variable            | Required? | Default Value | Description                           |
| ------------------------------- | --------- | ------------- | ------------------------------------- |
| STATE_ROOT_MONITOR_INTERVAL     | No        | 1 hour        | The polling interval for state roots  |
| STATE_ROOT_MONITOR_START_BLOCK  | No        | 0             | The starting block number for monitor |
| STATE_ROOT_MONITOR_LOG_INTERVAL | No        | 2000          | The block range for querying events   |

### Exit message monitor

| Environment Variable      | Required? | Default Value | Description                         |
| ------------------------- | --------- | ------------- | ----------------------------------- |
| EXIT_MONITOR_INTERVAL     | No        | 15 minutes    | The polling interval for exits      |
| EXIT_MONITOR_LOG_INTERVAL | No        | 2000          | The block range for querying events |

### Deposit monitor

| Environment Variable           | Required? | Default Value | Description                               |
| ------------------------------ | --------- | ------------- | ----------------------------------------- |
| L1_BRIDGE_MONITOR_INTERVAL     | No        | 3 minutes     | The polling interval for tx from L1 to L2 |
| L1_BRIDGE_MONITOR_START_BLOCK  | No        | 0             | The starting block for L1 bridge          |
| L1_BRIDGE_MONITOR_LOG_INTERVAL | No        | 2000          | The block range for querying events       |

### Layer Zero monitor

| Environment Variable    | Required? | Default Value | Description                              |
| ----------------------- | --------- | ------------- | ---------------------------------------- |
| LAYER_ZERO_ENABLE_TEST  | No        | false         | Monitor testnet or mainnet               |
| LAYER_ZERO_CHAIN        | No        | Testnet       | The chain name                           |
| LAYER_ZERO_BRIDGES      | Yes       | N/A           | The bridge name                          |
| LAYER_ZERO_LATEST_BLOCK | No        | 0             | The starting block for Layer Zero bridge |

### Periodic transaction

| Environment Variable             | Required? | Default Value | Description                                 |
| -------------------------------- | --------- | ------------- | ------------------------------------------- |
| PERIODIC_TRANSACTION_PRIVATE_KEY | Yes       | N/A           | PK for test                                 |
| PERIODIC_TRANSACTION_INTERVAL    | No        | 10 minutes    | The waiting period for periodic transaction |

### Bobastraw monitor

| Environment Variable        | Required? | Default Value | Description                      |
| --------------------------- | --------- | ------------- | -------------------------------- |
| BOBASTRAW_CONTACT_ADDRESSES | Yes       | N/A           | Bobastraw contract addresses     |
| BOBASTRAW_MONITOR_INTERVAL  | No        | 10 minutes    | The polling interval for monitor |

### Balance monitor

| Environment Variable         | Required? | Default Value | Description                       |
| ---------------------------- | --------- | ------------- | --------------------------------- |
| L1_BALANCE_MONITOR_ADDRESSES | Yes       | N/A           | L1 contract addresses for monitor |
| L2_BALANCE_MONITOR_ADDRESSES | Yes       | N/A           | L2 contract addresses for monitor |
| BALANCE_MONITOR_INTERVAL     | No        | 10 minutes    | The polling interval for monitor  |
