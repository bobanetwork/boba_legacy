# DRAFT Engineering update #6

Nov 14 2021

Greetings from your engineering team. The last few weeks and months have been very busy, as we are now supporting two complementary L2 solutions. **Boba** is our solution for L2 applications that need EVM compatibility. **Plasma** is our transfer-focused L2, which trades off EVM compatibility for extremely cost effective token transfer (e.g. with as many as 64,000 token transfers per batch). We are now the only team that covers two main L2 use cases.

## 1. Main Challenges

The main challenge for us, and indeed the entire Ethereum ecosystem, are the variable and high values for gas _and_ the increasingly high cost of ETH. For example, on Nov. 10, gas briefly spiked to 405 Gwei and ETH spiked to $4800. Compared to when OMG was launched in 2017, the average gas has increased from 16 to 136, and ETH has =increased from $320 to $4600. That's a **122x** overall increase on a USD basis (**136/16 * 4600/320 = 122**). The gas values in Nov. 2021, compounded by the price of ETH, present great challenges for us, our users, and the entire ETH ecosystem. Since we are trust-rooted in Ethereum mainchain, every single transaction we do requires us, and our users, to pay ETH directly or indirectly to miners on L1. The design of Boba, an Optimistic Rollup, allows us to provide significant cost savings compared to Ethereum. For example, a token swap on Boba is generally 13x less expensive than on Ethereum directly, turning a $150 fee into a $12 fee. 

## 2. User feedback

Aside from all the positive feedback, for which we are grateful, users raised two main issues, namely, (1) the long waiting times for cross-chain bridging and (2) the occasional reverts seen in the fast-bridging pools. 

**Increasing speed of the Fast Exits** Classic exits take 7 days, and, previously, fast exits took several minutes to several hours depending on L1 gas. We initially used an algorithm that waited, sometimes for 3 or 4 hours, for L1 gas to dip before relaying messages. However, you have told us that **you** want to be able to make that choice. Starting now, the gas for the L2->L1 bridging will float with current L1 gas. This means that if you need a bridge to execute quickly, _regardless of gas_, you can now do that. Or, if you have more time, you can decide to wait for L1 gas to dip before starting a bridge, saving you money. So now, you can choose the best approach for your needs. Related to these changes, as of now, _essentially all bridging operations should complete in 55 minutes or less_, regardless of L1 gas. 

**Reducing cost of Classical Bridge to L2** Code improvements have allowed us to reduce the average cost of classical L1->L2 bridging by about 30%. 

**Avoiding Fast bridging reverts** Occasionally, the fast bridges reverted. The difficulty was that pending transactions ahead of you, in the bridging queue, could deplete the bridge pools while you were waiting. This then led to a revert and an annoying delay for your funds to be returned to you from the bridge contracts. As of now, the gateway considers the current _and predicated_ future balance of the liquidity pools before allowing a fast-bridging operation to be initiated. 

## 3. System Security - Fraud Detection

We would like to draw your attention to the availability of the community fraud detection, as described [here]( https://docs.boba.network/user-docs/002_fraud-detection). As noted previously, the overall security of the system depending on independent verification of the state roots submit, and the more users that inspect our operations, root-by-root, the safer the overall system is. At present, the only incentive for you to run a fraud detector is to help secure your funds, which would appear to be very important to you. Moreover, additional mechanisms to incentive fraud-detection will soon be announced. 

## 4. Gnosis Multisig

Teams wishing to manage their treasuries on Boba, and large DeFi and NFT projects, need a multisig solution. Gnosis Multisig will be available within the next 10 days on Boba.
