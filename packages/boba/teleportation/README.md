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
- Teleportation deployed to: `0x0D42E13a3a7203C281Ca72e90AF992781259197C`
- Proxy__Teleportation deployed to: `0x9A597f96899d9cc7Ba0Bd8a4148d7B7Ed6AA0300`

### Boba Goerli
- Teleportation deployed to: `0x3Ad2babB5E8E4f7a5cAc75d330655ab6f0FBa14A`
- Proxy__Teleportation deployed to: `0x2af1C32E1dE8e041B7E45525A1Ca3C519Fac312F`

### Boba Avax Testnet
- Teleportation deployed to: `0xB5FFFbB049DA94611b488f0921735b4B07e0BDDE`
- Proxy__Teleportation deployed to: `0x9A57d90E80BE60340f804fd2D0373dd34AB934A2`

### Boba BNB Testnet
- Teleportation deployed to: `0xf7dE3869B7a0333e6B3a513A37Dc6270041BCC05`
- Proxy__Teleportation deployed to: `0xE3B5FB4CDa3C4c58A804e8856B5eC81D87972512`
