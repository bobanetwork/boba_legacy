# Teleportation

This service monitors the on-chain events and release funds when a new deposit is found.

## Configuration

All configuration is done via environment variables. See all variables at [.env.example](.env.example); copy into a `.env` file before running.

|                                       | Description                             | Default          |
|---------------------------------------|-----------------------------------------|------------------|
| L2_NODE_WEB3_URL                      | The endpoint of Layer 2                 |                  |
| TELEPORTATION_DISBURSER_KEY           | The pk of disburser                     |                  |
| TELEPORTATION_POLLING_INTERVAL        | The polling interval of fetching events | 60s              |
| TELEPORTATION_BLOCK_RANGE_PER_POLLING | The blcock range of each polling        | 1000             |
| TELEPORTATION_POSTGRES_PASSWORD       | The database password                   | abcdef           |
| TELEPORTATION_POSTGRES_DB_HOST        | The database host                       | teleportation_db |
| TELEPORTATION_POSTGRES_DB             | The database name                       | postgres         |
| TELEPORTATION_POSTGRES_PORT           | The database port                       | 5432             |
| TELEPORTATION_POSTGRES_USER           | The database user                       | postgres         |

## Building & Running

1. Make sure dependencies are installed - run `yarn` in the base directory
2. Build `yarn build`
3. Run `yarn start`

## Postgresql

Connect to Postgres on CLI:
`psql --username postgres -d postgres --password`


## Deployments

Audits outstanding.

---

## Testnet deployments

### Goerli (L1)
- Teleportation deployed to: `0xB93d9748808A5cC7dC6b61b31F15b87F50BfcAd0`
- Proxy__Teleportation deployed to: `0x84b22166366a6f7E0cD0c3ce9998f2913Bf17A13`

### BNB Testnet (L1)
- Teleportation deployed to: `0xD151c8F0dc69618e6180a2dC74B05cCE3E08e0aC`
- Proxy__Teleportation deployed to: `0x7f6a32bCaA70c65E08F2f221737612F6fC18347A`

### Boba Goerli
- Teleportation deployed to: `0x95ec63aE2573bD5e70C223E075D9483573968699`
- Proxy__Teleportation deployed to: `0xB43EE846Aa266228FeABaD1191D6cB2eD9808894`

### Boba BNB Testnet
- Teleportation deployed to: `0x46FA6144C61d2bb9aCDc3Ca90C8673dd9B6caEB2`
- Proxy__Teleportation deployed to: `0xf4d179d3a083Fa3Eede935FaF4C679D32d514186`


---

## User flow / Dev flow:
![TeleportationFlow](https://github.com/bobanetwork/boba/assets/28724551/1c5fceb8-126d-42d1-92b4-59ec5ed9ad71)


---

## Contract params
This section describes how whitelisted routes between networks can be configured. By default no asset can be bridged, not even the native asset - all need to be explicitly whitelisted.

### Indicate support
Support for an asset can be shut down and re-activated at any time (yes|no value).

### Minimum Deposit Amount
The minimum amount that needs to be deposited in order to be bridged. The value refers to the asset to be bridged (e.g. ETH or BOBA tokens) and will revert for transactions that do not exceed this threshold (>=).

### Maximum Deposit Amount
The maximum amount that can be deposited within one single bridge operation. The value refers to the asset that is being bridged and will revert for transactions that exceed this value.

### Maximum Amount Per Day
The maximum amount per day limits how many units of the asset to be bridged can be moved to the corresponding network per day.
