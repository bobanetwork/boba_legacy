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
|BondManager|[0xf3060641267fa5dba812B03E8384Df70ee23dd4E](https://rinkeby.etherscan.io/address/0xf3060641267fa5dba812B03E8384Df70ee23dd4E)|
|CanonicalTransactionChain|[0xe7FB1b3F51F1Eb72A71097a4420226c3b1B828e4](https://rinkeby.etherscan.io/address/0xe7FB1b3F51F1Eb72A71097a4420226c3b1B828e4)|
|ChainStorageContainer-CTC-batches|[0x422E4fDc2fE1F48eD2D3393B1ea4987045e4A7f6](https://rinkeby.etherscan.io/address/0x422E4fDc2fE1F48eD2D3393B1ea4987045e4A7f6)|
|ChainStorageContainer-CTC-queue|[0x38b0aA4357B2234a54b4570443267E76e12B9f42](https://rinkeby.etherscan.io/address/0x38b0aA4357B2234a54b4570443267E76e12B9f42)|
|ChainStorageContainer-SCC-batches|[0x826353c1DFc55B488Bf71496433D65720D4357ea](https://rinkeby.etherscan.io/address/0x826353c1DFc55B488Bf71496433D65720D4357ea)|
|L1MultiMessageRelayer|[0x5C6263BCAa00C7f5988E148dB3CA178e1262E69f](https://rinkeby.etherscan.io/address/0x5C6263BCAa00C7f5988E148dB3CA178e1262E69f)|
|Lib_AddressManager|[0x93A96D6A5beb1F661cf052722A1424CDDA3e9418](https://rinkeby.etherscan.io/address/0x93A96D6A5beb1F661cf052722A1424CDDA3e9418)|
|Proxy__OVM_L1CrossDomainMessenger|[0xF10EEfC14eB5b7885Ea9F7A631a21c7a82cf5D76](https://rinkeby.etherscan.io/address/0xF10EEfC14eB5b7885Ea9F7A631a21c7a82cf5D76)|
|Proxy__OVM_L1StandardBridge|[0xDe085C82536A06b40D20654c2AbA342F2abD7077](https://rinkeby.etherscan.io/address/0xDe085C82536A06b40D20654c2AbA342F2abD7077)|
|StateCommitmentChain|[0x7c16Df59010dee851b22021037b4793245Aa23Ab](https://rinkeby.etherscan.io/address/0x7c16Df59010dee851b22021037b4793245Aa23Ab)|
<!--
Implementation addresses. DO NOT use these addresses directly.
Use their proxied counterparts seen above.

L1CrossDomainMessenger: 
 - 0x04059a546419f54db4bfafFae9d4af3b081C2a8D
 - https://rinkeby.etherscan.io/address/0x04059a546419f54db4bfafFae9d4af3b081C2a8D)
-->
---
