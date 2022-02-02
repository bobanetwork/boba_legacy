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

Wagmi involves approximately 20 smart contracts. Here is a [partial list](https://github.com/UMAprotocol/protocol/blob/master/packages/core/networks/288.json)

WAGMIv0 uses a **Linear** LongShortPair (LSP) Financial Products Library (FPL) with the `lowerBound` set to ________ and `upperBound` set to ________. The **linear LSP FPL** is [documented here](https://github.com/UMAprotocol/protocol/blob/master/packages/core/contracts/financial-templates/common/financial-product-libraries/long-short-pair-libraries/LinearLongShortPairFinancialProductLibrary.sol). Briefly, "_The contract will payout a scaled amount of collateral depending on where the settlement price lands within a price range between an `upperBound` and a `lowerBound`. If the settlement price is within the price range then the expiryPercentLong is defined by (expiryPrice - lowerBound) / (upperBound - lowerBound). This number represents the amount of collateral from the collateralPerPair that will be sent to the long and short side._" For example, if the TVL is halfway between ________ and ________, i.e. ________, then each WAGMIv0 would be worth ________, and so forth.

## Which smart contracts are involved and what do each of those contracts do?

* The `LongShortPairCreator` - This contract creates the `WAGMI LSP contract` through a [script](https://github.com/UMAprotocol/launch-lsp). **Each new WAGMI token requires a new WAGMI LSP contract with new/altered parameters**.

* The `Long` and `Short` tokens - These tokens are via created via `LongShortPair.create`. The `create` function deposits collateral into the contract in exchange for an *equal amount* of long and short tokens based on the collateralPerPair parameter. The collateralPerPair parameter determines the amount of collateral that is required for each pair of long and short tokens. *Note* - the `Long` tokens go to end users. The `Short` tokens are retained so that unclimed collateral (BOBA tokens) that won’t be claimed by the users if the ratio is below 2

## Default options for the LSP generator script paramterisation

???

## Wagmi contract addresses on Rinkeby and Mainnet

* WAGMIv0 LSP contract on Mainnet: **0x1302d39C61F0009e528b2Ff4ba692826Fe99f70c**

## Minting new Wagmi Tokens

End-user WAGMI tokens are of type `ExpandedIERC20`. `ExpandedIERC20` are very similar to normal ERC20s, but have additional mint/burn functions such as `burnFrom`. The tokens are minted via `LongShortPair.create`. Note that the LSP contract is approved for the `depositBobaAmount`.

```js
const depositBobaAmount = ethers.utils.parseEther('10')

const bobaToken = new ethers.Contract(
  BobaTokenAddress,
  BobaTokenABI,
  L2Wallet
)

const approveTx = await bobaToken.approve(
  LongShortPairAddress,
  depositBobaAmount
)
await approveTx.wait()

const LongShortPair = new ethers.Contract(
  LongShortPairAddress,
  LongShortPairABI,
  L2Wallet
)

// collateralPerPair: units of collateral are required to mint one pair of synthetic tokens
const mintTx = await LongShortPair.create(depositBobaAmount.div(collateralPerPair)) 
await mintTx.wait()
```

For WAGMIv0, the `collateralPerPair` was set to 2 so that the maximum payout per KPI option is *2 BOBA* if the Boba network TVL exceeds `UpperTVLBound`. The WAGMIv0 settings are:

```
Metric:Boba network TVL,
Method:"https://github.com/UMAprotocol/UMIPs/blob/master/Implementations/boba-wagmi-tvl.md",
Aggregation:TWAP TVL for the provided time range,
StartTWAP:1646092800,
EndTWAP:1648771200,
TVLDenomination:USD,
LowerTVLBound:______,
UpperTVLBound:______,
MinimumPayout:1,
Rounding:6
```

This means that the `UpperTVLBound` was set to ______.

### Each Wagmi token needs new Oracle that provides the goal-specific data 

* WAGMIv0 oracle

The WAGMIv0 oracle is [documented here](https://github.com/UMAprotocol/UMIPs/blob/master/Implementations/boba-wagmi-tvl.md). Briefly, the oracle estimates TVL bridged from L1 to Boba network through the L1 standard bridge contract. It is based on similar calculation logic that is used to estimate Boba network TVL on the Dune Analytics Boba Bridge USD TVL display. 

* Adding new oracles

[Method doc - Boba TVL](https://github.com/UMAprotocol/UMIPs/blob/master/Implementations/boba-wagmi-tvl.md) (that is referenced in LSP contract ancillary data) has link to example script: https://github.com/Reinis-FRP/boba-tvl

### Claims Interface

For the claims interface, the relevant smart contracts are: 

The [LSP contract](https://blockexplorer.boba.network/address/0x5E9d23daa1b27754bd9BEc66B9E87FA0ce0470Ec/transactions)

The [WAGMIv0 option](https://blockexplorer.boba.network/tokens/0x1302d39C61F0009e528b2Ff4ba692826Fe99f70c/token-transfers)

Post minting, the only interaction with the LSP that we need to support is allowing users to call settle to exchange their wagmi options for the underlying boba once the options expire: https://docs.umaproject.org/contracts/financial-templates/long-short-pair/LongShortPair#parameters-2

### Gateway changes needed

Adding new Wagmi tokens requires changes in six different areas of the gateway, primarily in `networkServices.js`, `account.js`, `coinImage.js`, and `tokenAction.js`. First, add the new Wagmi token to `networkServices.js`:

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
