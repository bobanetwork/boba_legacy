# @boba/init-fund-l2

## Guide for Developers

### Setup

Install the following:

- [`Node.js` (14+)](https://nodejs.org/en/)
- [`npm`](https://www.npmjs.com/get-npm)
- [`yarn`](https://classic.yarnpkg.com/en/docs/install/)

Install npm packages and build package in the root directory:

```
cd optimism-v2
yarn install
yarn build
```

### Update .env

Add .env in `/boba-examples/init-fund-l2`

```bash
L1_NODE_WEB3_URL=https://rinkeby.infura.io/v3/INFURA_KEY
L2_NODE_WEB3_URL=https://rinkeby-v2.boba.network
ADDRESS_MANAGER_ADDRESS=0xE8cbD28a5cc96ca86513ad8847D344EE634D0A9D
PRIVATE_KEY=
```

### Move ETH from L1 to L2

Adjust the amount that you want to deposit from L1 to L2 in `/boba-examples/init-fund-l2/src/index.js`

```bash
cd boba-examples/init-fund-l2
yarn install
yarn start
```

