# Optimism Regenesis Deployments
## LAYER 2

### Chain IDs:
- Mainnet: 10
- Kovan: 69
- Goerli: 420
*The contracts relevant for the majority of developers are `OVM_ETH` and the cross-domain messengers. The L2 addresses don't change.*

### Predeploy contracts:
|Contract|Address|
|--|--|
|OVM_L2ToL1MessagePasser|0x4200000000000000000000000000000000000000|
|OVM_DeployerWhitelist|0x4200000000000000000000000000000000000002|
|L2CrossDomainMessenger|0x4200000000000000000000000000000000000007|
|OVM_GasPriceOracle|0x420000000000000000000000000000000000000F|
|L2StandardBridge|0x4200000000000000000000000000000000000010|
|OVM_SequencerFeeVault|0x4200000000000000000000000000000000000011|
|L2StandardTokenFactory|0x4200000000000000000000000000000000000012|
|OVM_L1BlockNumber|0x4200000000000000000000000000000000000013|
|OVM_ETH|0x4200000000000000000000000000000000000006|
|WETH9|0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000|

---
---

## LAYER 1

## RINKEBY

Network : __rinkeby (chain id: 4)__

|Contract|Address|
|--|--|
|BondManager|[0xAF41D3399A91C43E8f2d70d9b47741b10CFA4Fc4](https://rinkeby.etherscan.io/address/0xAF41D3399A91C43E8f2d70d9b47741b10CFA4Fc4)|
|CanonicalTransactionChain|[0xcDaE2AbC113b27b8DbA0823dC58b7807ec0dA778](https://rinkeby.etherscan.io/address/0xcDaE2AbC113b27b8DbA0823dC58b7807ec0dA778)|
|ChainStorageContainer-CTC-batches|[0xE1Dd4872BD19538F76C1927F73c5aAa7850Ea8A2](https://rinkeby.etherscan.io/address/0xE1Dd4872BD19538F76C1927F73c5aAa7850Ea8A2)|
|ChainStorageContainer-CTC-queue|[0x6dAeDc26871f05c30aD84da8902b444c1fbB0862](https://rinkeby.etherscan.io/address/0x6dAeDc26871f05c30aD84da8902b444c1fbB0862)|
|ChainStorageContainer-SCC-batches|[0x5559BeaEe5d3c2f4f3395357f5854B5Ff5cD4737](https://rinkeby.etherscan.io/address/0x5559BeaEe5d3c2f4f3395357f5854B5Ff5cD4737)|
|L1MultiMessageRelayer|[0x5C6263BCAa00C7f5988E148dB3CA178e1262E69f](https://rinkeby.etherscan.io/address/0x5C6263BCAa00C7f5988E148dB3CA178e1262E69f)|
|Lib_AddressManager|[0x93A96D6A5beb1F661cf052722A1424CDDA3e9418](https://rinkeby.etherscan.io/address/0x93A96D6A5beb1F661cf052722A1424CDDA3e9418)|
|Proxy__L1CrossDomainMessenger|[0xF10EEfC14eB5b7885Ea9F7A631a21c7a82cf5D76](https://rinkeby.etherscan.io/address/0xF10EEfC14eB5b7885Ea9F7A631a21c7a82cf5D76)|
|StateCommitmentChain|[0x5799b1cb815EeecB8e3A57Dc0AC7e1Ef8c6Eb496](https://rinkeby.etherscan.io/address/0x5799b1cb815EeecB8e3A57Dc0AC7e1Ef8c6Eb496)|
<!--
Implementation addresses. DO NOT use these addresses directly.
Use their proxied counterparts seen above.

L1CrossDomainMessenger: 
 - 0x04059a546419f54db4bfafFae9d4af3b081C2a8D
 - https://rinkeby.etherscan.io/address/0x04059a546419f54db4bfafFae9d4af3b081C2a8D)
Proxy__L1StandardBridge: 
 - 0xDe085C82536A06b40D20654c2AbA342F2abD7077
 - https://rinkeby.etherscan.io/address/0xDe085C82536A06b40D20654c2AbA342F2abD7077)
-->
---
## MAINNET

Network : __mainnet (chain id: 1)__

|Contract|Address|
|--|--|
|BondManager|[0x60660e6CDEb423cf847dD11De4C473130D65b627](https://etherscan.io/address/0x60660e6CDEb423cf847dD11De4C473130D65b627)|
|CanonicalTransactionChain|[0xfBd2541e316948B259264c02f370eD088E04c3Db](https://etherscan.io/address/0xfBd2541e316948B259264c02f370eD088E04c3Db)|
|ChainStorageContainer-CTC-batches|[0x17148284d2da2f38c96346f1776C1BF7D7691231](https://etherscan.io/address/0x17148284d2da2f38c96346f1776C1BF7D7691231)|
|ChainStorageContainer-CTC-queue|[0x5f003030884B3a105809a0Eb0C0C28Ac40ECCD8d](https://etherscan.io/address/0x5f003030884B3a105809a0Eb0C0C28Ac40ECCD8d)|
|ChainStorageContainer-SCC-batches|[0x13992B9f327faCA11568BE18a8ad3E9747e87d93](https://etherscan.io/address/0x13992B9f327faCA11568BE18a8ad3E9747e87d93)|
|L1MultiMessageRelayer|[0x5fD2CF99586B9D92f56CbaD0A3Ea4DF256A0070B](https://etherscan.io/address/0x5fD2CF99586B9D92f56CbaD0A3Ea4DF256A0070B)|
|Lib_AddressManager|[0x8376ac6C3f73a25Dd994E0b0669ca7ee0C02F089](https://etherscan.io/address/0x8376ac6C3f73a25Dd994E0b0669ca7ee0C02F089)|
|OVM_L1CrossDomainMessenger|[0x12Acf6E3ca96A60fBa0BBFd14D2Fe0EB6ae47820](https://etherscan.io/address/0x12Acf6E3ca96A60fBa0BBFd14D2Fe0EB6ae47820)|
|Proxy__L1CrossDomainMessenger|[0x6D4528d192dB72E282265D6092F4B872f9Dff69e](https://etherscan.io/address/0x6D4528d192dB72E282265D6092F4B872f9Dff69e)|
|Proxy__OVM_L1CrossDomainMessenger|[0x6D4528d192dB72E282265D6092F4B872f9Dff69e](https://etherscan.io/address/0x6D4528d192dB72E282265D6092F4B872f9Dff69e)|
|Proxy__OVM_L1StandardBridge|[0xdc1664458d2f0B6090bEa60A8793A4E66c2F1c00](https://etherscan.io/address/0xdc1664458d2f0B6090bEa60A8793A4E66c2F1c00)|
|StateCommitmentChain|[0xdE7355C971A5B733fe2133753Abd7e5441d441Ec](https://etherscan.io/address/0xdE7355C971A5B733fe2133753Abd7e5441d441Ec)|
<!--
Implementation addresses. DO NOT use these addresses directly.
Use their proxied counterparts seen above.

Proxy__L1StandardBridge: 
 - 0xdc1664458d2f0B6090bEa60A8793A4E66c2F1c00
 - https://etherscan.io/address/0xdc1664458d2f0B6090bEa60A8793A4E66c2F1c00)
-->
---
