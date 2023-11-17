# What needs to be deployed?
Relevant files are located in `./api`.

## Lambda functions
1. hc_getCAPTCHA.py
2. hc_sendMetaTx.js
3. hc_verifyCAPTCHA.py

### Why do we have mixed languages?
Until now we always had Python lambda functions. When implementing the last function for the `metaTx` I discovered a limitation of the `web3py` library that doesn't allow you to `estimateGas` for signed transactions / account-connected contract objects. This unfortunately makes the Python library incompatible with HybridCompute - for that reason I had to move over that single endpoint to JavaScript.

## Redis
All 3 lambda functions need to have access to this redis instance. The Redis endpoint is configured via environment variables for each lambda function.

# Purpose of the faucet
The faucet itself has 2 main purposes:

1. **Testnet faucet**: To provide testnet funds (native asset & token) for developers to test their applications.

2. **Mainnet faucet**: To provide mainnet funds (only native asset, but support for token available) which helps to onboard new users onto BOBA.

# Purpose of the endpoints
- `hc_getCAPTCHA.py`: Returns an *UUID* and *ImageBase64* string to show a captcha to the user on the frontend (e.g. Gateway).
- `hc_sendMetaTx.js`: Returns a nonce for the user to sign and triggers a smart contract function on behalf of the user when it receives a valid signature.
- `hc_verifyCAPTCHA.py`: Called from the smart contract directly to verify if the captcha values provided are valid.

In short, `getCAPTCHA` and `hc_sendMetaTx` are called from the Gateway or other frontends in future.

While `verifyCAPTCHA` is being called by the Faucet Smart Contract via HybridCompute.

# Return values
All endpoints return errors in the following way:
```json
{
"result": {"error": "arbitrary error"}
}
```

## hc_getCAPTCHA.py
```json
{
"result": {"uuid": "your uuid", "imageBase64": "base64 string img"}
}
```

## hc_sendMetaTx.js
There is one exception for this endpoint returning a message instead of an error when the transaction failed on-chain.

In all other cases the endpoint returns the error property as the other endpoints do.

```json
{"result": {"txHash": "0x00..", "message": "Transaction has failed / Funds issued"}}
```

## hc_verifyCAPTCHA.py
Returns abi encoded payload for HybridCompute. Handled by smart contract (faucet).

# Configuration
Configuration values are set via `.env`variables.
There is a `.env-template` file you can use.

## hc_getCAPTCHA.py
- `REDIS_URL`
- `REDIS_PORT`
- `IS_LOCAL` (optional), in production: `False`

## hc_sendMetaTx.js
- `REDIS_URL`
- `REDIS_PORT`
- `PK_KEY`, private key from where to send trigger meta transactions (does not hold faucet funds)
- `RPC_URL`
- `CONTRACT_FAUCET_ADDR` (optional locally, but mandatory in production -> *security*)
- `IS_LOCAL` (optional), in production: `False`

## hc_verifyCAPTCHA.py
- `REDIS_URL`
- `REDIS_PORT`

# Dependencies
## Python lambda
For the Python lambda functions we've a `requirements.txt` that is usually automatically installed by AWS upon deployment.

## JavaScript lambda
For the JS lambda function the following 3 packages need to be available:
- `ethers`
- `redis`
- `dotenv`

# Deployment
There is a `template.yaml` for the 2 python lambda functions. We may need extend it for the JS endpoint as well as well as security relevant best practices.

## HTTPS/HTTP
To avoid mixed content issues for the Gateway we may need to have at least `hc_getCAPTCHA.py` and `hc_sendMetaTx.js` behind *https*.

`hc_verifyCAPTCHA.py` on the other hand might need to stay on `http` so that it can be called via HybridCompute (never actually tried it out, but I can imagine this being an issue).

## Networks/Chains
Endpoints can all be chain agnostic. This includes Mainnet<>Testnet networks as long as if we are fine with using the same Private-Key for sending transactions for both mainnets & testnets.

Since this PrivateKey only needs funds to send transactions (all mainnet/testnet funds are held by the smart contract) this might be acceptable.

Right now, these only need to be deployed once for all networks:
1. hc_getCAPTCHA.py
2. hc_verifyCAPTCHA.py

This lambda function needs to be deployed for all networks separately, since we don't want users to choose an arbitrary contract:
1. hc_sendMetaTx.js

Thus, please make sure to set the contract address in the `.env` file.

# Other files
- `run-local-server-*`: only used for inter-process-communication (for integration tests), don't need to be uploaded to AWS.

# CI/CD
We may want to consider a simple pipeline to get new versions deployed or at least having a quick writeup on how to apply fixes/updates.

