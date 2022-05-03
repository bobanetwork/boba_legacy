# Boba NFT Bridges

<img width="1097" alt="Boba NFT Bridge" src="https://user-images.githubusercontent.com/46272347/145503571-0b5e34c9-c55e-4ff8-8749-19a130d32958.png">

Boba NFT bridges support **native L1 NFTs** and **native L2 NFTs** to be moved back and forth.

* Native L1 NFT: the original NFT contract was deployed on L1
* Native L2 NFT: the original NFT contract was deployed on L2

Bridging an NFT to Boba takes several minutes, and bridging an NFT from Boba to Ethereum takes 7 days. **Not all NFTs are bridgeable - developers must use specialized NFT contracts (e.g. L2StandardERC721.sol) to enable this functionality.**

## Native L1 NFT - Developer Requirements

Assuming you have already deployed an NFT contract on L1, and you wish to transfer those NFTs to L2, please deploy [L2StandardERC721](https://github.com/bobanetwork/boba/tree/develop/packages/boba/contracts/contracts/standards) on Boba. The `L1_NFT_CONTRACT_ADDRESS` is the address of your NFT on Ethereum.

```js
const Factory__L2StandardERC721 = new ethers.ContractFactory(
  L2StandardERC721.abi,
  L2StandardERC721.bytecode,
  L2Wallet
)
const L2StandardERC721 = await Factory__L2StandardERC721.deploy(
  L2_NFT_BRIDGE_ADDRESS,   // L2 NFT Bridge Address
  L1_NFT_CONTRACT_ADDRESS, // Your L1 NFT Address
  NFT_NAME,
  NFT_SYMBOL,
  BASE_URI
)
await L2StandardERC721.deployTransaction.wait()
```

**NOTE: Once you have your L2StandardERC721 address, please contact us so we can register that address in the L1 and L2 NFT bridges.**

## Native L2 NFT - Developer Requirements

Deploy your NFT on Boba and then deploy [L1StandardERC721](https://github.com/bobanetwork/boba/tree/develop/packages/boba/contracts/contracts/standards) on Ethereum. The `L2_NFT_CONTRACT_ADDRESS` is the address of your NFT on Boba.

```js
const Factory__L1StandardERC721 = new ethers.ContractFactory(
  L1StandardERC721.abi,
  L1StandardERC721.bytecode,
  L1Wallet
)
const L1StandardERC721 = await Factory__L1StandardERC721.deploy(
  L1_NFT_BRIDGE_ADDRESS, // L1 NFT Bridge Address
  L2_NFT_CONTRACT_ADDRESS, // Your L2 NFT Address
  NFT_NAME,
  NFT_SYMBOL,
  BASE_URI
)
await L2StandardERC721.deployTransaction.wait()
```

**NOTE: Once you have your L1StandardERC721 address, please contact us so we can register that address in the L1 and L2 NFT bridges.**

## How to bridge NFTs

### CASE 1 - Native L1 NFT - Bridge NFTs from Ethereum to Boba

First, users transfer their NFT to the L1 NFT Bridge, starting with an approval.

```js
const approveTx = await L1NFT.approve(L1_NFT_BRIDGE_ADDRESS, TOKEN_ID)
await approveTx.wait()
```

Users then call the `depositNFT` or `depositNFTTo` function to deposit NFT to L2. The NFT arrives on L2 after eight L1 blocks.

```js
const tx = await L1NFTBrige.depositNFT(
  L1_NFT_CONTRACT_ADDRESS,
  TOKEN_ID,
  9999999 // L2 gas
)
await tx.wait()
```

### CASE 2 - Native L1 NFT - Bridge NFTs from Boba to Ethereum

Prior to the exit, the L2 NFT Bridge burns the L2 NFT, so the first step is for the user to approve the transaction.

```js
const approveTx = await L2NFT.approve(L2_NFT_BRIDGE_ADDRESS, TOKEN_ID)
await approveTx.wait()
```

Users have to approve the Boba for the exit fee next. They then call the `withdraw` or `withdrawTo` function to exit the NFT from Boba to Ethereum. The NFT will arrive on L1 after the seven days.

```js
const exitFee = await BOBABillingContract.exitFee()
const approveBOBATx = await L2BOBAToken.approve(
  L2NFTBrige.address,
  exitFee
)
await approveBOBATx.wait()
const tx = await L2NFTBrige.withdraw(
  L2_NFT_CONTRACT_ADDRESS,
  TOKEN_ID,
  9999999 // L2 gas
)
await tx.wait()
```

### CASE 3 - Native L2 NFT - Bridge NFTs from Boba to Ethereum

Users have to transfer their NFTs to the L2 NFT Bridge, so they start by approving the transaction.

```js
const approveTx = await L2NFT.approve(L2_NFT_BRIDGE_ADDRESS, TOKEN_ID)
await approveTx.wait()
```

Users have to approve the Boba for the exit fee next. They then call the `withdraw` or `withdrawTo` function to exit NFT from L2. The NFT will arrive on L1 after the seven days.

```js
const exitFee = await BOBABillingContract.exitFee()
const approveBOBATx = await L2BOBAToken.approve(
  L2NFTBrige.address,
  exitFee
)
await approveBOBATx.wait()
const tx = await L2NFTBrige.withdraw(
  L2_NFT_CONTRACT_ADDRESS,
  TOKEN_ID,
  9999999 // L2 gas
)
await tx.wait()
```

### CASE 4 - Native L2 NFT - Bridge NFTs from Ethereum to Boba

The L1 NFT Bridge has to burn the L1 NFT, so the user needs to approve the transaction first.

```js
const approveTx = await L1NFT.approve(L1_NFT_BRIDGE_ADDRESS, TOKEN_ID)
await approveTx.wait()
```

Users then call the `depositNFT` or `depositNFTTo` function to deposit NFT to L2. The NFT arrives on L2 after eight L1 blocks.

```js
const tx = await L1NFTBrige.depositNFT(
  L1_NFT_CONTRACT_ADDRESS,
  TOKEN_ID,
  9999999 // L2 gas
)
await tx.wait()
```
