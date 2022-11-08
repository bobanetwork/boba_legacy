# BOBA Teleportation

BOBA Teleportation is a cheaper more centralized bridge for bridging small amounts of BOBA tokens between L2s.

**This contract have not been audited, execise caution when using this on mainnet.**

## Core contract

[Teleportation]() is the core contract to receive and release funds between different L2s. To achieve this goal and protect users, we implement multiple security protocols in the contract:

* The maximum deposit amount is capped at **100 BOBA ** for security reasons
* The maximum daily bridging amount is **10,000 BOBA**
* The relayer account and admin account are two different accounts.

## How to bridge BOBA tokens

### Bridge BOBA from Ethereum L2 to Alt L2s

First, users transfer their BOBA tokens to the Teleportation, starting with an approval

```js
const approveTx = await BOBA.approve(TELEPORTATION_CONTRACT_ADDRESS, AMOUNT)
```

Users then call `teleportBOBA` function to deposit BOBA tokens to the contract. The BOBA arrives on the target chain after serval minutes.

```js
const tx = await Teleportation.teleportBOBA(
	AMOUNT,
  TARGET_CHAIN_ID
)
await tx.await()
```

### Bridge BOBA between Alt L2s

BOBA is the native tokn on alt L2s, so users call `teleportNativeBOBA` function to deposit BOBA tokens to the contract.

```js
const tx = await Teleportation.teleportNativeBOBA(
	TARGET_CHAIN_ID,
  {value: AMOUNT},
)
await tx.wait()
```

### Bridge BOBA from Alt L2s to Ethereum

BOBA is the native tokn on alt L2s, so users call `teleportNativeBOBA` function to deposit BOBA tokens to the contract.

```
const tx = await Teleportation.teleportNativeBOBA(
	TARGET_CHAIN_ID,
  {value: AMOUNT},
)
await tx.wait()
```

## Supported chains

We support all BOBA L2s.

### Mainnet

| Chain Id | Name        | Contract Name        | Contract Address                           |
| -------- | ----------- | -------------------- | ------------------------------------------ |
| 288      | Ethereum L2 | Proxy__Teleportation | 0xd68809330075C792C171C450B983F4D18128e9BF |
| 1294     | Bobabeam    | Proxy__Teleportation | 0xd68809330075C792C171C450B983F4D18128e9BF |
| 43288    | Bobaavax    | Proxy__Teleportation | 0xd68809330075C792C171C450B983F4D18128e9BF |
| 56288    | Bobabnb     | Proxy__Teleportation | 0xd68809330075C792C171C450B983F4D18128e9BF |
| 301      | Bobaopera   | Proxy__Teleportation | 0xd68809330075C792C171C450B983F4D18128e9BF |

### Testnet

| Chain Id | Name              | Contract Name        | Contract Address                           |
| -------- | ----------------- | -------------------- | ------------------------------------------ |
| 1297     | Bobabase          | Proxy__Teleportation | 0xd68809330075C792C171C450B983F4D18128e9BF |
| 4328     | Bobaavax Testnet  | Proxy__Teleportation | 0xd68809330075C792C171C450B983F4D18128e9BF |
| 9728     | Bobabnb Testnet   | Proxy__Teleportation | 0xd68809330075C792C171C450B983F4D18128e9BF |
| 4051     | Bobaopera Testnet | Proxy__Teleportation | 0xd68809330075C792C171C450B983F4D18128e9BF |