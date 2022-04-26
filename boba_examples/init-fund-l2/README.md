
## Sending funds to L2 using the StandardBridge

We've creaed a simple example fro you that moves funds to the L2 - see `/boba-examples/init-fund-l2/`.

### Update .env

Add .env in `/boba-examples/init-fund-l2`

```bash
L1_NODE_WEB3_URL=https://rinkeby.infura.io/v3/INFURA_KEY
L2_NODE_WEB3_URL=https://rinkeby.boba.network
ADDRESS_MANAGER_ADDRESS=0x93A96D6A5beb1F661cf052722A1424CDDA3e9418
PRIVATE_KEY=
```

### Move ETH from L1 to L2

Adjust the amount that you want to deposit from L1 to L2 in `/boba-examples/init-fund-l2/src/index.js`. Then, run:

```bash
yarn install
yarn start
```

