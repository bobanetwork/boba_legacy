---
description: Frequently asked questions
---

## What is Boba Network?

[Boba](https://boba.network) a compute-focused L2. Fundamentally, Ethereum is a distributed computer. We believe that L2s can play a unique role in augmenting the base _compute_ capabilities of the Ethereum ecosystem. You can learn more about Turing hybrid compute [here](./packages/boba/turing/README.md).

![](./packages/boba/gateway/src/images/boba2/turing.png)

Boba is built on the Optimistic Rollup developed by [Optimism](https://optimism.io). We chose to build on Optimism because it is essentially a modified version of Ethereum, which makes it relatively easy to ensure EVM and Solidity compatibility, minimizing the efforts required to migrate smart contracts from L1 to L2.

### Is Boba a side chain?

Boba is not a side chain. Side chains are their own blockchain systems with entirely separate consensus mechanisms. Boba Network lives _inside_ of Ethereum as a series of smart contracts that are capable of executing Ethereum transactions. Whereas side chains rely on their own consensus mechanisms for security, Boba, as a child chain, instead relies on the security of Ethereum itself.

### What's the difference between Boba and Ethereum?

Boba is mostly identical to Ethereum. You can create and interact with Solidity smart contracts (just like you would on Ethereum) using the same wallet software you're already familiar with.

### Is Boba safe?

Boba Network is just as safe as the Ethereum chain. Optimistic Rollups are safe as long as Ethereum itself is "live" (not actively censoring transactions). This security model is backed by a system of "fraud proofs," whereby users are paid to reveal bad transaction results published to the Boba Optimism based chain.

### Is there a delay moving assets from Boba to Ethereum?

We developed a swap-based mechanism to deliver a smooth user experience for moving funds across chains, whether you are going from L1 to L2, L2 to L1, or between two L2s (as long as they are both EVM-compatible).

The users who choose to take advantage of this benefit will pay a small convenience fee that is shared among the liquidity providers of the pools backing the swaps. Acting as liquidity providers as described above is just the first of several staking opportunities we will roll out to the community. The higher level goal is to encourage broad-based participation in the operations and governance of Boba. As the only tokenized EVM-compatible L2, we are in a unique position to use our token responsibly for the long-term sustainability of the network.

### How are developers incentivized to build on Boba?

While the high gas fees of Ethereum itself act as a pretty strong incentive for developers to move to layer 2s in general. As for Boba specifically, our pitch to them is: this is not just about scaling Ethereum. Once you’re on Boba Network, we’re also creating this amazing future for you. You’ll be able to tap into more advanced compute capabilities that are not available to you today. We also have plans to create an ecosystem fund to incentivize some of the early-stage projects who are just starting out but doing something really interesting. It’s going to take some time to put something like that together. That’s in our plans.

### How do I connect my wallet to Boba Network?

Many wallets now allow applications to trigger a popup to switch between networks. If your wallet supports this feature then you will be automatically prompted to switch networks when an application wants to utilize a Boba Ethereum network. You can use the bridges to add the network to your wallet right here:

\* [Click here for Boba Network Ethereum, the **production** network](https://gateway.boba.network).

\* [Click here for Boba Network Rinkeby, the **test** network](https://gateway.rinkeby.boba.network).

If your wallet does not support this feature, you will have to connect manually. The exact process for connecting your wallet to a Boba Ethereum network depends on the specific wallet software you're using.

### How do I move assets into or out of Boba Network?

To move assets into or out of an Optimistic Ethereum network you can use the [**Boba Gateway**](https://gateway.boba.network). We have detailed instructions in our [user documentation](./boba_documentation/user/001_how-to-bridge.md). If you are a developer, there are two methods, the **classical bridge** and the **fast bridge** [more information](./boba_documentation/developer/bridge-l1-and-l2/bridge-basics.md).

### Can I cancel a withdrawal after it has been submitted?

**No, withdrawals currently cannot be cancelled once submitted.**

### Can I transfer directly from Boba to a centralized Exchange?

Only if the centralized exchange supports Boba Network (at writing none of them do). Otherwise you have to bridge your assets into a network they do support, such as L1.

### Where can I find RPC endpoints and connection details?

Connection details for our Mainnet and Rinkeby network can be found [here](./boba_documentation/developer/network_parameters.md).

./boba\_documentation/developer/xdomain-tx-status.md

### Are multicall contracts supported on Boba?

Yes, however you will have to deploy your own version.

### What are the token decimals on L2 Boba?

The token decimals on Boba L2 are the same as on Ethereum L1. So if the token has 6 decimals on L1, it will have 6 decimals on L2.

You can check decimals using the [blockexplorer](https://blockexplorer.boba.network), for example:

`https://blockexplorer.boba.network/tokens/0x66a2A913e447d6b4BF33EFbec43aAeF87890FBbc/token-transfers`

You can also check the decimals by calling the token contracts:

```javascript
const decimals = await this.ERC20_Contract.attach(tokenAddress).connect(this.L2Provider).decimals()
//typical values are 18 or, in some rare but important cases, 6
```

### The incentive contract for verification proofs is disabled

In the current release of the Boba Network protocol, there may be rare cases in which the Sequencer submits a state root (transaction result) which is invalid and therefore could be challenged. As a result, we have not yet deployed the [Bond Manager](./packages/contracts/contracts/optimistic-ethereum/OVM/verification/OVM\_BondManager.sol) contract which compensates Verifier nodes for gas spent when submitting state root challenges. Additionally, our upgrade keys have the ability to directly remove state roots without going through an uncompensated state root challenge.

### Boba operates the only "Sequencer" node

A Sequencer node is a special node in an Optimistic Ethereum network that can order transactions on short timescales (on the order of minutes). This opens up the door to very fast transaction confirmation times with strong guarantees about finality. Eventually, the operator of the Sequencer node on a network will be determined by some governing mechanism. For now, Boba Network operates the only such node.

### What is the Gas Price on Boba L2?

The Gas Price on L2 changes every **30 seconds** with some smoothing to reduce sharp discontinuities in the price from one moment to the next. The maximum percentage change from one value to another is capped to not more than 5% in the gas price oracle. For example, if the current `gasPrice` is 10 Gwei then the next `gasPrice` will be between 9.5 and 10.5 Gwei. Like on mainchain, the current gas price can be obtained via `.getGasPrice()` and is typically around 10 Gwei.

### Do you support EIP-2470: Singleton Factory?

Yes! [ERC-2470](https://eips.ethereum.org/EIPS/eip-2470) is deployed to `0xce0042B868300000d44A59004Da54A005ffdcf9f` on the Boba L2. The address on the Boba L2 is the same as on Ethereum mainnet.

### How do I follow cross domain (xDomain) transactions and their status?

There are 4 different mechanisms for following the status of a transaction.

1. The Boba Blockexplorer (for L2) and Etherscan (for L1)
2. Running a typescript `watcher`
3. Using the Boba `watcher-api`
4. Third-party analytics

These methods are described [here](./boba_documentation/developer/xdomain-tx-status.md).

# Developer FAQ

![Boba---August-08---Hybrid-Compute-Slide2](https://user-images.githubusercontent.com/107710263/184889568-34e1a67c-a448-471c-a92d-60dfbe2ee890.png)

Categories:
- Smart Contracts
- Testing and Testnets
- Transactions
- Hybrid Compute

## Smart Contracts
### Q1: How Can I Verify My Smart Contracts?

After your smart contract has already been uploaded into the Boba network, you can verify it by using the search bar in Boba’s block explorer and searching for your smart contract’s unique address.


<kbd><img width="1055" alt="Screen Shot 2022-06-13 at 1 54 27 PM" src="https://user-images.githubusercontent.com/107710263/184890853-40312e50-0c52-4113-9956-8cdf2e97d1e8.png"></kbd>


Navigate to the “logs” tab, and you’ll find a prompt:


<kbd><img width="598" alt="Screen Shot 2022-08-16 at 3 35 18 PM" src="https://user-images.githubusercontent.com/107710263/184892996-56ac1653-8291-4944-942d-6a41bf98d334.png"></kbd>


<center><p>(To see accurate decoded input data, the contract must be verified. Verify the contract here)</p></center>

Click on the associated link, and you’ll be taken to a page where you can enter your contract’s information.

Once you’re finished, hit “Verify & Publish”


<kdb><img width="598" alt="Screen Shot 2022-08-16 at 3 35 35 PM" src="https://user-images.githubusercontent.com/107710263/184893126-3f0197fb-caf5-46d6-9c90-1aa091cbc245.png"></kbd>


Alternatively, you could also [use services like Souricify](https://sourcify.dev/) to verify your smart contract as well.

The full details of this process [can be found in the docs](https://docs.boba.network/for-developers/verify-smart-contracts)

If you’re unfamiliar with what a smart contract is, please [go to the Ethereum documentation](https://ethereum.org/en/developers/docs/smart-contracts/) on smart contracts.

### Q2: Why Can't I Deploy My 100kb Copy/Paste Contract?

Instead of deploying just one contract, you need to deploy several. 

### Q3: Are There Any Technical Changes or Differences in Smart Contract and Gas Table from Boba Network’s Side in Comparison to BSC or Ethereum Networks?

Nope. It's the same.

### Q4: DEX is Built in 0.7.6. Is it Safe to Use Solc Optimization on it?
Yes!

### Q5: Is It OK With the Boba Network if the Source Code of Our App Is Closed Source?

Boba network is a permissionless network, therefore we cannot influence project decisions about the disclosure of their source code. However, we would advise End Users not to interact with smart contracts with code that is not verified in the Blockexplorer.

### Q6: Is There a Way to Run Arbitrary Compiled Native Code or WASM in a Smart Contract?

Unfortunately no, not at the moment.

### Q7: I’m Trying to Deploy a Smart Contract to Boba Rinkeby With Remix But Get This Error - "creation of SCContract errored: [ethjs-query] while formatting outputs from RPC '{"value":{"code":-32603,"data":{"code":-32000,"message":"invalid transaction: exceeds block gas limit"}}}'
See Q2 of Transactions


## Testing and Testnets
### Q1: Does Boba Network Have a Testnet/How Do I Get Testnet Boba or Eth?

Boba Network does have a testnet, and it uses authentication through Twitter. Here’s a short walkthrough on how to get it.

First, you have to download MetaMask on your browser as a plug-in and set up a MetaMask wallet.

Don’t be surprised by the fox that will follow your cursor when you first launch the application. He’s friendly.


<kdb><img width="662" alt="Screen Shot 2022-06-15 at 3 39 21 PM" src="https://user-images.githubusercontent.com/107710263/184896453-1d7ff6b8-98c1-48d1-9b78-a989abc1fe55.png"></kdb>


After you’ve set up your MetaMask account, you can [connect to the Rinkeby network Testnet](https://gateway.rinkeby.boba.network/). After that, follow these steps:

- Notice your connection status being displayed in the upper-right corner, along with a button that will allow you to select a chain to connect to.
- Click on the Boba icon, and MetaMask will prompt you to connect to the Rinkeby Boba network.
- Click on the account you would like to use for your testnet, then hit Next.
- Allow permissions by hitting Connect. 
- Observe that all of the network details such as the Network name, URL, and Chain ID have all been auto-filled.
- Hit Approve.


<kdb><img width="358" alt="Screen Shot 2022-06-15 at 4 25 41 PM" src="https://user-images.githubusercontent.com/107710263/184896877-5ce5a35f-287a-401e-9c31-7d99cf62ce17.png"></kdb>


Now that you’re connected to the network, you can authenticate with Twitter:


<kdb><img width="1057" alt="Screen Shot 2022-07-29 at 4 13 39 PM" src="https://user-images.githubusercontent.com/107710263/184897259-1937d096-738d-4534-b5ed-1f6cee2cf7e2.png"></kdb>


- Hit the Tweet Now button to tweet your “Boba Bubble” token.
- Once your tweet is shared, copy the link leading to it.
- Paste the link to your tweet where you’re prompted to do so.

For more information on Boba’s testnet and fountain, [check out our documentation](https://docs.boba.network/for-developers/network-fantom#bobaopera-testnet-addresses).

**NOTE: You can only make one fountain call per Twitter account, per day.**

### Q2: I am trying to run Boba Network Locally. I’m Able to Run Unit Tests, But Integration Tests Give an Error. ./scripts/wait-for-sequencer.sh is getting timed out. Any Solutions?

Please be sure to attach logs of output of `docker-compose logs` and integration tests. That should solve the problem.

### Q3: I’ve Started Deploying Boba Testnet, But It Seems as Though the Testnet Subgraph Is Private

We have the graph node on Ethereum Mainnet L2 and Rinkeby L2. The Rinkeby graph node is public. The Mainnet graph node is hosted by The Graph team.

## Transactions
### Q1: Why Isn’t My Transaction Going Through?

Although you will get an error message that says the gas limit is 1,000,000,000,000,000 Wei, the Boba Network will throw an error anytime the gas price is equal to or more than three times the expected gas price for any given transaction.

When you make an Ethereum transaction, the user will be given an expected fee for what they can expect that transaction to cost. Say you’re about to transfer some Ethereum into your friend’s account. And you’re given an expected transaction fee of 3 USD. If, for whatever reason (because the market changes quickly), the gas prices sky-rocket, and now the transaction fee is 9 USD, you’re going to receive an error message.

The reason why is because Boba is looking out for you. Before that unexpectedly expensive payment goes through, Boba will throw an error and prevent the payment from going through to make sure you aren’t paying more than you should be. If the transaction fee is at least three times what the expected cost was (in our example, your transaction fee of 3 USD jumped to 9 USD), the transaction will fail before you’re faced with that kind of payment.

[Read up on the documentation](https://docs.boba.network/for-developers/fee-scheme#for-frontend-and-wallet-developers) to find out more.

### Q2: The Dapp Requires an Approximate XZY Gas to Deploy, Boba's Block Gas Limit is Only 11,000,000, Making it Impossible to Deploy the DEX. What Can Be Done to Deploy the DEX on Boba?

Try to increase higher solc optimizations. For more clarification, check out the Solidity documentation or break down contracts into smaller chunks.

### Q3: How Can I Pay for Fees with BOBA Via an API?
Below is the js code needed to utilize the API:

```
const registerTx = await Boba_GasPriceOracle.useBobaAsFeeToken()
   await registerTx.wait()
expect(
     await Boba_GasPriceOracle.bobaFeeTokenUsers(env.l2Wallet.address)
   ).to.be.deep.eq(true)

```

### Q4: In the Other Blockchains That an ICO Was Made On, the Payment Coin Was the Blockchain’s Default Gas Coin. In Boba’s Case, the Coin is Ethereum. Shouldn’t the Option to Pay via Boba Token Be Added as Well?

Boba Network fees can be paid in Boba token and in Eth and it's in our End Users’ own discretion to decide which to use.

### Q5: When Making a Transaction on Boba and Paying Transaction Fee with Boba, is the Fee First Calculated in ETH at a Gas Price of 1 GWEI, Then Converted to Boba With a 25% Discount?

Yes, exactly!

### Q6: Do You Recommend Solidity Optimization, as the Max Value of Runs is 2^32 - 1? What Happens if the DEX Gets More Transactions Than That?

Optimization does not mean that there’s a limit set to the number of transactions this DEX can process.

[Check out Solidity’s official documentation for more information.](https://blog.soliditylang.org/2020/11/04/solidity-ama-1-recap/)

You can also [read up on using compilers and optimization options](https://docs.soliditylang.org/en/v0.8.4/using-the-compiler.html#optimizer-options) in Solidity’s documentation as well.

### Q7: Does Boba Network Have a Public TheGraph Node for Deploying Subgraphs?

This question is already answered [in our documentation on subgraphs](https://docs.boba.network/for-developers/subgraph), so be sure to check that out!

### Q8: Which Bridge Does Boba Network Use?

Actually, there are multiple bridges available. You can check it out on our ecosystem page, as can be seen below.


<kdb><img width="598" alt="Screen Shot 2022-08-16 at 4 03 04 PM" src="https://user-images.githubusercontent.com/107710263/184899440-3d50fc80-2f79-4075-acff-05eb8e2a2954.png"></kdb>


[Simply follow this link](https://gateway.boba.network/) and navigate to the Ecosystem tab.

## Hybrid Compute
### Q1: What Are the Limits on Hybrid Compute Web2 Calls?

This question is actually already [answered in our documentation](https://docs.boba.network/turing/turing#important-properties-of-turing). Be sure to read up and check it out!

### Q2: If Hybrid Compute is Automatic, Does That Mean Contract Execution Now Waits on API Response? How Long Can an Endpoint Delay Execution? Won't It Hit the API Endpoint Even in Cases of Simulations/Reverts?

First, [check out the documentation](https://docs.boba.network/turing/turing#important-properties-of-turing), it should clear up any confusion you may have about our Hybrid Compute.

Hybrid Compute calls need to execute estimateGas first. This puts the API response in a short lived cache, out of which the result is fetched in transaction processing.

### Q3: When Using the Hybrid Compute Feature, the Transaction on Metamask Pops Up, and If I Submit It Within a Few Seconds, Everything Will Work. But Waiting Longer and Submitting Results in Failure. Why is This Happening?

That's because the Hybrid Compute feature puts the Hybrid Compute response in a cache bucket. Your request including a Hybrid Compute request will put the response under a cache key that expires in 5 seconds: 

const turingCacheExpire = 5 * time.Second 

[You can see more about this in the documentation.](https://github.com/bobanetwork/boba/blob/develop/l2geth/core/vm/evm.go#L277)

### Q4: Is it Possible to Hide the API Key on Boba Hybrid Compute?

Not directly at the moment. We propose all authenticated calls that need API keys and similar go through a proxy/gateway that would act as an authentication layer for the caller - if that's a suitable design.
