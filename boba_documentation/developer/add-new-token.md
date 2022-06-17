---
description: Adding new ERC20 tokens to Boba
---

To add a new ERC20 token to Boba, please:

1. Deploy an suitable L2 ERC20 contract, which allows only the `L2StandardBridge` to mint and burn tokens. The standard template is `L2StandardERC20.sol` (see `./packages/contracts/contracts/standards/L2StandardERC20.sol`)

2. Then, pass the address to the bridge, as in this example:

```javascript

// ./integration-tests/test/bridged-tokens.spec.ts

await env.messenger.waitForMessageReceipt(
  await env.messenger.depositERC20(
    L1__ERC20.address, // token's L1 address
    L2__ERC20.address, // token's L2 address
    1000 //amount in wei
  )
)

``` 