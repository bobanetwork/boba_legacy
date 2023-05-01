---
description: Learn more about the Bundler API for Account Abstraction on Boba Network
---

# Bundler API
This section lists the Ethereum JSON-RPC API endpoints for a basic EIP-4337 "bundler".


- `eth_sendUserOperation`
- `eth_supportedEntryPoints`
- `eth_chainId`
- `eth_estimateUserOperationGas` (currently not supported)


## eth_sendUserOperation
Get your userOperations on-chain.

### Parameters
1. `UserOperation`, a full user operation struct.
2. `EntryPoint`, address the request should be sent through.

### Return value
Returns `userOpHash` if the UserOperation is valid.

Otherwise it returns an error object with `code` and `message`.

| **Code** | **Message**                                                                                                                         |
|----------|-------------------------------------------------------------------------------------------------------------------------------------|
| -32602   | Invalid UserOperation struct/fields                                                                                                 |
| -32500   | Transaction rejected by entryPoint's simulateValidation, during wallet creation or validation                                       |
| -32501   | Transaction rejected by paymaster's validatePaymasterUserOp                                                                         |
| -32502   | Transaction rejected because of opcode validation                                                                                   |
| -32503   | UserOperation out of time-range: either wallet or paymaster returned a time-range, and it is already expired (or will expire soon)  |
| -32504   | Transaction rejected because paymaster (or signature aggregator) is throttled/banned                                                |
| -32505   | Transaction rejected because paymaster (or signature aggregator) stake or unstake-delay is too low                                  |
| -32506   | Transaction rejected because wallet specified unsupported signature aggregator                                                      |
| -32507   | Transaction rejected because of wallet signature check failed (or paymaster siganture, if the paymaster uses its data as signature) |


### Usage
Example request

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_sendUserOperation",
  "params": [
    {
      sender, // address
      nonce, // uint256
      initCode, // bytes
      callData, // bytes
      callGasLimit, // uint256
      verificationGasLimit, // uint256
      preVerificationGas, // uint256
      maxFeePerGas, // uint256
      maxPriorityFeePerGas, // uint256
      paymasterAndData, // bytes
      signature // bytes
    },
    entryPoint // address
  ]
}
```

Example response:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x1234...5678"
}
```

Example failure response:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "message": "paymaster stake too low",
    "data": {
      "paymaster": "0x123456789012345678901234567890123456790",
      "minimumStake": "0xde0b6b3a7640000",
      "minimumUnstakeDelay": "0x15180"
    },
    "code": -32504
  }
}
```

## eth_supportedEntryPoints
Returns an array of the entryPoint addresses supported by the client.

Request:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_supportedEntryPoints",
  "params": []
}
```

Response:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    "0xcd01C8aa8995A59eB7B2627E69b40e0524B5ecf8",
    "0x7A0A0d159218E6a2f407B99173A2b12A6DDfC2a6"
  ]
}
```


## eth_chainId
Returns EIP-155 Chain ID.

Request:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_chainId",
  "params": []
}
```

Response:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x1"
}
```
