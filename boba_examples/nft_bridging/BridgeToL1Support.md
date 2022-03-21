# Guide to support NFT Bridging

If you are a marketplace looking to support NFT bridging - great Idea! its simple, just keep reading-

## Requirements and Support

Note: Not all native ERC721s on Boba will be bridgeable to L1 by default

To enable the withdraw option, simply -
- determine if the ERC721 contract is registered on the `L2NFTBridge` and has a counterpart L1StandardERC721 registered
- determine if the ERC721 contract registered on the `L2NFTBridge` is as a base Network "L2"

To withdraw to L1-
- Allow the owner to approve the L2NFTBridge for the token
- call withdraw() on L2NFTBridge with the params - ERC721Address and tokenId

For exact representation of the following please refer to - `src/bridgeToL1.js`