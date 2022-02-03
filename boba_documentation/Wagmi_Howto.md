# Wagmi Howto

- [Wagmi Howto](#wagmi-howto)
  * [TLDR](#tldr)
  * [Which smart contracts are involved, and what do those contracts do?](#which-smart-contracts-are-involved--and-what-do-those-contracts-do-)
  * [Default options for the LS generator script paramterisation](#default-options-for-the-ls-generator-script-paramterisation)
  * [Wagmi contract addresses](#wagmi-contract-addresses)
  * [Minting new Wagmi Tokens](#minting-new-wagmi-tokens)
    + [Each Wagmi token needs new Oracle](#each-wagmi-token-needs-new-oracle)
    + [Private Key holders; Token Minting procedure](#private-key-holders--token-minting-procedure)
    + [Gateway changes needed](#gateway-changes-needed)

## TLDR

The WAGMI incentives program is Boba Network’s take on liquidity mining 2.0. In collaboration with 
UMA protocol, we are be distributing WAGMI options on $BOBA token to promising projects building on Boba. Users can earn WAGMI options using their favorite dApps on Boba Network. WAGMI options are KPI (key performance indicators) options redeemable for $BOBA tokens based on metrics relating to Boba Network, such as monthly active wallets or project specific TVL. 

WAGMI works by using UMA protocol's [optimistic oracle](https://umaproject.org/optimistic-oracle.html). $BOBA tokens are locked up in a smart contract that pays out subject to network KPIs (ie TVL of Boba), and secured in $WAGMIvX tokens. $BOBA is paid out after a 1 month settlement period on KPIs.

For more information, check out our [WAGMI webpage](https://boba.network/developers/wagmi/) or [tweet thread](https://twitter.com/bobanetwork/status/1478218201494294528)

## Which smart contracts are involved and what do each of those contracts do?

All mainnet Boba contracts that UMA has deployed can be found [here](https://github.com/UMAprotocol/protocol/blob/master/packages/core/networks/288.json)

* **LSP contract** The UMA LSP contract is deployed on Boba Network at [0x5E9d23daa1b27754bd9BEc66B9E87FA0ce0470Ec](https://blockexplorer.boba.network/address/0x5E9d23daa1b27754bd9BEc66B9E87FA0ce0470Ec/transactions). This contract locks 2 BOBA per option on minting. UMA's in-depth documentation on minting KPI options can be found [here](https://docs.umaproject.org/kpi-options/usage-tutorial). 
* The LS generator
* **LongShortPair contract** 0x4B9A968b87316Df5A2AEd7c4193F16cAb42A9208 is verified on sourcify as a full match on chain id 288. Note: you can check this yourself at https://repo.sourcify.dev/select-contract/ and see the verified files in the sourcify repo here: https://repo.sourcify.dev/contracts/full_match/288/0x4B9A968b87316Df5A2AEd7c4193F16cAb42A9208/.
* The Long and Short tokens
* Which tokens go to which parties?

## Default options for the LS generator script paramterisation

## Wagmi contract addresses on Rinkeby and Mainnet

## Minting new Wagmi Tokens

UMA provided us with this minting example below:

```
# From UMA protocol repo on hardhat console I first load the LSP contract and BOBA as collateral:

LongShortPair = getContract("LongShortPair").at("0x5e9d23daa1b27754bd9bec66b9e87fa0ce0470ec")
collateralToken = getContract("ERC20").at("0xa18bF3994C0Cc6E3b63ac420308E5383f53120D7")

# Then I approved LSP to spend some BOBA tokens:

await collateralToken.methods.approve(LongShortPair.options.address, web3.utils.toWei("10")).send({gas: 100000, gasPrice: 2 * 1000000000, from: (await web3.eth.getAccounts())[0]})

# I minted pair of option tokens:

await LongShortPair.methods.create(web3.utils.toWei("5")).send({gas: 300000, gasPrice: 2 * 1000000000, from: (await web3.eth.getAccounts())[0]})

# And tested redeem:

await LongShortPair.methods.redeem(web3.utils.toWei("2.5")).send({gas: 200000, gasPrice: 2 * 1000000000, from: (await web3.eth.getAccounts())[0]})
```

### Each Wagmi token needs new Oracle

* Adding new oracles

### Private Key holders; Token Minting procedure

### Gateway changes needed

Adding new Wagmi tokens requires changes in four parts of the gateway - `networkServices.js`, `account.js`, `coinimages`, and tokenActions. Specically, changes are needed in 


