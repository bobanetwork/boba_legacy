# @boba/boba-straw

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

Add .env in `/boba-examples/boba-straw`

```bash
# Goerli
ADDRESS_MANAGER_ADDRESS=0x6FF9c8FF8F0B6a0763a3030540c21aFC721A9148
L1_NODE_WEB3_URL=https://goerli.infura.io/v3/KEY
L2_NODE_WEB3_URL=https://goerli.boba.network
PRIV_KEY=
```

### Provide data

Adjust the ETH, BOBA, OMG or WBTC prices that you want to provide on Goerli

```bash
yarn install
yarn submit
```

To submit prices for selective tokens
```bash
yarn install
yarn submit eth boba omg
```

