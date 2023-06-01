---
description: Relay messages on L1
---

## Boba Message Relayer

This script allows anyone to check the status of a cross chain message from L2 to L1 and relay messages.

> This script supports all BOBA L2s

  ```bash
  $ git clone git@github.com:bobanetwork/boba.git
  $ cd boba/boba_community/boba-relayer
  $ yarn clean # only needed / will only work if you had it installed previously
  $ yarn
  ```

  Then, add `.env` in `boba/boba_community/boba-relayer`.

  ```yaml
L1_NODE_WEB3_URL=https://mainnet.infura.io/v3/KEY
L2_NODE_WEB3_URL=https://mainnet.boba.network
PRIV_KEY=
L2_TRANSACTION_HASH=
  ```

  Run the command to relay messages

  ```bash
  $ yarn start
  ```

