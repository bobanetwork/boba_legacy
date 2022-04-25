---
description: Introduction to Boba Network
---

# Boba Network

This is the primary documentation for [Boba](https://boba.network) a compute-focused L2. Fundamentally, Ethereum is a distributed computer. We believe that L2s can play a unique role in augmenting the base _compute_ capabilities of the Ethereum ecosystem. You can learn more about Turing hybrid compute [here](./packages/boba/turing/README.md).

<a href="https://github.com/bobanetwork/boba/blob/develop/packages/boba/turing">
  <img alt="Boba" src="https://github.com/bobanetwork/boba/blob/develop/packages/boba/gateway/src/images/boba2/turing.png" width=500>
</a>

 Boba is built on the Optimistic Rollup developed by [Optimism](https://optimism.io). Aside from its main focus, augmenting compute, Boba differs from Optimism by:

  * providing additional cross-chain messaging such as a `message-relayer-fast`
  * using different gas pricing logic
  * providing a swap-based system for rapid L2->L1 exits (without the 7 day delay)
  * providing a community fraud-detector that allows transactions to be independently verified by anyone
  * interacting with L2 ETH using the normal ETH methods (`msg.value`, `send eth_sendTransaction`, and `provider.getBalance(address)` rather than as WETH
  * being organized as a [DAO](./packages/boba/contracts/contracts/DAO)
  * native [NFT bridging](./packages/boba/contracts/contracts/bridges)
  * automatically relaying classical 7-day exit messages to L1 for you, rather than this being a separate step

Boba is maintained by the [Enya](https://enya.ai) team. Our documentation is a work in progress. If you have questions or feel like something is missing check out our [Discord server](https://omg.eco/support) where we are actively responding, or [open an issue](https://github.com/bobanetwork/boba/issues) in the GitHub repo for this site.

### Direct Support

[Telegram](https://t.me/bobadev)\
[Discord](https://omg.eco/support)
