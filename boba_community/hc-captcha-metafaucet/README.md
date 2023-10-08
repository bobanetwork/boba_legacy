# Boba Mainnet Faucet
Using ImageCaptcha

## Successful User flow

```mermaid
sequenceDiagram
    User->>+getCAPTCHA: {to: 0x00..}
    User->>+sendMetaTx: {to: 0x00..}
    sendMetaTx->>+User: {nonce: abc}
    User->>+sendMetaTx: {to: 0x00.., sig: 0x00.., uuid: 123, key: abc}
    sendMetaTx->>+FaucetContract: trigger getFaucet()
    FaucetContract->>+verifyCAPTCHA: Receives Captcha values
    verifyCAPTCHA->>+FaucetContract: Return Captcha result (0|1)
    FaucetContract->>+User: Issue funds or revert
```

### Foundry commands
Use `--no-commit --no-git` for all commands.

### Deployment
- Ensure `IS_LOCAL` is set to False, otherwise the `getCAPTCHA` endpoint will return the already solved captcha!

#### MetaTxApi
The MetaTxAPI has been rewritten to JavaScript since the Python-Web3 library doesn't have an implementation for estimating gas for signed transactions which makes it unusable to send HybridCompute transactions.

