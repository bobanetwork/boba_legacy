# WAGMI Howto

- [WAGMI Howto](#wagmi-howto)
  * [TLDR](#tldr)
  * [Math](#math)
  * [Which smart contracts are involved and what do each of those contracts do?](#which-smart-contracts-are-involved-and-what-do-each-of-those-contracts-do-)
  * [System deployment and Minting new WAGMI Tokens](#system-deployment-and-minting-new-wagmi-tokens)
  * [Each WAGMI token needs new Oracle that provides the goal-specific data](#each-wagmi-token-needs-new-oracle-that-provides-the-goal-specific-data)
  * [Claims Interface](#claims-interface)
  * [Gateway changes needed](#gateway-changes-needed)

## TLDR

The WAGMI incentives program is Boba Network's take on liquidity mining 2.0. In collaboration with UMA protocol, we are be distributing WAGMI options on BOBA token to promising projects building on Boba. Users can earn WAGMI options using their favorite dApps on Boba Network. WAGMI options are KPI (key performance indicators) options redeemable for BOBA tokens based on metrics relating to Boba Network, such as monthly active wallets or project specific TVL. 

WAGMI works by using UMA protocol's [optimistic oracle](https://umaproject.org/optimistic-oracle.html). BOBA tokens are locked up in a smart contract that pays out subject to network KPIs (i.e. TVL of Boba) and secured in WAGMIvX tokens. BOBA is paid out after a 1 month settlement period on KPIs.

For more information, check out our [WAGMI webpage](https://boba.network/developers/wagmi/) or [tweet thread](https://twitter.com/bobanetwork/status/1478218201494294528).

## Math

WAGMIv0 uses a **Linear** LongShortPair (LSP) Financial Products Library (FPL) setting with the `lowerBound` set to ________ and `upperBound` set to ________. The **linear LSP FPL** is [documented here](https://github.com/UMAprotocol/protocol/blob/master/packages/core/contracts/financial-templates/common/financial-product-libraries/long-short-pair-libraries/LinearLongShortPairFinancialProductLibrary.sol). Briefly, "_The contract will payout a scaled amount of collateral depending on where the settlement price lands within a price range between an `upperBound` and a `lowerBound`. If the settlement price is within the price range then the expiryPercentLong is defined by (expiryPrice - lowerBound) / (upperBound - lowerBound). This number represents the amount of collateral from the collateralPerPair that will be sent to the long and short side._" For example, if the TVL is halfway between ________ and ________, i.e. ________, then each WAGMIv0 would be worth ________, and so forth.

## Which smart contracts are involved and what do each of those contracts do?

All Mainnet Boba contracts that UMA has deployed can be found [here](https://github.com/UMAprotocol/protocol/blob/master/packages/core/networks/288.json)

* **LSP contract** The UMA LSP contract is deployed on Boba Network at [0x5E9d23daa1b27754bd9BEc66B9E87FA0ce0470Ec](https://blockexplorer.boba.network/address/0x5E9d23daa1b27754bd9BEc66B9E87FA0ce0470Ec/transactions). This contract locks 2 BOBA per option on minting. UMA's in-depth documentation on minting KPI options can be found [here](https://docs.umaproject.org/kpi-options/usage-tutorial). 

* **LongShortPair contract** 0x4B9A968b87316Df5A2AEd7c4193F16cAb42A9208 is verified on sourcify as a full match on chain id 288. Note: you can check this yourself at https://repo.sourcify.dev/select-contract/ and see the verified files in the sourcify repo here: https://repo.sourcify.dev/contracts/full_match/288/0x4B9A968b87316Df5A2AEd7c4193F16cAb42A9208/.

* The `LongShortPairCreator` - This contract creates the `WAGMI LSP contract` through a [script](https://github.com/UMAprotocol/launch-lsp). **Each new WAGMI token requires a new WAGMI LSP contract with new/altered parameters**.

* The `Long` and `Short` tokens - These tokens are via created via `LongShortPair.create`. The `create` function deposits collateral into the contract in exchange for an *equal amount* of long and short tokens based on the collateralPerPair parameter. The collateralPerPair parameter determines the amount of collateral that is required for each pair of long and short tokens. *Note* - the `Long` tokens go to end users. The `Short` tokens are retained so that unclaimed collateral (BOBA tokens) that will not be claimed by the users if the ratio is below 2. End-user WAGMI tokens are of type `ExpandedIERC20`. `ExpandedIERC20` are very similar to normal ERC20s, but have additional mint/burn functions such as `burnFrom`. The tokens are minted via `LongShortPair.create`.

## System deployment and Minting new WAGMI Tokens

UMA provided us with this minting example below:

```javascript
// From UMA protocol repo on hardhat console I first load the LSP contract and BOBA as collateral:
LongShortPair = getContract("LongShortPair").at("0x5e9d23daa1b27754bd9bec66b9e87fa0ce0470ec")
collateralToken = getContract("ERC20").at("0xa18bF3994C0Cc6E3b63ac420308E5383f53120D7")

// Then I approved LSP to spend some BOBA tokens:
await collateralToken
  .methods
  .approve(LongShortPair.options.address, web3.utils.toWei("10")).send({gas: 100000, gasPrice: 2 * 1000000000, from: (await web3.eth.getAccounts())[0]})

// I minted pair of option tokens:
await LongShortPair
  .methods
  .create(
    web3.utils.toWei("5")
  ).send({
    gas: 300000, 
    gasPrice: 2 * 1000000000, 
    from: (await web3.eth.getAccounts())[0]
  })

// And tested redeem:
await LongShortPair
  .methods
  .redeem(
    web3.utils.toWei("2.5")
  ).send({
    gas: 200000, 
    gasPrice: 2 * 1000000000, 
    from: (await web3.eth.getAccounts())[0]
  })
```

WAGMIv0 was minted as follows:

```js
const depositBobaAmount = ethers.utils.parseEther('amount')

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

## Each WAGMI token needs new Oracle that provides the goal-specific data 

* WAGMIv0 oracle

The WAGMIv0 oracle is [documented here](https://github.com/UMAprotocol/UMIPs/blob/master/Implementations/boba-wagmi-tvl.md). Briefly, the oracle estimates TVL bridged from L1 to Boba network through the L1 standard bridge contract. It is based on similar calculation logic that is used to estimate Boba network TVL on the Dune Analytics Boba Bridge USD TVL display. 

[Method doc - Boba TVL](https://github.com/UMAprotocol/UMIPs/blob/master/Implementations/boba-wagmi-tvl.md) (that is referenced in LSP contract ancillary data) has link to example script: https://github.com/Reinis-FRP/boba-tvl

## Claims Interface

For the claims interface, the relevant smart contracts are: 

The [LSP contract](https://blockexplorer.boba.network/address/0x5E9d23daa1b27754bd9BEc66B9E87FA0ce0470Ec/transactions)

The [WAGMIv0 option](https://blockexplorer.boba.network/tokens/0x1302d39C61F0009e528b2Ff4ba692826Fe99f70c/token-transfers)

Post minting, the only interaction with the LSP is allowing users to call settle to exchange their WAGMI options for the underlying BOBA once the options expire: https://docs.umaproject.org/contracts/financial-templates/long-short-pair/LongShortPair#parameters-2

## Gateway changes needed

Adding new WAGMI tokens requires changes in six different areas of the gateway, primarily in `networkServices.js`, `account.js`, `coinImage.js`, and `tokenAction.js`. First, add the new WAGMI token to `networkServices.js`:

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
