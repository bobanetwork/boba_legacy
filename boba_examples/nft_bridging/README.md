# NFT-Bridge Example

This example will walk you through the process of bridging any L2 native ERC721 to L1 (Ethereum) (and also bridging them back to L2)

If you are a NFT marketplace, willing to support the bridge feature - please refer to the simpler section - [Supporting the 'Bridge to L1'](BridgeToL1Support.md)

Please note - this example is towards bridging in/out a Layer-2 native ERC721 (meaning a NFT originally deployed to L2 Boba). However, the bridge can support the same features with Layer-1 NFTs as well, for which please refer to the [more elaborate documentation - here](https://github.com/omgnetwork/optimism-v2/blob/develop/packages/boba/contracts/contracts/bridges/README.md)

## Quickstart - Rinkeby
If you don't have much time and are looking to quickly run through the example, just keep looking at this section. However, If you want a more enhanced understanding, which is encouraged, skip forward to the [next section](#getting-started-with-the-example)

Alright, if you are still here, we don't have much time, so we will try running through the example on Boba-Rinkeby

- Step 1: set up your env according to the .env.example
you would need a rinkeby infura endpoint, and an account with some Rinkeby Eth (> 0.01 ETH)

- Step 2: You are all set!
Since, we are on Boba Rinkeby we will use the Boba NFT Bridges on Rinkeby, but in order to use your own ERC721s with the bridge, the Boba Team would need to register your contracts on the bridges
So, for the sake of this tutorial, we have set you up with a pre-deployed contract that is registered on the bridge!

To quickly run the example, do a:

```bash
$ yarn
$ yarn compile
$ yarn start:rinkeby
```
When the script has finished running, you would have minted -> and initiated a NFT withdraw to L1!
Your bridged NFT will arrive on L1 after the fraud-proof-window

## Getting-Started with the Example

### Setup
For the tutorial, we would need a local Boba stack running
Get the services running with-

```bash
$ git clone https://github.com/omgnetwork/optimism-v2.git
$ yarn
$ yarn build
```
and then..

```bash
$ cd ops
$ docker-compose build && docker-compose up -V
```

**For local, use the same .env as .env.example**
this includes the priv_key of the account which can register the ERC721 on the NFTBridges

## Running through the Example
Once the local Boba stack is running, switch to:

```bash
$ cd ../boba_examples/nft_bridging/
```

To quickly run the example, run:

```bash
$ yarn
$ yarn compile
$ yarn start
```

Instead, to keep following through the tutorial keep reading..

### Deploying your NFT contract
The first step is to deploy your ERC721 contract on Boba! There is no limitation as to what you can deploy as long as it is ERC721 compliant.
For this example, we have preset a sample ERC721 contract for you to use here `/contracts/SampleERC721.sol` - feel free to select your own ERC721 that you fancy.
(For super-special ERC721s which might not be cost-effective to transport with the complete metadata - we offer some gas effective solutions with the bridges. Do not worry about this now - follow this section for reference later)

Once, you have settled on the contract to use,
compile the contract using -
```bash
yarn compile
```

and, then run the example script using -
```bash
yarn start
```

The script starts with deploying your ERC721 on Boba, and then mints some tokens to your address
```
Deployed the NFT contract at: 0x....
And, Minted some NFTs to address
```

So, nothing out of the ordinary up until this point, but now we will actually get into making the NFTs of this contract bridgeable to L1

## Making the NFTs bridgeable to L1
Now, with your ERC721 deployed on Boba, we want to make all the NFTs of this contract bridge-able to L1(Ethereum). To enforce this - we only need to deploy a representation contract on L1 which can accept messages from the NFT Bridges and generate a L1 representation for your L2 NFT.

Simply put, any arbitrary ERC721 contract deployed on Boba needs a single and potentially unmodified deployment of L1StandardERC721 on Ethereum to make it bridgeable!
(the bridge also allows to transport custom data if your ERC721 demands it, in which case you would have to accordingly handle it on the L1StandardERC721. Since this is a common ERC721 we do not need to worry about this - refer to this section for reference later )

#### Deploying a standard L1ERC721 representation
Following the script - you should see your L1 represntation contract being deployed
```
Deployed the L1 NFT Representaton contract at: 0x....
```

Additionally, to enable the L1 representation NFTs to represent the metadat correctly, set the baseURI on the L1StandardERC721 to the baseURI of your L2 ERC721 contract (optional)

#### Registering pair on NFT Bridges
Finally, to enable your contracts to be used on the NFT Bridge contracts - register the L1ERC721/L2ERC721 pair on both the L1/L2NFTBridge contracts. For the sake of this tutorial - you should be able to complete this step on the local stack (with the priv key on env.example)
However, *doing this on prod environments - would need help from the operators of the NFT Briges*
Please Reach out to the team in order to register your ERC721 pair on the official Boba NFT Bridges on Mainnet/Rinkeby

```
And registered the L2ERC721 and L1ERC721 to the NFTBridges!
```

And thats it! Your NFTs are now bridgeable to L1 and back

## Bridge an NFT to L1
If you are a marketplace looking to support NFT bridging - great Idea! its simple, [just follow here](BridgeToL1Support.md) - for a more elaborate instruction

To try this we will attempt to bridge the token#1 to L1

First, we will approve the L2NFTBridge for the token we want to bridge to L1
Second, we will call withdraw() on the L2NFTBridge to initiate a withdrawal

After the xDomain message is finalized you will have your NFT bridged to L1

```
Attempting to Bridge NFT#1 to L1
Approved Bridge
Sending tx to withdraw NFT to L1..
Waiting for withdrawal to be relayed to L1...
#################################
Your address:  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
L1NFT owner:  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
NFT bridged to L1 successfully!
#################################
```
Boom, done! Your NFT is now on L1 and you are free to keep, transfer, list, sell, auction your bridged NFT or even bridge it back to L2

## Bridge NFT back to L2
Now, in order to bring your NFT back to Boba, the (current) L1 owner of the NFT will be able to bridge it back to their respective address on L2 by calling depositNFT() on L1NFTBridge

```
Attempting to bridge NFT#1 back to L2
Sending tx to deposit NFT back to L2..
Waiting for deposit to be relayed to L2...
#################################
Your address:  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
L2NFT owner:  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
NFT bridged back to L2 successfully!
#################################
```

Thanks for making it to the end of the tutorial! And, as promised - to clear the air about what super-special NFTs mean in terms of the bridge and how your bridging can be gas effective for them
## More advanced options for special NFTs

Attempting to categorize ERC721s on the basis of metadata, we have:
1. ERC721 with derivable metaData (more common)

The general ERC721(like the one in the example) has the tokenURI in the form = 'baseURI' + 'tokenId'
or is completely derivable on-chain from the tokenId

In this case, you don't really need to worry about transporting metadata between layers and hence you are already at best.

2. ERC721 with no metadata (non- ERC721Metadata)

Some ERC721 do not have metadata associated, in which case you surely do not need to worry about transporting metadata

3. ERC721 with non-derivable metaData (unrecoverable context)

These are the "special NFTs" that require some form of transportation of metadata between layers

The NFT Bridge provides with a special method 'withdrawWithExtraData' in comparision to 'withdraw' for the usual bridging to allow transporting the metadata when bridging the NFT to the other layer

*What metadata is actually bridged?*
When you chose to withdraw through the aforementioned method - the 'tokenURI()' data will be encoded and passed on to the L1StandardERC721 for it to receive and handle it

##### Optimisations
bridging the tokenURI data as a whole might not be ecnomical always and depends on the size of the tokenURI. For example, bridging the tokenURI data for on-chain NFTs will be very costly

The NFTBridge, asks for a special method for this - 'bridgeExtraData', if this method is implemented on your native ERC721 contracts and returns some data that you would need to bridge to the other layer, the bridge will prioritize this over 'tokenURI' potentially allowing to bridge seed data for generation on the L1 side

##### Making your ERC721 bridge extra Data
To enable the bridge to pickup the exposed extra data that you would want to bridge
1. expose the method 'bridgeExtraData()' on your contract. This can encode one/many unique seed data to be transported over to the other layer while bridging
for example, an on-chain contract that requires three unique integers to be transported for each tokenId can expose the data in a way similar to:
```
    function bridgeExtraData(uint256 tokenId) public view returns(bytes memory) {
        return abi.encode(data_1[tokenId], data_2[tokenId], data_3[tokenId]);
    }
}
```
2. Modify ERC165 supportsInterface to return the bridgeExtraData(uint256) selector

for example,
```
    function supportsInterface(bytes4 _interfaceId) public view virtual override returns (bool) {
        return _interfaceId == this.bridgeExtraData.selector || super.supportsInterface(_interfaceId);
    }
```

##### Tl;dr
To sum up,
calling `withdrawWithExtraData` to bridge an NFT to L1, would mean, on this order of priority:
1. check if the contract exposes Extra Data by implementing a `bridgeExtraData()` method, if it does transport the return of this method as data
2. If it doesn't, transport the return value of `tokenURI()`

If you want your NFTs to transport the return value of its `tokenURI()` along with each token while bridging, your contract does not need to implement any extra method!
If you want your NFTs to transport other generative(shorter) data along with each token instead, implement the `bridgeExtraData(uint256 tokenId)` and expose the extraData for each token

