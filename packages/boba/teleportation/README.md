# Teleportation

This service monitors the on-chain events and release funds when a new deposit is found.

## Configuration

All configuration is done via environment variables. See all variables at [.env.example](.env.example); copy into a `.env` file before running.

|                             | Description                             | Default |
| --------------------------- | --------------------------------------- | ------- |
| L2_NODE_WEB3_URL            | The endpoint of Layer 2                 |         |
| TELEPORTATION_DISBURSER_KEY | The pk of disburser                     |         |
| POLLING_INTERVAL            | The polling interval of fetching events | 60s     |
| BLOCK_RANGE_PER_POLLING     | The blcock range of each polling        | 1000    |
| DATABASE_PATH               | The database location                   | ../db   |

## Building & Running

1. Make sure dependencies are installed - run `yarn` in the base directory
2. Build `yarn build`
3. Run `yarn start`

## Postgresql

Connect to Postgres on CLI:
`psql --username postgres -d postgres --password`
