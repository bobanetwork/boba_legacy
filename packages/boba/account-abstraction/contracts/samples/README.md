## Custom Paymasters
These custom paymasters, as per compatibiltiy with ERC4337 Account Abstraction design, will allow users to pay gas for txs using 'any' ERC20 token, and without needing any protocol level changes. The Sequencer would still only accept the fee token it identifies as per the protocol, the Paymaster pays the Sequencer in the native denomination and accepts the alt erc20 token as payment themselves.

### Paymasters
**Boba Deposit Paymaster** - uses an oracle to charge the user the correct amount of erc20 tokens in exchange for sponsoring their transactions through their deposit on the entrypoint.
Users need to deposit a stake amount on the paymaster in order to start using it. The stake ensures the paymaster can collect the erc20 tokens as payment in all conditions.
Since this uses an oracle(an external contract) to fetch the price ratio, the bundler would actually fail while simulating the userOp validation, the bundler should whitelist this paymaster if they trust it.


**Boba Verifying Paymaster** (optional) - The Deposit Paymaster needs a stake from the user prior to allowing them to use it. The stake amount should be close to the gas fee for one call, which the Paymaster operator could also sponsor for users to make the UX easier. But in addition to which, the Deposit Paymaster needs it to have been approved by the user for token spending permissions.
If the payment via alt token is to be extended to serve people without any native token to begin with, the Verifying Paymaster allows to sponsor approve() on the token and deposit() on the Deposit Paymaster


**Boba Deposit Paymaster without Oracle** (alternate) - BobaDepositPaymaster uses an oracle to find out the priceRatio between the erc20 and the native token. The bundler, while simulating the userOp validation would fail if `paymaster.validatePaymasterUserOp` accesses the state of any other contract than itself, and would probably require whitelisting by the bundler.
To go around this, an alternate Paymaster can be created which asynchronously updates the priceRatio, such that the validation isn't dependent on the oracle. However, this could mean running a script with a frequency as per is the required preceision