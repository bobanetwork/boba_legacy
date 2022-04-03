# @boba/boba-fee

## Guide for Developers

### Setup

Install the following:

- [`Node.js` (14+)](https://nodejs.org/en/)
- [`npm`](https://www.npmjs.com/get-npm)
- [`yarn`](https://classic.yarnpkg.com/en/docs/install/)

Install npm packages and build package in the root directory:

```bash
yarn install
yarn build
```

### Update .env

Add .env in `/boba-examples/boba-fee`

```bash
# Rinkeby
ADDRESS_MANAGER_ADDRESS=0x93A96D6A5beb1F661cf052722A1424CDDA3e9418
L1_NODE_WEB3_URL=https://rinkeby.infura.io/v3/KEY
L2_NODE_WEB3_URL=https://rinkeby.boba.network
PRIV_KEY=
```

### Change fee totkn

Use BOBA as the fee token

```bash
yarn use:boba
```

Use ETH as the fee token

```bash
yarn use:eth
```
