---
description: Turing Example - Getting started with Turing 
---

# Turing Start

Use Turing with ease by navigating through a minimal web-app. 

![image](https://user-images.githubusercontent.com/28724551/165357134-7ed58663-e887-43bc-814b-0deb3470157e.png)

## How does this help me?

Using Turing basically requires 3 things: 

1. Deploying the TuringHelper contract

2. Fund the TuringHelper with some BOBA tokens

3. Deploy an AWS endpoint which receives the smart contract call and returns the result to your contract in a readable way within the same transaction. 

This process can be tedious for new fellow coders, so we decided to build this Turing Starter app, which basically guides you through the process and automatically deploys and funds a new TuringHelper just for you. 

## Project structure

### [contracts](https://github.com/bobanetwork/boba/tree/docs-in-monrepo/boba_community/turing-start/packages/contracts)

This package is used within the react app (referenced via package.json) and contains the deployed contract addresses as well as the ABIs etc.

### [dapp-contracts](https://github.com/bobanetwork/boba/tree/docs-in-monrepo/boba_community/turing-start/packages/dapp-contracts)

In this package you'll find the actual solidity smart contracts which have been deployed for this DApp to work.

### [react-app](https://github.com/bobanetwork/boba/tree/docs-in-monrepo/boba_community/turing-start/packages/react-app)

This package contains the react app the user actually navigates through. 

* **Rinkeby**: [turing.rinkeby.boba.network](https://turing.rinkeby.boba.network/)
* **Mainnet**: [turing.boba.network](https://turing.boba.network/)
