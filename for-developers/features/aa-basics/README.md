---
description: Learn more about Account Abstraction on Boba Network
---

# Ethereum Accounts

In general there are two types of accounts on Ethereum:
1. Contract Accounts (CA)
2. Externally Owned Accounts (EOA)

As the name suggests, EOAs are owned by something external to the blockchain - users just like you.

Externally Owned Accounts have 3 main properties:
1. The balance of the networks native coin available to the account
2. The nonce to ensure the uniqueness of every transaction
3. The address to uniquely identify the account

While a Contract Account is an account with code (smart contract) that executes when it receives a transaction. Like an EOA, a contract account can also hold ether and can be made to trigger arbitrary transactions. But a contract account needs to be controlled with an EOA.

## What is Account Abstraction

Account Abstraction is a way to unify the two account types into a single type of account - a smart contract account (upon full enforcement), and the way to access/control/use this account is freely customizable. The account, with code and open-ended access methods allows for a range of new features to be built on the chain and make life on-chain easier.

## Why we need Account Abstraction
Account Abstraction offers many advantages, a few are listed below and we suggest having a look at the [official documentation](https://ethereum.org/en/roadmap/account-abstraction/) as well.

- Multisig authorization
- Account freezing
- Account recovery
- Setting transaction limits
- Creating whitelists
- Paying Tx fees in alternate token
- Sponsoring Tx fees for users
- Social login
- Different Signature Schemes

## High Level Architecture
Account Abstraction under [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) consists of five major components:
1. **UserOperation**: Pseudo-transaction objects that express a user's intent
2. **Bundler**: Facilitating a transaction's path to finality
3. **EntryPoint**: Global contract to validate and execute UserOps
4. **Aggregators**: Aggregating UserOp signatures
5. **Paymasters**: Sponsoring user transactions
