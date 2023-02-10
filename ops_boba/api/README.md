# BOBA API

This folder contains all Boba APIs for the production

## Meta Transaction API

#### - `send.getTestnetETH`

​	This API is used to request testnet ETH for developers

#### - `send.swapBOBAForETH`

  This API is used to swap BOBA for a small amount of ETH paying a zero gas fee

## Token API

#### - `get.supply`

  This API returns the total supply of BOBA Token

#### - `get.circulatingSupply`

  This API returns the circulating supply of BOBA Token

## Watcher API

#### - `get.l2.transactions`

  This API returns the transaction history given the account address

#### - `get.l2.deployments`

  This API returns the contract addresses deployed by the given account address

#### - `get.l2.crossdomainmessage`

  This API returns the cross domain message information from L2 to L1 given the transaction hash

#### - `get.l1.transactions`

   This API returns the cross domain message information from L1 to L2 given the address

#### - `send.crossdomainmessage`

  This API is used to record the exit time for the cross domain transaction from L2 to L1

#### - `get.l1.airdrop`

  This API is used to get the airdrop information for those users who had OMG token on L1

#### - `get.l2.airdrop`

  This API is used to get the airdrop information for those users who had bridged OMG token from L1 to L2

#### - `send.l1.airdrop`

  This API is used to update the status of the L1 airdrop that users have claimed the token

#### - `send.l2.airdrop`

  This API is used to update the status of the L2 airdrop that users have claimed the token

#### - `initiate.l1.airdrop`

  This API is used to update the status of the L1 airdrop when users click the claim button and have to wait for 30 days

#### - ` get.l2.pendingexits`

  This API returns all pending exits
