---
description: A collection of links to get started on Rinkeby Boba
---

# Rinkeby Links

## Rinkeby Links and Endpoints

|                 |                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------- |
| Rinkeby RPC     | [https://rinkeby.boba.network](https://rinkeby.boba.network)                             |
| Rinkeby ChainID | 28                                                                                       |
| Gateway         | [https://gateway.rinkeby.boba.network](https://gateway.rinkeby.boba.network)             |
| Blockexplorer   | [https://blockexplorer.rinkeby.boba.network](https://blockexplorer.rinkeby.boba.network) |
| Websocket       | [wss://wss.rinkeby-v2.boba.network](wss://wss.rinkeby-v2.boba.network)                   |

## Rinkeby Contract Addresses

The `AddressManger` is located at '0x93A96D6A5beb1F661cf052722A1424CDDA3e9418'. The `AddressManager` can be queried for current addresses like this:

```javascript
  this.AddressManager = new ethers.Contract(
    '0x93A96D6A5beb1F661cf052722A1424CDDA3e9418',
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