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
- Teleportation deployed to: `0x885bfeC3D89755d2bCc1e73b6EeEEae94D54eBE4`
- Proxy__Teleportation deployed to: `0xC226F132A686A08018431C913d87693396246024`

### BNB Testnet (L1)
- Teleportation deployed to: `0xf07A686af44C6b53391Bc56024f148739D528D27`
- Proxy__Teleportation deployed to: `0x1b633BdA998507795A4552809be25D1dCe1d881d`

### Boba Goerli
- Teleportation deployed to: `0x28fd3770b42797890e07d53DDd1e10DcD55D966E`
- Proxy__Teleportation deployed to: `0x64bD91c67af8cd17e04BeBDaac675f0EF6527edd`

### Boba BNB Testnet
- Teleportation deployed to: `0x885bfeC3D89755d2bCc1e73b6EeEEae94D54eBE4`
- Proxy__Teleportation deployed to: `0xC226F132A686A08018431C913d87693396246024`


---

## User flow / Dev flow: 
![TeleportationFlow](https://github.com/bobanetwork/boba/assets/28724551/1c5fceb8-126d-42d1-92b4-59ec5ed9ad71)

