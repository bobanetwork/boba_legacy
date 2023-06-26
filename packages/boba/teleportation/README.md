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

### Boba Goerli
- Teleportation deployed to: `0x71348271f12b98Bbc83c329dcaA424EC6F1F05F2`
- Proxy__Teleportation deployed to: `0x97880a36512d3D478552ec24d81978ff631dB106`

### Boba Avax Testnet
- Teleportation deployed to: `0xeff787698c7C3bc87F2dd16662454215c0C84ea1`
- Proxy__Teleportation deployed to: `0x867A329179565eE07108846cb0F3F8673fE58030`

### Boba BNB Testnet
- Teleportation deployed to: `0xAE914D1A772BDF17e1DA6c7Af99B9C7ae82c024A`
- Proxy__Teleportation deployed to: `0x748069569925847BACf07944bC4327500f66b320`

### Boba Opera Testnet (Fantom)
- Teleportation deployed to: `0xccAfe6E34c47a4285280f80aD23b3A5156a775Ef`
- Proxy__Teleportation deployed to: `0x07F331aEa6375F48695b1F9248801998754a6219`
