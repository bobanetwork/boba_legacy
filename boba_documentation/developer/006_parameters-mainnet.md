---
description: A collection of links to get started on Mainnet Boba
---

# Mainnet Links

## Mainnet Links and Endpoints

|                   |                                                                                  |
| ----------------- | -------------------------------------------------------------------------------- |
| Mainnet RPC Read  | [https://lightning-replica.boba.network](https://lightning-replica.boba.network) |
| Mainnet Write RPC | [https://mainnet.boba.network](https://mainnet.boba.network)                     |
| Mainnet ChainID   | 288                                                                              |
| Gateway           | [https://gateway.boba.network](https://gateway.boba.network)                     |
| Blockexplorer     | [https://blockexplorer.boba.network](https://blockexplorer.boba.network)         |
| Websocket         | [wss://ws.mainnet.boba.network](wss://wss.mainnet.boba.network)                  |

## Mainnet Contract and Token Addresses

The `AddressManger` is located at '0x8376ac6C3f73a25Dd994E0b0669ca7ee0C02F089'. The `AddressManager` can be queried for current addresses like this:

```javascript
  this.AddressManager = new ethers.Contract(
    '0x8376ac6C3f73a25Dd994E0b0669ca7ee0C02F089',
    AddressManagerJson.abi,
    this.L1Provider
  )
  console.log("AddressManager Contract:",this.AddressManager)

  //obtain the current address of the Proxy__L1CrossDomainMessenger
  const address = await this.AddressManager.getAddress('Proxy__L1CrossDomainMessenger')

  /*********** NOTE *****************/
  /* If the contract is not in the AddressManager, then it will return the zero address: */
  /* 0x0000000000000000000000000000000000000000 */
```

For all current addresses, please see [the address registration dump](https://github.com/bobanetwork/boba/blob/develop/packages/boba/register/addresses).