# NFT Bridge

## Boba NFT Bridges

[![Boba NFT Bridge](https://user-images.githubusercontent.com/46272347/145503571-0b5e34c9-c55e-4ff8-8749-19a130d32958.png)](https://user-images.githubusercontent.com/46272347/145503571-0b5e34c9-c55e-4ff8-8749-19a130d32958.png)

Boba NFT bridges support **native L1 NFT** as well as **native L2 NFT**. Users can transfer their NFTs between L1 and L2.

> **Native L1 NFT**: the original NFT contract was deployed on L1
>
> **Native L2 NFT**: the original NFT contract was deployed on L2

{% hint style="info" %}
NFT Bridging on Boba Network in a nutshell\
\
\- Native L1 & L2 NFTs are supported to be bridged between L1<>L2\
\- In order to move an L1 NFT to L2, the L1 creator needs to deploy a corresponding contract on L2\
\- In order to move an L2 NFT to L1, the L2 creator needs to deploy a corresponding contract on L1\
\- Moving NFTs from L1 to L2 is near instant and burns the NFT on L1\
\- Moving NFTs from L2 to L1 takes 7 days due to the optimistic rollup challenge period \

{% endhint %}

### Native L1 NFT

#### Requirements

In order for a native L1 NFT to be moved to the Boba Network, the L1 NFT creator needs to  deploy [L2StandardERC721](https://github.com/omgnetwork/optimism-v2/tree/develop/packages/boba/contracts/contracts/standards) smart contract on the Boba Network.

```
const Factory__L2StandardERC721 = new ethers.ContractFactory(
  L2StandardERC721.abi,
  L2StandardERC721.bytecode,
  L2Wallet
)
const L2StandardERC721 = await Factory__L2StandardERC721.deploy(
  L2_NFT_BRIDGE_ADDRESS, // L2 NFT Bridge Address
  L1_NFT_CONTRACT_ADDRESS, // Your L1 NFT Address
  NFT_NAME, 
  NFT_SYMBOL
)
await L2StandardERC721.deployTransaction.wait()
```

> NOTE:
>
> Once you get the **L2StandardERC721** address, please contact us. We will register your NFT contracts in L1 and L2 NFT bridges, so there is only one corresponding L2 NFT contract.

#### How to bridge and exit NFTs

**Deposit NFT to Boba Network**

The users have to transfer their NFT to L1 NFT Bridge, so they should approve the transaction first.

```
const approveTx = await L1NFT.approve(L1_NFT_BRIDGE_ADDRESS, TOKEN_ID)
await approveTx.wait()
```

Users call the `depositNFT` or `depositNFTTo` function to deposit NFT to L2. The NFT arrives on L2 after eight L1 blocks.

```
const tx = await L1NFTBrige.depositNFT(
  L1_NFT_CONTRACT_ADDRESS,
  TOKEN_ID,
  9999999, // L2 gas
  ethers.utils.formatBytes32String(new Date().getTime().toString())
)
await tx.wait()
```

**Exit NFT from Boba Network**

The L2 NFT Bridge has to burn the L2 NFT, so they should approve the transaction first.

```
const approveTx = await L2NFT.approve(L2_NFT_BRIDGE_ADDRESS, TOKEN_ID)
await approveTx.wait()
```

Users call the `withdraw` or `withdrawTo` function to exit NFT from L2. The NFT arrives on L1 after the seven days.

```
const tx = await L2NFTBrige.withdraw(
  L2_NFT_CONTRACT_ADDRESS,
  TOKEN_ID,
  9999999, // L2 gas
  ethers.utils.formatBytes32String(new Date().getTime().toString())
)
await tx.wait()
```

### Native L2 NFT

The L2 NFT creator should deploy [L1StandardERC721](https://github.com/omgnetwork/optimism-v2/tree/develop/packages/boba/contracts/contracts/standards) on Ethereum

```
const Factory__L2StandardERC721 = new ethers.ContractFactory(
  L1StandardERC721.abi,
  L1StandardERC721.bytecode,
  L1Wallet
)
const L1StandardERC721 = await Factory__L1StandardERC721.deploy(
  L1_NFT_BRIDGE_ADDRESS, // L1 NFT Bridge Address
  L2_NFT_CONTRACT_ADDRESS, // Your L2 NFT Address
  NFT_NAME, 
  NFT_SYMBOL
)
await L2StandardERC721.deployTransaction.wait()
```

> NOTE:
>
> Once you get the **L1StandardERC721** address, please contact us. We will register your NFT contracts in L1 and L2 NFT bridges, so there is only one corresponding L1 NFT contract.

#### How to bridge and exit NFTs

**Exit NFT from Boba Network**

Users have to transfer their NFTs to the L2 NFT Bridge, so they should approve the transaction first.

```
const approveTx = await L2NFT.approve(L2_NFT_BRIDGE_ADDRESS, TOKEN_ID)
await approveTx.wait()
```

Users call the `withdraw` or `withdrawTo` function to exit NFT from L2. The NFT arrives on L1 after the seven day exit window.

```
const tx = await L2NFTBrige.withdraw(
  L2_NFT_CONTRACT_ADDRESS,
  TOKEN_ID,
  9999999, // L2 gas
  ethers.utils.formatBytes32String(new Date().getTime().toString())
)
await tx.wait()
```

**Deposit NFT to Boba Network**

The L1 NFT Bridge has to burn the L1 NFT, so they should approve the transaction first.

```
const approveTx = await L1NFT.approve(L1_NFT_BRIDGE_ADDRESS, TOKEN_ID)
await approveTx.wait()
```

Users call the `depositNFT` or `depositNFTTo` function to deposit NFT to L2. The NFT arrives on L2 after eight L1 blocks.

```
const tx = await L1NFTBrige.depositNFT(
  L1_NFT_CONTRACT_ADDRESS,
  TOKEN_ID,
  9999999, // L2 gas
  ethers.utils.formatBytes32String(new Date().getTime().toString())
)
await tx.wait()
```

### Links

#### Mainnet

| Contract Name        | Contract Address                           |
| -------------------- | ------------------------------------------ |
| Proxy\_\_L1NFTBridge | 0xC891F466e53f40603250837282eAE4e22aD5b088 |
| Proxy\_\_L2NFTBridge | 0xFB823b65D0Dc219fdC0d759172D1E098dA32f9eb |

#### Rinkeby

| Contract Name        | Contract Address                                    |
| -------------------- | --------------------------------------------------- |
| Proxy\_\_L1NFTBridge | 0x01F5d5D0x01F5d5D6de3a8c7A157B22FD331A1F177b7bE043 |
| Proxy\_\_L2NFTBridge | 0x5E368E9dce71B624D7DdB155f360E7A4969eB7aA          |
