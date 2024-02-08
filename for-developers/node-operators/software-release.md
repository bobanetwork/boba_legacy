# Node Software Releases

This page provides a list of the necessary versions of node software and instructions on how to keep them updated.

Our latest releases, notes and changelogs can be found on Github. `op-node` releases can be found [here](https://github.com/bobanetwork/v3-anchorage/tags) and `op-erigon` release can be found [here](https://github.com/bobanetwork/v3-erigon/releases).

## Required Version by Network

These are the minimal required versions for the `op-node`, `op-erigon` and `op-geth` by network.

| Network      | op-node                                                      | op-erigon                                                    | op-geth                                                      |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Boba Sepolia | [v1.5.0](https://github.com/bobanetwork/v3-anchorage/releases/tag/op-node%2Fv1.5.0) | [v0.2.2](https://github.com/bobanetwork/v3-erigon/releases/tag/v0.2.2) | [v1.101305.3](https://github.com/ethereum-optimism/op-geth/releases/tag/v1.101305.3) |

## [op-node v1.5.0](https://github.com/bobanetwork/v3-anchorage/releases/tag/op-node%2Fv1.5.0)

**Description**

This is a mandatory release for node operators on Sepolia. It includes three protocol activiations:

* Regolith activates on Sepolia at Thu Jan 18 17:59:48 UTC 2024

* Canyon activates on Sepolia at Thu Jan 18 17:59:48 UTC 2024
* Shanghai activates on Sepolia at Thu Jan 18 17:59:48 UTC 2024

**Required Action**

Upgrade your `op-node` software.

**Suggested action**

Explicitly specify `--network=boba-sepolia` with a pre-configured BOBA network

## [op-erigon v0.2.2](https://github.com/bobanetwork/v3-erigon/releases/tag/v0.2.2)

**Description**

This is a mandatory release for node operators on Sepolia. It includes three protocol activiations:

* Regolith activates on Sepolia at Thu Jan 18 17:59:48 UTC 2024

* Canyon activates on Sepolia at Thu Jan 18 17:59:48 UTC 2024
* Shanghai activates on Sepolia at Thu Jan 18 17:59:48 UTC 2024

**Required Action**

Upgrade your `op-erigon` software.

**Suggested action**

Explicitly specify `--chain=boba-sepolia` with a pre-configured BOBA network

## [op-geth v1.101305.3](https://github.com/ethereum-optimism/op-geth/releases/tag/v1.101305.3)

**Description**

This is a mandatory release for node operators on Sepolia.

**Required Action**

* Upgrade your `op-geth` software.
* Set `--networkid=28882`
