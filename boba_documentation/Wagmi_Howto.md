# Wagmi Howto

- [Wagmi Howto](#wagmi-howto)
  * [TLDR](#tldr)
  * [Which smart contracts are involved, and what do those contracts do?](#which-smart-contracts-are-involved--and-what-do-those-contracts-do-)
  * [Default options for the LS generator script paramterisation](#default-options-for-the-ls-generator-script-paramterisation)
  * [Wagmi contract addresses](#wagmi-contract-addresses)
  * [Minting new Wagmi Tokens](#minting-new-wagmi-tokens)
    + [Each Wagmi token needs new Oracle](#each-wagmi-token-needs-new-oracle)
    + [Private Key holders; Token Minting procedure](#private-key-holders--token-minting-procedure)
    + [Gateway changes needed](#gateway-changes-needed)

## TLDR

What is Wagmi and how does it work?

## Which smart contracts are involved and what do each of those contracts do?

* The LS generator
* The Long and Short tokens
* Which tokens go to which parties?

## Default options for the LS generator script paramterisation

## Wagmi contract addresses on Rinkeby and Mainnet

## Minting new Wagmi Tokens

### Each Wagmi token needs new Oracle

* Adding new oracles

### Private Key holders; Token Minting procedure

### Gateway changes needed

Adding new Wagmi tokens requires changes in six different areas of the gateway, primarily in `networkServices.js`, `account.js`, `coinImage.js`, and `tokenAction.js`.

First, add the new Wagmi token to `networkServices.js`:

```javascript
/services/networkServices.js

...
  this.supportedTokens = [ 'USDT',  'DAI', 'USDC',  'WBTC',
...
                           'MATIC',  'UMA',  'DOM', 'WAGMIv0'
                          ]
...
  } else if(key === 'WAGMIv0') {
    allTokens[key] = {
      'L1': 'WAGMIv0',
      'L2': '0x1302d39C61F0009e528b2Ff4ba692826Fe99f70c'
    }
  } else {
...
``` 

Then, exclude the WAGMI tokens from **L1 balance lookup** since they do not exist on L1:

```javascript
/services/networkServices.js

...
  if (token.symbolL1 === 'xBOBA' || token.symbolL1 === 'WAGMIv0') {
    //there is no L1 xBOBA or WAGMIv0
    getBalancePromise.push(getERC20Balance(token, token.addressL2, "L2", this.L2Provider))
  }
...
``` 

Next, exclude the WAGMI tokens from the **LP pool lookup**:

```javascript
/services/networkServices.js

...
  let tokenAddressList = Object.keys(allTokens).reduce((acc, cur) => {
    if(cur !== 'xBOBA' && cur !== 'WAGMIv0') {
      acc.push(allTokens[cur].L1.toLowerCase())
    }
...
``` 

Then, add the new WAGMI token to the **token icon system**:

```javascript
/util/coinImage.js

import wagmiv0Logo from 'images/wagmiv0.png';
...
  case "WAGMIv0":
    logo = wagmiv0Logo;
    break;
...
``` 

Next, add the new WAGMI token to the **token lookup**:

```javascript
/actions/tokenAction.js

...
  } else if (_tokenContractAddressL1 === 'wagmiv0') {
    if(tA['WAGMIv0'].L2 !== null) _tokenContractAddressL2 = tA['WAGMIv0'].L2.toLowerCase()
    tokenContract = new ethers.Contract(
      _tokenContractAddressL2, 
      erc20abi,
      networkService.L2Provider,
    )
...
```

Finally, correct the WAGMI token from the **Account View**

```javascript
/components/listAcconut.js

...
  {token.symbol !== 'xBOBA' && token.symbol !== 'WAGMIv0' &&
    <Box sx={{display: "flex", opacity: !enabled ? "0.4" : "1.0", transform: dropDownBox ? "rotate(-180deg)" : ""}}>
      <ExpandMoreIcon sx={{width: "12px"}}/>
    </Box>
  }
...
``` 





