# BOBA Faucet Smart Contracts

## Deployment

Create a `.env` file in the root directory of the contracts folder. Add environment-specific variables on new lines in the form of `NAME=VALUE`. Examples are given in the `.env.example` file. Just pick which net you want to work on and copy either the "Rinkeby" _or_ the "Local" envs to your `.env`.

```bash

NETWORK=rinkeby
L1_NODE_WEB3_URL=https://rinkeby.infura.io/v3/9844f35ff4a84003a7025a65a9412002
L2_NODE_WEB3_URL=https://rinkeby.boba.network
ADDRESS_MANAGER_ADDRESS=0x93A96D6A5beb1F661cf052722A1424CDDA3e9418
DEPLOYER_PRIVATE_KEY=


```

Build and deploy all the needed contracts:

```bash

$ yarn build
$ yarn deploy

```
