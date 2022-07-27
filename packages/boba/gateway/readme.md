# Boba Multi-chain Gateway

## How to add new chains

The new chain information should be added to the following files:

- `src/services/networkService.js`
  - Import `address_XXX` from `packages/boba/register/address/addressXXX_XXX.json`
  - Create a new icon for the new chain in the `src/compoenents/icons` folder and import it in `networkService.js`
  - Preload `allAddresses` , add the new chain to `supportedMultiChains` and add the l1 chain name, icon and supported tokens in the `L1ChainAssets` variable

* `src/util/masterConfig.js`
  * Add new network configurations


## Environment variables listed to below to get the app running

| Environment Vars             | Required | Default Valu | Description                                                     |
| ---------------------------- | -------- | ------------ | --------------------------------------------------------------- |
| REACT_APP_INFURA_ID          | Yes      | ''           | API key for infura account                                      |
| REACT_APP_ETHERSCAN_API      | Yes      | ''           | API key for etherscan acount.                                   |
| REACT_APP_POLL_INTERVAL      | Yes      | 20000        | Interval to poll the fetch api about the records                |
| SKIP_PREFLIGHT_CHECK         | N/A      | N/A          | N/A                                                             |
| REACT_APP_WALLET_VERSION     | Yes      | N/A          | This will be useful while prepare the build.                    |
| REACT_APP_ENV                | Yes      | dev          | This will be used in case of sentry configuration.              |
| REACT_APP_CHAIN              | Yes      | mainnet      | Chain where we want to connect the app to like rinkeby, mainnet |
| REACT_APP_STATUS             | NO       | N/A          | To notify the status about any maintainance activity going on.  |
| REACT_APP_SPEED_CHECK        |          |              |                                                                 |
| REACT_APP_AIRDROP            |          |              |                                                                 |
| REACT_APP_GA4_MEASUREMENT_ID | Yes      | N/A          | Google analytics api key                                        |
| REACT_APP_SENTRY_DSN         | Yes      | N/A          | Sentry DSN url to catch the error on frontend                   |
| REACT_APP_ENABLE_LOCK_PAGE   | No       | N/A          | to enable the lock page on gateway menu                         |
