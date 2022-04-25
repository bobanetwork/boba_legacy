---
description: Fee scheme in Boba Network
---

# Fee Scheme

## Fee Scheme

This page refers to the **new** state of Boba Network after the gas hard fork on Boba Mainnet and Rinkeby. The gas hard fork is active at block 400,000 on Boba Mainnet and starts from block 0 on Boba Rinkeby.

You can see how the fee is calculated and deducted [here](004_transaction-fees.md).

### For backend developers: <a href="for-backend-developers" id="for-backend-developers"></a>

* You must send your transaction with a tx.gasPrice that is greater than or equal to the sequencer's l2 gas price. You can read this value from the Sequencer by querying the `OVM_GasPriceOracle` contract (`OVM_GasPriceOracle.gasPrice`) or by simply making an RPC query to `eth_gasPrice`. If you don't specify your `gasPrice` as an override when sending a transaction , `ethers` by default queries `eth_gasPrice` which will return the lowest acceptable L2 gas price.
* You can set your `tx.gasLimit` however you might normally set it (e.g. via `eth_estimateGas`). The gas usage for transactions on Boba Network will be larger than the gas usage on Ethereum, becuase the `l1SecurityFee` is included in the gas usage.
* We recommend building error handling around the `Fee too Low` error detailed below, to allow users to re-calculate their `tx.gasLimit` and resend their transaction if L1 gas price spikes.

### For Frontend and Wallet developers: <a href="for-frontend-and-wallet-developers" id="for-frontend-and-wallet-developers"></a>

* We recommend displaying an estimated fee to users using `eth_estimateGas`

```
import { ethers } from 'ethers'
const WETH = new Contract(...) //Contract with no signer
const fee = WETH.estimateGas.transfer(to, amount)
```

* You should _not_ allow users to change their `tx.gasPrice`
  * If they lower it, their transaction will revert
  * If they increase it, they will still have their tx immediately included, but will have overpaid.

* Users are welcome to change their `tx.gasLimit` as it functions exactly like on L1. You can show the math :

  ```
  Fee: .00098 ETH ($3.94)
  ```

* Might need to regularly refresh the L2 Fee estimate to ensure it is accurate at the time the user sends it (e.g. they get the fee quote and leave for 12 hours then come back)
  * Ideas: If the L2 fee quoted is > X minutes old, could display a warning next to it

### Common RPC Errors <a href="common-rpc-errors" id="common-rpc-errors"></a>

There are three common errors that would cause your transaction to be rejected

1. **Insufficient funds**
   * If you are trying to send a transaction and you do not have enough ETH to pay for that L2 fee charged, your transaction will be rejected.
   * Error code: `-32000`
   * Error message: `invalid transaction: insufficient funds for l1Fee + l2Fee + value`
2. **Gas Price to low**
   * Error code: `-32000`
   * Error message: `gas price too low: 1000 wei, use at least tx.gasPrice = X wei` where `x` is l2GasPrice.
     * Note: values in this error message vary based on the tx sent and current L2 gas prices
   * It is recommended to build in error handling for this. If a user's transaction is rejected at this level, just set a new `tx.gasPrice` via RPC query at `eth_gasPrice` or by calling `OVM_GasPriceOracle.gasPrice`
3. **Fee too large**
   * Error code: `-32000`
   * Error message: `gas price too high: 1000000000000000 wei, use at most tx.gasPrice = Y wei` where `x` is 3\*l2GasPrice.
   * When the `tx.gasPrice` provided is ≥3x the expected `tx.gasPrice`, you will get this error^, note this is a runtime config option and is subject to change
