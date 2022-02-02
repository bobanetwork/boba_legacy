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

What is Wagmi and how does it work?

## Which smart contracts are involved and what do each of those contracts do?

* The LS generator
* The Long and Short tokens
* Which tokens go to which parties?

## Default options for the LS generator script paramterisation

## Wagmi contract addresses on Rinkeby and Mainnet

## Minting new Wagmi Tokens

### Each Wagmi token needs new Oracle

* Adding new oracles

### Private Key holders; Token Minting procedure

### Gateway changes needed

Adding new Wagmi tokens requires changes in four parts of the gateway - `networkServices.js`, `account.js`, `coinimages`, and tokenActions. Specically, changes are needed in 


