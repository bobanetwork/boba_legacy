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
