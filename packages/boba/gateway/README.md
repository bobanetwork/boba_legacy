# Boba Multi-chain Gateway

## How to add new chains

The new chain information should be added to the following files:

- `src/services/networkService.js`
  - Import `address_XXX` from `packages/boba/register/address/addressXXX_XXX.json`
  - Create a new icon for the new chain in the `src/compoenents/icons` folder and import it in `networkService.js`
  - Preload `allAddresses` , add the new chain to `supportedMultiChains` and add the l1 chain name, icon and supported tokens in the `L1ChainAssets` variable

* `src/util/masterConfig.js`
  * Add new network configurations 