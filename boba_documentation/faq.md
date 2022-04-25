---
description: Frequently asked questions to get started on Boba
---

# FAQ

## What is Boba Network?

Boba Network is an Optimistic Rollup that combines the great open source work done by [Optimism](https://community.optimism.io) with the research and development effort of the Enya team on swap-based onramp, fast exit, cross-chain bridging and other features.

We chose to build on Optimism because it is essentially a modified version of Ethereum, which makes it relatively easy to ensure EVM and Solidity compatibility, minimizing the efforts required to migrate smart contracts from L1 to L2.

## Is Boba a side chain?

Boba is not a side chain. Side chains are their own blockchain systems with entirely separate consensus mechanisms. Boba Network lives _inside_ of Ethereum as a series of smart contracts that are capable of executing Ethereum transactions. Whereas side chains rely on their own consensus mechanisms for security, Boba, as a child chain, instead relies on the security of Ethereum itself.

## What's the difference between Boba and Ethereum?

Boba is mostly identical to Ethereum. You can create and interact with Solidity smart contracts (just like you would on Ethereum) using the same wallet software you're already familiar with.

## Is Boba safe?

Boba Network is just as safe as the Ethereum chain. Optimistic Rollups are safe as long as Ethereum itself is "live" (not actively censoring transactions). This security model is backed by a system of "fraud proofs," whereby users are paid to reveal bad transaction results published to the Boba Optimism based chain.

## Is there a delay moving assets from Boba to Ethereum?

We developed a swap-based mechanism to deliver a smooth user experience for moving funds across chains, whether you are going from L1 to L2, L2 to L1, or between two L2s (as long as they are both EVM-compatible).

The users who choose to take advantage of this benefit will pay a small convenience fee that is shared among the liquidity providers of the pools backing the swaps. Acting as liquidity providers as described above is just the first of several staking opportunities we will roll out to the community. The higher level goal is to encourage broad-based participation in the operations and governance of Boba. As the only tokenized EVM-compatible L2, we are in a unique position to use our token responsibly for the long-term sustainability of the network.

## How are developers incentivized to build on Boba? <a href="f274" id="f274"></a>

While the high gas fees of Ethereum itself act as a pretty strong incentive for developers to move to layer 2s in general. As for Boba specifically, our pitch to them is: this is not just about scaling Ethereum. Once you’re on Boba Network, we’re also creating this amazing future for you. You’ll be able to tap into more advanced compute capabilities that are not available to you today. We also have plans to create an ecosystem fund to incentivize some of the early-stage projects who are just starting out but doing something really interesting. It’s going to take some time to put something like that together. That’s in our plans.

## How do I connect my wallet to Boba Network? <a href="038a" id="038a"></a>

Many wallets now allow applications to trigger a popup to switch between networks. If your wallet supports this feature then you will be automatically prompted to switch networks when an application wants to utilize a Boba Ethereum network. You can use the bridges to add the network to your wallet right here:

\* [Click here for Boba Network Ethereum, the **production** network](https://gateway.boba.network).

\* [Click here for Boba Network Rinkeby, the **test** network](https://gateway.rinkeby.boba.network).

If your wallet does not support this feature, you will have to connect manually. The exact process for connecting your wallet to a Boba Ethereum network depends on the specific wallet software you're using.

## How do I move assets into or out of Boba Network? <a href="038a" id="038a"></a>

To move assets into or out of an Optimistic Ethereum network you can use the [**Boba Gateway**](https://gateway.boba.network). We have detailed instructions in our [documentation](broken-reference).

## Can I cancel a withdrawal after it has been submitted? <a href="038a" id="038a"></a>

**No, withdrawals currently cannot be cancelled once submitted.**

## Can I transfer directly from Boba to a centralized Exchange? <a href="038a" id="038a"></a>

Only if the centralized exchange supports Boba Network (at writing none of them do). Otherwise you have to bridge your assets into a network they do support, such as L1.

## Where can I find RPC endpoints and connection details? <a href="038a" id="038a"></a>

Connection details for our Rinkeby network can be found [here](developer-docs/005\_parameters-rinkeby.md).

Connection details for our mainnet can be found [here](developer-docs/006\_parameters-mainnet.md).



## Are multicall contracts supported on Boba? <a href="038a" id="038a"></a>

Yes, however you will have to deploy your own version.

## What are the token decimals on L2 Boba? <a href="038a" id="038a"></a>

The token decimals on Boba L2 are the same as on Ethereum L1. So if the token has 6 decimals on L1, it will have 6 decimals on L2.

## The incentive contract for verification proofs is disabled

In the current release of the Boba Network protocol, there may be rare cases in which the Sequencer submits a state root (transaction result) which is invalid and therefore could be challenged. As a result, we have not yet deployed the [Bond Manager ](https://github.com/omgnetwork/optimism/blob/develop/packages/contracts/contracts/optimistic-ethereum/OVM/verification/OVM\_BondManager.sol)contract which compensates Verifier nodes for gas spent when submitting state root challenges. Verifier nodes in a default configuration do not run the [TypeScript service which submits challenges ](https://github.com/ethereum-optimism/optimism/blob/8d67991aba584c1703692ea46273ea8a1ef45f56/packages/contracts/test/contracts/OVM/verification/OVM\_FraudVerifier.spec.ts)in the event of mismatched state roots. Additionally, our upgrade keys have the ability to directly remove state roots without going through an uncompensated state root challenge.

## Boba operates the only "Sequencer" node

A Sequencer node is a special node in an Optimistic Ethereum network that can order transactions on short timescales (on the order of minutes). This opens up the door to very fast transaction confirmation times with strong guarantees about finality. Eventually, the operator of the Sequencer node on a network will be determined by some governing mechanism. For now, Boba Network operates the only such node.
