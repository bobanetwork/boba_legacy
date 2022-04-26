
## Sending ETH to L2 using the StandardBridge

We've created a simple example for you that moves ETH to the L2 - see `./boba-examples/init-fund-l2/`.

### Update .env

First, add a `.env` to `/boba-examples/init-fund-l2`. You will need to provide your private key. 

```bash
L1_NODE_WEB3_URL=https://rinkeby.infura.io/v3/INFURA_KEY
L2_NODE_WEB3_URL=https://rinkeby.boba.network
ADDRESS_MANAGER_ADDRESS=0x93A96D6A5beb1F661cf052722A1424CDDA3e9418
PRIVATE_KEY=
```

### Move ETH from L1 to L2

Next, adjust the amount that you want to deposit from L1 to L2 in `./boba-examples/init-fund-l2/src/index.js`:

```javascript
const TRANSFER_AMOUNT = ethers.utils.parseEther('0.0001')
```

Finally, run:

```bash
yarn install
yarn start
```