/* eslint-disable quotes */
/*
Copyright 2021-present Boba Network.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

import { parseEther, formatEther } from '@ethersproject/units'
import {
  CrossChainMessenger,
} from '@eth-optimism/sdk'

import { ethers, BigNumber, utils } from 'ethers'

import store from 'store'
import { orderBy, groupBy } from 'lodash'
import BN from 'bn.js'

import { logAmount } from 'util/amountConvert'
import { getToken } from 'actions/tokenAction'

import {
  addBobaFee,
} from 'actions/setupAction'

import {
  updateSignatureStatus_exitLP,
  updateSignatureStatus_exitTRAD,
  updateSignatureStatus_depositLP,
  updateSignatureStatus_depositTRAD
} from 'actions/signAction'

// Base contracts
import L1StandardBridgeJson from '@eth-optimism/contracts/artifacts/contracts/L1/messaging/L1StandardBridge.sol/L1StandardBridge.json'
import L2StandardBridgeJson from '@eth-optimism/contracts/artifacts/contracts/L2/messaging/L2StandardBridge.sol/L2StandardBridge.json'
import L2ERC20Json from '@eth-optimism/contracts/artifacts/contracts/standards/L2StandardERC20.sol/L2StandardERC20.json'
import OVM_GasPriceOracleJson from '@eth-optimism/contracts/artifacts/contracts/L2/predeploys/OVM_GasPriceOracle.sol/OVM_GasPriceOracle.json'

// Boba contracts
import DiscretionaryExitFeeJson from '@boba/contracts/artifacts/contracts/DiscretionaryExitFee.sol/DiscretionaryExitFee.json'
import L1LPJson from '@boba/contracts/artifacts/contracts/LP/L1LiquidityPool.sol/L1LiquidityPool.json'
import L2LPJson from '@boba/contracts/artifacts/contracts/LP/L2LiquidityPool.sol/L2LiquidityPool.json'
import L2SaveJson from '@boba/contracts/artifacts/contracts/BobaFixedSavings.sol/BobaFixedSavings.json'
import Boba from "@boba/contracts/artifacts/contracts/DAO/governance-token/BOBA.sol/BOBA.json"
import L2BillingContractJson from "@boba/contracts/artifacts/contracts/L2BillingContract.sol/L2BillingContract.json"

//special one-off locations
import L1ERC20Json from '../deployment/contracts/L1ERC20.json'
import AuthenticatedFaucetJson from "../deployment/contracts/AuthenticatedFaucet.json"
import Boba_GasPriceOracleJson from "../deployment/contracts/Boba_GasPriceOracle.json"

//WAGMI ABIs
import WAGMIv0Json from "../deployment/contracts/WAGMIv0.json"
import WAGMIv1Json from "../deployment/contracts/WAGMIv1.json"

//veBoba ABIs
import veJson from "../deployment/contracts/ve.json"
import voterJson from "../deployment/contracts/BaseV1Voter.json"

// multi chain alt l1s ABI's
import AltL1BridgeJson from "@boba/contracts/artifacts/contracts/lzTokenBridge/AltL1Bridge.sol/AltL1Bridge.json"
import ETHL1BridgeJson from "@boba/contracts/artifacts/contracts/lzTokenBridge/EthBridge.sol/EthBridge.json"
import L2StandardERC20Json from "@eth-optimism/contracts/artifacts/contracts/standards/L2StandardERC20.sol/L2StandardERC20.json"
import LZEndpointMockJson from "@boba/contracts/artifacts/contracts/test-helpers/mocks/LZEndpointMock.sol/LZEndpointMock.json"

import { getNftImageUrl } from 'util/nftImage'
import { getNetwork } from 'util/masterConfig'

import etherScanInstance from 'api/etherScanAxios'
import omgxWatcherAxiosInstance from 'api/omgxWatcherAxios'
import coinGeckoAxiosInstance from 'api/coinGeckoAxios'
import verifierWatcherAxiosInstance from 'api/verifierWatcherAxios'
import metaTransactionAxiosInstance from 'api/metaTransactionAxios'

import { sortRawTokens } from 'util/common'
import GraphQLService from "./graphQLService"

import addresses_BobaBase from "@boba/register/addresses/addressesBobaBase_0xF8d0bF3a1411AC973A606f90B2d1ee0840e5979B"
import addresses_BobaOperaTestnet from "@boba/register/addresses/addressesBobaOperaTestnet_0x12ad9f501149D3FDd703cC10c567F416B7F0af8b"
import addresses_BobaFuji from "@boba/register/addresses/addressBobaFuji_0xcE78de95b85212BC348452e91e0e74c17cf37c79"
import addresses_BobaBnbTestnet from "@boba/register/addresses/addressBobaBnbTestnet_0xAee1fb3f4353a9060aEC3943fE932b6Efe35CdAa"
import addresses_BobaBeam from "@boba/register/addresses/addressBobaBeam_0x564c10A60af35a07f0EA8Be3106a4D81014b21a0"
import addresses_BobaAvax from "@boba/register/addresses/addressBobaAvax_0x00220f8ce1c4be8436574e575fE38558d85e2E6b"
import addresses_BobaBnb from "@boba/register/addresses/addressBobaBnb_0xeb989B25597259cfa51Bd396cE1d4B085EC4c753"
import addresses_BobaOpera from "@boba/register/addresses/addressBobaOpera_0x4e7325bcf09e091Bb8119258B885D4ef687B7386"

import layerZeroTestnet from "@boba/register/addresses/layerZeroTestnet"
import layerZeroMainnet from "@boba/register/addresses/layerZeroMainnet"

import tokenInfo from "@boba/register/addresses/tokenInfo"

import { bobaBridges } from 'util/bobaBridges'

// Icon
import * as React from 'react';
import MoonbeamIcon from 'components/icons/MoonbeamIcon.js'
import MoonbaseIcon from 'components/icons/MoonbaseIcon.js'
import FantomIcon from 'components/icons/FantomIcon.js'
import AvaxIcon from 'components/icons/AvaxIcon.js'
import BnbIcon from 'components/icons/BnbIcon.js'
import { APP_AIRDROP, APP_CHAIN, SPEED_CHECK } from 'util/constant'
import { getPoolDetail } from 'util/poolDetails'

require('dotenv').config()

const ERROR_ADDRESS = '0x0000000000000000000000000000000000000000'
const L1_ETH_Address = '0x0000000000000000000000000000000000000000'
const L2_BOBA_Address = '0x4200000000000000000000000000000000000006'
const L2MessengerAddress = '0x4200000000000000000000000000000000000007'
const L2StandardBridgeAddress = '0x4200000000000000000000000000000000000010'
const L2GasOracle = '0x420000000000000000000000000000000000000F'
const L2_SecondaryFeeToken_Address = '0x4200000000000000000000000000000000000023'

let allAddresses = {}

// preload allAddresses
if (process.env.REACT_APP_CHAIN === 'bobaBase') {
  allAddresses = {
    ...addresses_BobaBase,
    L1LPAddress: addresses_BobaBase.Proxy__L1LiquidityPool,
    L2LPAddress: addresses_BobaBase.Proxy__L2LiquidityPool
  }
}
if (process.env.REACT_APP_CHAIN === 'bobaBeam') {
  allAddresses = {
    ...addresses_BobaBeam,
    L1LPAddress: addresses_BobaBeam.Proxy__L1LiquidityPool,
    L2LPAddress: addresses_BobaBeam.Proxy__L2LiquidityPool,
    ...layerZeroMainnet.BOBA_Bridges.Mainnet,
    ...layerZeroMainnet.Layer_Zero_Protocol.Moonbeam,
    layerZeroTargetChainID: layerZeroMainnet.Layer_Zero_Protocol.Mainnet.Layer_Zero_ChainId,
  }
}
if (process.env.REACT_APP_CHAIN === 'bobaOperaTestnet') {
  allAddresses = {
    ...addresses_BobaOperaTestnet,
    L1LPAddress: addresses_BobaOperaTestnet.Proxy__L1LiquidityPool,
    L2LPAddress: addresses_BobaOperaTestnet.Proxy__L2LiquidityPool
  }
}
if (process.env.REACT_APP_CHAIN === 'bobaFuji') {
  allAddresses = {
    ...addresses_BobaFuji,
    L1LPAddress: addresses_BobaFuji.Proxy__L1LiquidityPool,
    L2LPAddress: addresses_BobaFuji.Proxy__L2LiquidityPool
  }
}
if (process.env.REACT_APP_CHAIN === 'bobaAvax') {
  allAddresses = {
    ...addresses_BobaAvax,
    L1LPAddress: addresses_BobaAvax.Proxy__L1LiquidityPool,
    L2LPAddress: addresses_BobaAvax.Proxy__L2LiquidityPool,
    ...layerZeroMainnet.BOBA_Bridges.Mainnet,
    ...layerZeroMainnet.Layer_Zero_Protocol.Avalanche,
    layerZeroTargetChainID: layerZeroMainnet.Layer_Zero_Protocol.Mainnet.Layer_Zero_ChainId,
  }
}
if (process.env.REACT_APP_CHAIN === 'bobaBnbTestnet') {
  allAddresses = {
    ...addresses_BobaBnbTestnet,
    L1LPAddress: addresses_BobaBnbTestnet.Proxy__L1LiquidityPool,
    L2LPAddress: addresses_BobaBnbTestnet.Proxy__L2LiquidityPool
  }
}
if (process.env.REACT_APP_CHAIN === 'bobaBnb') {
  allAddresses = {
    ...addresses_BobaBnb,
    L1LPAddress: addresses_BobaBnb.Proxy__L1LiquidityPool,
    L2LPAddress: addresses_BobaBnb.Proxy__L2LiquidityPool,
    ...layerZeroMainnet.BOBA_Bridges.Mainnet,
    ...layerZeroMainnet.Layer_Zero_Protocol.BNB,
    layerZeroTargetChainID: layerZeroMainnet.Layer_Zero_Protocol.Mainnet.Layer_Zero_ChainId,
  }
}
if (process.env.REACT_APP_CHAIN === 'bobaOpera') {
  allAddresses = {
    ...addresses_BobaOpera,
    L1LPAddress: addresses_BobaOpera.Proxy__L1LiquidityPool,
    L2LPAddress: addresses_BobaOpera.Proxy__L2LiquidityPool
  }
}

// suported chains
const supportedMultiChains = ['bobaBase', 'bobaOperaTestnet', 'bobaFuji', 'bobaBnbTestnet', 'bobaBeam', 'bobaAvax', 'bobaBnb', 'bobaOpera']

// assets for different chains
const L1ChainAssets = {
  'bobaBase': {
    name: 'Moonbase',
    l1NameShort: 'Moonbase',
    l2Name: 'Bobabase',
    icon: (bool) => <MoonbaseIcon selected={bool}/>,
    supportedTokens: [ 'BOBA', process.env.REACT_APP_L1_NATIVE_TOKEN_SYMBOL],
    foundation: true,
  },
  'bobaBeam': {
    name: 'Moonbeam',
    l1NameShort: 'Moonbeam',
    l2Name: 'Bobabeam',
    icon: (bool) => <MoonbeamIcon selected={bool}/>,
    supportedTokens: [ 'BOBA', process.env.REACT_APP_L1_NATIVE_TOKEN_SYMBOL, "ETH.mc", "ETH.wh", "WBTC.mc", "WBTC.wh", "USDC.mc", "USDC.wh"],
    supportedTokenAddresses: {},
    foundation: false,
  },
  'bobaOperaTestnet': {
    name: 'Fantom Testenet',
    l1NameShort: 'Fantom',
    l2Name: 'Bobaopera Testnet',
    icon: (bool) => <FantomIcon selected={bool}/>,
    supportedTokens: [ 'BOBA', process.env.REACT_APP_L1_NATIVE_TOKEN_SYMBOL],
    supportedTokenAddresses: {},
    foundation: true,
  },
  'bobaFuji': {
    name: 'Avalanche Testnet',
    l1NameShort: 'Avalanche',
    l2Name: 'Boba Avalanche Testnet',
    icon: (bool) => <AvaxIcon selected={bool}/>,
    supportedTokens: [ 'BOBA', process.env.REACT_APP_L1_NATIVE_TOKEN_SYMBOL],
    supportedTokenAddresses: {},
    foundation: true,
  },
  'bobaAvax': {
    name: 'Avalanche Mainnet C-Chain',
    l1NameShort: 'Avalanche',
    l2Name: 'Boba Avalanche Mainnet',
    icon: (bool) => <AvaxIcon selected={bool}/>,
    supportedTokens: [ 'BOBA', process.env.REACT_APP_L1_NATIVE_TOKEN_SYMBOL, 'EVO', 'USDT.e', 'USDt', 'USDC.e', 'BUSD.e', 'BUSD', 'DAI.e'],
    supportedTokenAddresses: {
      'EVO': {'L1': '0x42006Ab57701251B580bDFc24778C43c9ff589A1', 'L2': '0xc8849f32138de93F6097199C5721a9EfD91ceE01'}
    },
    foundation: false,
  },
  'bobaBnbTestnet': {
    name: 'BNB Testnet',
    l1NameShort: 'BNB',
    l2Name: 'Boba BNB Testnet',
    icon: (bool) => <BnbIcon selected={bool}/>,
    supportedTokens: [ 'BOBA', process.env.REACT_APP_L1_NATIVE_TOKEN_SYMBOL, 'MTT'],
    supportedTokenAddresses: {},
    foundation: true,
  },
  'bobaBnb': {
    name: 'Binance Smart Chain Mainnet',
    l1NameShort: 'BNB',
    l2Name: 'Boba BNB Mainnet',
    icon: (bool) => <BnbIcon selected={bool}/>,
    supportedTokens: [ 'BOBA', process.env.REACT_APP_L1_NATIVE_TOKEN_SYMBOL, 'BUSD', 'USDC', "USDT", "SUSHI", "ETH", "BTCB"],
    supportedTokenAddresses: {},
    foundation: false,
  },
  'bobaOpera': {
    name: 'Fantom Mainnet',
    l2Name: 'Bobaopera Mainnet',
    icon: (bool) => <FantomIcon selected={bool}/>,
    supportedTokens: [ 'BOBA', process.env.REACT_APP_L1_NATIVE_TOKEN_SYMBOL, 'USDC', 'DAI'],
    supportedTokenAddresses: {},
    foundation: false,
  },
}

let allTokens = {}

function handleChangeChainOnce(chainID_hex_string) {

  localStorage.setItem('chainChangedInit', true)

  localStorage.setItem('newChain', Number(chainID_hex_string))
  // and remove the listner
  window.ethereum.removeListener('chainChanged', handleChangeChainOnce)
}

class NetworkService {

  constructor() {

    this.account = null    // the user's account
    this.L1Provider = null // L1 Infura
    this.L2Provider = null // L2 to Boba replica
    this.provider = null   // from MetaMask

    this.environment = null

    // L1 or L2
    this.L1orL2 = null
    this.networkGateway = null
    this.L1ProviderBASE = null
    this.L2ProviderBASE = null

    // Watcher
    this.watcher = null
    this.fastWatcher = null

    // addresses
    this.AddressManagerAddress = null
    this.AddressManager = null

    this.L1_TEST_Contract = null
    this.L2_TEST_Contract = null
    this.L1_OMG_Contract = null
    this.L2_ETH_Contract = null

    this.ERC721Contract = null
    this.ERC721RegContract = null

    this.L2TokenPoolContract = null
    this.AtomicSwapContract = null

    this.tokenAddresses = null
    this.addresses = null

    // chain ID
    this.chainID = null
    this.networkName = null

    // gas
    this.L1GasLimit = 9999999
    // setting of this value not important since it's not connected to anything in the contracts
    // "param _l1Gas Unused, but included for potential forward compatibility considerations"
    this.L2GasLimit = 1300000 //use the same as the hardcoded receive

    this.gasEstimateAccount = null

    // Dao
    this.BobaContract = null
    this.xBobaContract = null
    this.delegateContract = null
    this.delegatorContract = null
    this.delegatorContractV2 = null

    // Gas oracle
    this.gasOracleContract = null

    // billing contract
    this.L2BillingContract = null

    // swap data for calculating the l1 security fee
    this.payloadForL1SecurityFee = null
    // fast deposit in batch
    this.payloadForFastDepositBatchCost = null

    // support token
    this.supportedTokens = []

    // L1 Native Token Symbol
    this.L1NativeTokenSymbol = null
    this.L1NativeTokenName = null

    // chain
    this.chain = process.env.REACT_APP_CHAIN

    // twitter faucet promotion text
    this.twitterFaucetPromotionText = ''

    // block explorer urls for the footer
    this.blockExplorerUrls = getNetwork()[this.chain].L2.blockExplorer

    // supported chain
    this.supportedMultiChains = supportedMultiChains

    this.L1ChainAsset = L1ChainAssets[this.chain]
    // support alt l1 tokens
    this.supportedAltL1Chains = [L1ChainAssets[this.chain].l1NameShort]

    // token info
    this.tokenInfo = {}
  }

  bindProviderListeners() {
    window.ethereum.on('accountsChanged', () => {
      window.location.reload()
    })
    window.ethereum.on('chainChanged', () => {
      const chainChangedInit = JSON.parse(localStorage.getItem('chainChangedInit'))
      // do not reload window in the special case where the user
      // changed chains AND conncted at the same time
      // otherwise the user gets confused about why they are going through
      // two window reloads
      if(chainChangedInit) {
        localStorage.setItem('chainChangedInit', false)
      } else {
        localStorage.setItem('chainChangedFromMM', true)
        window.location.reload()
      }
    })
  }

  async fetchVerifierStatus() {
    const response = await verifierWatcherAxiosInstance(
      this.networkGateway
    ).post('/', { jsonrpc: "2.0", method: "status", id: 1 })

    if (response.status === 200) {
      const status = response.data.result
      return status
    } else {
      console.log("Bad verifier response")
      return false
    }
  }

  async getBobaFeeChoice() {
    const bobaFeeContract = new ethers.Contract(
      allAddresses.Boba_GasPriceOracle,
      Boba_GasPriceOracleJson.abi,
      this.L2Provider
    )

    try {

      let priceRatio = await bobaFeeContract.priceRatio()

      let feeChoice = await bobaFeeContract.secondaryFeeTokenUsers(this.account)
      console.log("BFO: feeChoice:",feeChoice)

      const bobaFee = {
        priceRatio: priceRatio.toString(),
        feeChoice
      }

      await addBobaFee( bobaFee )

      return bobaFee

    } catch (error) {

      console.log(error)
      return error
    }

  }

  async switchFee( targetFee ) {

    if( this.L1orL2 !== 'L2' ) return

    const bobaFeeContract = new ethers.Contract(
      allAddresses.Boba_GasPriceOracle,
      Boba_GasPriceOracleJson.abi,
      this.provider.getSigner()
    )

    try {

      let tx = null

      if( targetFee === 'BOBA' ) {
        tx = await bobaFeeContract.useBobaAsFeeToken()
        await tx.wait()
      } else if (targetFee === networkService.L1NativeTokenSymbol) {
        tx = await bobaFeeContract.useSecondaryFeeTokenAsFeeToken()
        await tx.wait()
      }

      await this.getBobaFeeChoice()

      return tx
    } catch (error) {
      console.log(error)
      return error
    }
  }

  async getETHMetaTransaction() {

    const EIP712Domain = [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ]
    const Permit = [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ]

    const owner = this.account
    const spender = allAddresses.Boba_GasPriceOracle

    const Boba_GasPriceOracle = new ethers.Contract(
      allAddresses.Boba_GasPriceOracle,
      Boba_GasPriceOracleJson.abi,
      this.provider.getSigner()
    )

    let value = (await Boba_GasPriceOracle.getSecondaryFeeTokenForSwap()).toString()
    const nonce = (await this.BobaContract.nonces(this.account)).toNumber()
    const deadline = Math.floor(Date.now() / 1000) + 300
    const verifyingContract = this.BobaContract.address

    const name = await this.BobaContract.name()
    const version = '1'
    const chainId = (await this.L2Provider.getNetwork()).chainId

    const data = {
      primaryType: 'Permit',
      types: { EIP712Domain, Permit },
      domain: { name, version, chainId, verifyingContract },
      message: { owner, spender, value, nonce, deadline },
    }

    let signature

    try {
      signature = await this.provider.send('eth_signTypedData_v4', [this.account, JSON.stringify(data)])
    } catch (error) {
      console.log(error)
      return error
    }

    try {
      const response = await metaTransactionAxiosInstance(
        this.networkGateway
      ).post('/send.swapSecondaryFeeToken', { owner, spender, value, deadline, signature, data })
      console.log("response",response)
      await this.getBobaFeeChoice()
    } catch (error) {
      // sigh
      let errorData = error.response.data.error
      if(errorData.hasOwnProperty('error')) {
        errorData = errorData.error.error.body
      }
      console.log("returning:",error)
      return errorData
    }
  }

  /** @dev Only works on testnet, but can be freely called on production app */
  async getTestnetETHAuthenticatedMetaTransaction(tweetId) {

    console.log("triggering getTestnetETH")

    const Boba_AuthenticatedFaucet = new ethers.Contract(
      allAddresses.AuthenticatedFaucet,
      AuthenticatedFaucetJson.abi,
      this.L2Provider,
    )

    const nonce = parseInt(
      await Boba_AuthenticatedFaucet.getNonce(this.account),
      10
    )

    console.log("nonce:", nonce)

    const signer = this.provider.getSigner(this.account)
    const hashedMsg = ethers.utils.solidityKeccak256(
      ['address', 'uint'],
      [this.account, nonce]
    )
    const messageHashBin = ethers.utils.arrayify(hashedMsg)
    const signature = await signer.signMessage(messageHashBin)

    const payload = { hashedMsg, signature, tweetId, walletAddress: this.account }
    console.log("payload:",payload)

    try {
      const response = await metaTransactionAxiosInstance(
        this.networkGateway
      ).post('/send.getTestnetETH', payload)
      console.log("response:",response)
    } catch (error) {
      let errorMsg = error?.response?.data?.error?.error?.body
      if (errorMsg) {
        errorMsg = JSON.stringify(errorMsg)?.match(/execution reverted:\s(.+)\\"/)
        errorMsg = errorMsg ? errorMsg[1]?.trim() : null;
      }
      console.log(`MetaTx error for getTestnetETH: ${errorMsg}`)
      if (errorMsg?.includes('Invalid request')) {
        errorMsg = errorMsg.match(/Invalid request:(.+)/)
        if (errorMsg) {
          const errorMap = [
            'Twitter API error - Probably api limit exceeded.',
            'Twitter account needs to exist >= 48 hours.',
            'Invalid Tweet, be sure to tweet the Boba Bubble provided above.',
            'Your Twitter account needs more than 5 followers.',
            'You need to have tweeted more than 2 times.',
          ]
          try {
            errorMsg = errorMap[parseInt(errorMsg[1]) - 1]
          } catch(err) {
            console.error(err)
            errorMsg = 'Unexpected Twitter error.'
          }
        } else {
          errorMsg = 'Not expected Turing error.'
        }
      } else {
        const errorMap = {
          'Cooldown': 'Cooldown: You need to wait 24h to claim again with this Twitter account.',
          'No testnet funds': 'Faucet drained: Please tell us.',
          'Rate limit reached': 'Throttling: Too many requests. Throttling to not hit Twitter rate limit.',
        }
        const errorKey = Object.keys(errorMap).find(k => errorMsg.includes(k))
        if (errorKey) errorMsg = errorMap[errorKey]
      }
      return errorMsg ?? 'Limits reached or Twitter constraints not met.'
    }
  }

  async getAddress(contractName, varToSet) {
    const address = await this.AddressManager.getAddress(contractName)
    if (address === ERROR_ADDRESS) {
      console.log(contractName + ' ERROR: NOT IN ADDRESSMANAGER')
      return false
    } else {
      allAddresses = {
        ...allAddresses,
        [varToSet]: address
      }
      console.log(contractName +' pulled from AddressManager and set to:', address)
      return true
    }
  }

  async getAddressCached(cache, contractName, varToSet) {
    const address = cache[contractName]
    if (typeof(address) === 'undefined') {
      console.log(contractName + ' ERROR: NOT IN CACHE')
      return false
    } else {
      allAddresses = {
        ...allAddresses,
        [varToSet]: address
      }
      console.log(contractName +' pulled from address cache and set to:', address)
      return true
    }
  }

  getAllAddresses() {
     return allAddresses
  }

  async initializeBase( networkGateway ) {

    console.log('NS: initializeBase() for', networkGateway)

    let addresses = null
    this.networkGateway = networkGateway // e.g. mainnet | goerli | ...

    // defines the set of possible networks along with chainId for L1 and L2
    const nw = getNetwork()
    const L1rpc = nw[networkGateway]['L1']['rpcUrl']
    const L2rpc = nw[networkGateway]['L2']['rpcUrl']

    // add l1 native token symbol
    this.L1NativeTokenSymbol = nw[networkGateway]['L1']['symbol']
    this.L1NativeTokenName = nw[networkGateway]['L1']['tokenName'] || this.L1NativeTokenSymbol

    try {

      //fire up the base providers
      const Web3 = require("web3")

      this.L1ProviderBASE = new Web3(new Web3.providers.HttpProvider(L1rpc))
      this.L2ProviderBASE = new Web3(new Web3.providers.HttpProvider(L2rpc))

      if (this.supportedMultiChains.includes(networkGateway)) {
        this.payloadForL1SecurityFee = nw[networkGateway].payloadForL1SecurityFee
        this.payloadForFastDepositBatchCost = nw[networkGateway].payloadForFastDepositBatchCost
        this.gasEstimateAccount = nw[networkGateway].gasEstimateAccount
        this.twitterFaucetPromotionText = nw[networkGateway].twitterFaucetPromotionText
        console.log('gasEstimateAccount:', this.gasEstimateAccount)
      }
      else {
        this.gasEstimateAccount = ethers.constants.AddressZero
      }

      this.L1Provider = new ethers.providers.StaticJsonRpcProvider(
        nw[networkGateway]['L1']['rpcUrl']
      )

      this.L2Provider = new ethers.providers.StaticJsonRpcProvider(
        nw[networkGateway]['L2']['rpcUrl']
      )

      const chainId = (await this.L1Provider.getNetwork()).chainId
      this.tokenInfo = tokenInfo[chainId]

      if (this.supportedMultiChains.includes(networkGateway)) {
        addresses = allAddresses
        console.log(`${networkGateway} Addresses: ${addresses}`)
      }
      // else if (networkGateway === 'local') {
      //     //addresses = addresses_Local
      //     console.log('Goerli Addresses:', addresses)
      // }

      // this.AddressManagerAddress = nw[networkGateway].addressManager
      // console.log("AddressManager address:",this.AddressManagerAddress)

      // this.AddressManager = new ethers.Contract(
      //   this.AddressManagerAddress,
      //   AddressManagerJson.abi,
      //   this.L1Provider
      // )
      // //console.log("AddressManager Contract:",this.AddressManager)

      if (!(await this.getAddressCached(addresses, 'Proxy__L1CrossDomainMessenger', 'L1MessengerAddress'))) return
      if (!(await this.getAddressCached(addresses, 'Proxy__L1CrossDomainMessengerFast', 'L1FastMessengerAddress'))) return
      if (!(await this.getAddressCached(addresses, 'Proxy__L1StandardBridge', 'L1StandardBridgeAddress'))) return
      if (!(await this.getAddressCached(addresses, 'Proxy__Boba_GasPriceOracle', 'Boba_GasPriceOracle'))) return

      // not critical
      this.getAddressCached(addresses, 'DiscretionaryExitFee', 'DiscretionaryExitFee')
      console.log("DiscretionaryExitFee:",allAddresses.DiscretionaryExitFee)

      //L2CrossDomainMessenger is a predeploy, so add by hand....
      allAddresses = {
        ...allAddresses,
        'L2MessengerAddress': L2MessengerAddress,
      }

      //L2StandardBridgeAddress is a predeploy, so add by hand....
      allAddresses = {
        ...allAddresses,
        'L2StandardBridgeAddress': L2StandardBridgeAddress,
      }

      //L2MessengerAddress is a predeploy, so add by hand....
      allAddresses = {
        ...allAddresses,
        'L2MessengerAddress': L2MessengerAddress
      }

      //L2_BOBA_Address is a predeploy, so add by hand....
      allAddresses = {
        ...allAddresses,
        'L2_BOBA_Address': L2_BOBA_Address
      }

      //L1_ETH_Address is a predeploy, so add by hand....
      allAddresses = {
        ...allAddresses,
        'L1_ETH_Address': L1_ETH_Address
      }

      this.L1StandardBridgeContract = new ethers.Contract(
        allAddresses.L1StandardBridgeAddress,
        L1StandardBridgeJson.abi,
        this.L1Provider
      )

      this.supportedTokens = networkService.L1ChainAsset.supportedTokens

      await Promise.all(this.supportedTokens.map(async (key) => {

        const L2a = addresses['TK_L2'+key]

        const L1a = addresses['TK_L1'+key]
        if (typeof L1a === 'undefined' || typeof L2a === 'undefined') {
          console.log(key + ' ERROR: TOKEN NOT IN ADDRESSMANAGER')
          if (typeof networkService.L1ChainAsset.supportedTokenAddresses[key] !== 'undefined') {
            allTokens[key] = networkService.L1ChainAsset.supportedTokenAddresses[key]
          }
          return false
        } else {
          allTokens[key] = {
            'L1': L1a,
            'L2': L2a
          }
        }

      }))

      this.tokenAddresses = allTokens

      if(allAddresses.L2StandardBridgeAddress !== null) {
        this.L2StandardBridgeContract = new ethers.Contract(
          allAddresses.L2StandardBridgeAddress,
          L2StandardBridgeJson.abi,
          this.L2Provider
        )
      }
      console.log("L2StandardBridgeContract:", this.L2StandardBridgeContract.address)

      this.L2_ETH_Contract = new ethers.Contract(
        allAddresses.L2_BOBA_Address,
        L2ERC20Json.abi,
        this.L2Provider
      )
      //console.log("L2_ETH_Contract:", this.L2_ETH_Contract.address)

      /*The test token*/
      this.L1_TEST_Contract = new ethers.Contract(
        allTokens.BOBA.L1, //this will get changed anyway when the contract is used
        L1ERC20Json.abi,
        this.L1Provider
      )
      // console.log('L1_TEST_Contract:', this.L1_TEST_Contract)

      this.L2_TEST_Contract = new ethers.Contract(
        allTokens.BOBA.L2, //this will get changed anyway when the contract is used
        L2ERC20Json.abi,
        this.L2Provider
      )
      //console.log('L2_TEST_Contract:', this.L2_TEST_Contract)

      // Liquidity pools
      console.log('Setting up contract for L1LP at:',allAddresses.L1LPAddress)
      this.L1LPContract = new ethers.Contract(
        allAddresses.L1LPAddress,
        L1LPJson.abi,
        this.L1Provider
      )

      console.log('Setting up contract for L2LP at:',allAddresses.L2LPAddress)
      this.L2LPContract = new ethers.Contract(
        allAddresses.L2LPAddress,
        L2LPJson.abi,
        this.L2Provider
      )

      this.L2BillingContract = new ethers.Contract(
        allAddresses.Proxy__BobaBillingContract,
        L2BillingContractJson.abi,
        this.L2Provider,
      )

      if (this.supportedMultiChains.includes(networkGateway)) {
        const l1ChainId = (await this.L1Provider.getNetwork()).chainId
        this.watcher = new CrossChainMessenger({
          l1SignerOrProvider: this.L1Provider,
          l2SignerOrProvider: this.L2Provider,
          l1ChainId,
          fastRelayer: false,
        })
        this.fastWatcher = new CrossChainMessenger({
          l1SignerOrProvider: this.L1Provider,
          l2SignerOrProvider: this.L2Provider,
          l1ChainId,
          fastRelayer: true,
        })
      }
      else {
        this.watcher = null
        this.fastWatcher = null
      }

      this.BobaContract = new ethers.Contract(
        L2_SecondaryFeeToken_Address,
        Boba.abi,
        this.L2Provider
      )

      this.gasOracleContract = new ethers.Contract(
        L2GasOracle,
        OVM_GasPriceOracleJson.abi,
        this.L2Provider
      )

      return 'enabled'

    } catch (error) {
      console.log(`NS: ERROR: InitializeBase `,error)
      return false
    }
  }

  async initializeAccount( networkGateway ) {

    console.log('NS: initializeAccounts() for', networkGateway)

    try {

      // connect to the wallet
      await window.ethereum.request({method: 'eth_requestAccounts'})
      this.provider = new ethers.providers.Web3Provider(window.ethereum)
      this.account = await this.provider.getSigner().getAddress()

      const networkMM = await this.provider.getNetwork()
      this.chainID = networkMM.chainId
      this.networkName = networkMM.name
      this.networkGateway = networkGateway

      console.log('NS: networkMM:', networkMM)
      console.log('NS: networkGateway:', networkGateway)
      console.log('NS: this.chainID from MM:', this.chainID)
      console.log('NS: this.networkName from MM:', this.networkName)
      console.log('NS: this.account from MM:', this.account)

      // defines the set of possible networks along with chainId for L1 and L2
      const nw = getNetwork()
      const L1ChainId = nw[networkGateway]['L1']['chainId']
      const L2ChainId = nw[networkGateway]['L2']['chainId']

      // there are numerous possible chains we could be on
      // either local, goerli etc
      // also, either L1 or L2

      // at this point, we only know whether we want to be on local or rinkeby etc
      if (this.supportedMultiChains.includes(networkGateway) && networkMM.chainId === L1ChainId) {
        //ok, that's reasonable
        //bobaBase, L1
        this.L1orL2 = 'L1'
      }
      else if (this.supportedMultiChains.includes(networkGateway) && networkMM.chainId === L2ChainId) {
        //ok, that's reasonable
        //bobaBase, L2
        this.L1orL2 = 'L2'
      }
      else {
        console.log("ERROR: networkGateway does not match actual network.chainId")
        this.bindProviderListeners()
        return 'wrongnetwork'
      }

      this.bindProviderListeners()
      // this should not do anything unless we changed chains

      await this.getBobaFeeChoice()

      return this.L1orL2 // return the layer we are actually on

    } catch (error) {
      console.log(`NS: ERROR: InitializeAccount `,error)
      return false
    }
  }

  async addL2Network() {

    console.log("MetaMask: Adding network to MetaMask")

    const nw = getNetwork()
    const masterConfig = store.getState().setup.masterConfig

    const chainParam = {
      chainId: '0x' + nw[masterConfig].L2.chainId.toString(16),
      chainName: nw[masterConfig].L2.name,
      rpcUrls: [nw[masterConfig].L2.rpcUrl],
      blockExplorerUrls: [nw[masterConfig].L2.blockExplorer.slice(0, -1)],
    }

    console.log("MetaMask: Adding ", chainParam)

    // connect to the wallet
    this.provider = new ethers.providers.Web3Provider(window.ethereum)
    let res = await this.provider.send('wallet_addEthereumChain', [chainParam, this.account])

    if( res === null ){
      console.log("MetaMask - Added new RPC")
    } else {
      console.log("MetaMask - Error adding new RPC: ", res)
    }

  }


  async switchChain( targetLayer ) {

    const nw = getNetwork()
    const network = store.getState().setup.network

    let blockExplorerUrls = null

    //local does not have a blockexplorer
    if( network !== 'local') {
      blockExplorerUrls = [nw[network][targetLayer].blockExplorer.slice(0, -1)]
    }

    const targetIDHex = nw[network][targetLayer].chainIdHex
    this.provider = new ethers.providers.Web3Provider(window.ethereum)

    try {
      await this.provider.send('wallet_switchEthereumChain', [{ chainId: targetIDHex }])

      window.ethereum.on('chainChanged', handleChangeChainOnce)
      return true
    } catch (error) {

      if (error.code === 4902) {
        /**
         * 4902 = the chain has not been added to MetaMask.
         * So, lets add it
         *  - prepare chain params and send event to add chain.
         *  - the chain param to be prepare and for L1 fetch token from config.
         */
        let chainParam = {
          chainId: '0x' + nw[network][targetLayer].chainId.toString(16),
          chainName: nw[network][targetLayer].name,
          rpcUrls: [nw[network][targetLayer].rpcUrl],
          nativeCurrency: {
            name: 'BOBA Token',
            symbol: 'BOBA',
            decimals: 18,
          },
          blockExplorerUrls,
        }
        // In case of L1 layer get the symbol from config.
        if (targetLayer === 'L1') {
          chainParam = {
            ...chainParam,
            blockExplorerUrls: null,
            nativeCurrency: {
              name: `${nw[network][targetLayer].name} Token`,
              symbol: nw[network][targetLayer].symbol,
              decimals: 18,
            },
          }
        }

        console.log(['chainParam',chainParam])
        try {
          await this.provider.send('wallet_addEthereumChain', [ chainParam, this.account ])
          window.ethereum.on('chainChanged', handleChangeChainOnce)
          return true
        } catch (addError) {
          console.log("MetaMask - Error adding new RPC: ", addError)
          return addError
        }
      } else { //some other error code
        console.log("MetaMask - Switch Error: ", error.code)
        return error
      }
    }
  }

  async getTransactions() {

    // NOT SUPPORTED on LOCAL
    if (this.networkGateway === 'local') return
    if (this.account === null) return

    let txL1 = []
    let txL1pending = []
    let txL2 = []
    let txL0 = []

    const responseL1 = await etherScanInstance(
      this.networkGateway,
      'L1'
    ).get(`&address=${this.account}`)

    if (responseL1.status === 200) {
      const transactionsL1 = await responseL1.data
      if (transactionsL1.status === '1') {
        //thread in ChainID
        txL1 = transactionsL1.result.map(v => ({
          ...v,
          blockNumber: parseInt(v.blockNumber), //fix bug - sometimes this is string, sometimes an integer
          timeStamp: parseInt(v.timeStamp),     //fix bug - sometimes this is string, sometimes an integer
          chain: 'L1'
        }))
      }
    }

    const responseL2 = await omgxWatcherAxiosInstance(
      this.networkGateway
    ).post('get.l2.transactions', {
      address: this.account,
      fromRange: 0,
      toRange: 1000,
    })

    if (responseL2.status === 201) {
      txL2 = responseL2.data.map(v => ({ ...v, chain: 'L2' }))
    }

    const responseL0 = await omgxWatcherAxiosInstance(
      this.networkGateway
    ).post('get.layerzero.transactions', {
      address: this.account,
      fromRange: 0,
      toRange: 1000,
    })

    if (responseL0.status === 201) {
      txL0 = responseL0.data.map((v) => ({
        ...v,
        hash: v.tx_hash,
        blockNumber: parseInt(v.block_number),
        timeStamp: parseInt(v.timestamp),     //fix bug - sometimes this is string, sometimes an integer
        chain: 'L0',
        altL1: true,
      }))
    }

    const responseL1pending = await omgxWatcherAxiosInstance(
      this.networkGateway
    ).post('get.l1.transactions', {
      address: this.account,
      fromRange: 0,
      toRange: 1000,
    })

    if (responseL1pending.status === 201) {
      //add the chain: 'L1pending' field
      txL1pending = responseL1pending.data.map(v => ({ ...v, chain: 'L1pending' }))
      const annotated = [
        ...txL1,
        ...txL2,
        ...txL0,
        ...txL1pending //the new data product
      ]
      return annotated
    }

  }

  async getExits() {
    // NOT SUPPORTED on LOCAL
    if (this.networkGateway === 'local') return

    const response = await omgxWatcherAxiosInstance(
      this.networkGateway
    ).post('get.l2.transactions', {
      address: this.account,
      fromRange:  0,
      toRange: 1000,
    })

    if (response.status === 201) {
      const transactions = response.data
      const filteredTransactions = transactions.filter(
        (i) => i.exitL2 && i.crossDomainMessage
      )
      return { exited: filteredTransactions }
    }

  }

  async getSevens() {

    console.log("getSevens()")

    // NOT SUPPORTED on LOCAL
    if (this.networkGateway === 'local') return

    const response = await omgxWatcherAxiosInstance(
      this.networkGateway
    ).get('get.l2.pendingexits')

    if (response.status === 201) {
      const data = response.data
      const filtered = data.filter(
        (i) => (i.fastRelay === 0) && (i.status === 'pending')
      )
      return filtered
    } else {
      return []
    }

  }

  async claimAuthenticatedTestnetTokens(tweetId) {
    // Only Goerli
    const contract = new ethers.Contract(
      allAddresses.AuthenticatedFaucet,
      AuthenticatedFaucetJson.abi,
      this.L2Provider,
    ).connect()

    await contract.estimateGas.sendFunds(tweetId)
    const claim = await contract.sendFunds(
      tweetId,
    )
    await claim.wait()
  }

  async addTokenList() {
    // Add the token to our master list, if we do not have it yet
    // if the token is already in the list, then this function does nothing
    // but if a new token shows up, then it will get added
    if (allTokens === null) return

    Object.keys(allTokens).forEach((token, i) => {
      getToken(allTokens[token].L1)
    })
  }

  async getL1FeeBalance() {
    try {
      const balance = await this.L1Provider.getBalance(this.account)
      return utils.formatEther(balance)
    } catch (error) {
      console.log("NS: getL1FeeBalance error:",error)
      return error
    }
  }

  async getL2BalanceETH() {
    try {
      const balance = await this.L2Provider.getBalance(this.account)
      return utils.formatEther(balance)
    } catch (error) {
      console.log("NS: getL2BalanceETH error:",error)
      return error
    }
  }

  async getL2BalanceBOBA() {
    try {
      const ERC20Contract = new ethers.Contract(
        this.tokenAddresses['BOBA'].L2,
        L2ERC20Json.abi, //any old abi will do...
        this.provider.getSigner()
      )
      const balance = await ERC20Contract.balanceOf(this.account)
      return utils.formatEther(balance)
    } catch (error) {
      console.log("NS: getL2BalanceBOBA error:",error)
      return error
    }
  }

  async getGas() {

    try {
      const gasPrice2 = await this.L2Provider.getGasPrice()
      //console.log("L2 gas", gasPrice2.toString())

      const block2 = await this.L2Provider.getBlockNumber()

      const gasPrice1 = await this.L1Provider.getGasPrice()
      //console.log("L1 gas", gasPrice1.toString())

      const block1 = await this.L1Provider.getBlockNumber()

      const gasData = {
        gasL1: Number(logAmount(gasPrice1.toString(),9)).toFixed(0),
        gasL2: Number(logAmount(gasPrice2.toString(),9)).toFixed(0),
        blockL1: Number(block1),
        blockL2: Number(block2),
      }

      //console.log(gasData)

      return gasData
    } catch (error) {
      console.log("NS: getGas error:",error)
      return error
    }

  }

  async getBalances() {

    const layer1Balances = [
      {
        address: allAddresses.L1_ETH_Address,
        addressL2: allAddresses["TK_L2" + networkService.L1NativeTokenSymbol],
        currency: allAddresses.L1_ETH_Address,
        symbol: networkService.L1NativeTokenSymbol,
        decimals: 18,
        balance: new BN(0),
      },
    ]

    const layer2Balances = [
      {
        address: allAddresses.L2_BOBA_Address,
        addressL1: allAddresses.TK_L1BOBA,
        addressL2: allAddresses.L2_BOBA_Address,
        currency: allAddresses.TK_L1BOBA,
        symbol: 'BOBA',
        decimals: 18,
        balance: new BN(0),
      },
    ]

    try {

      // Always check ETH
      const layer1Balance = await this.L1Provider.getBalance(this.account)
      const layer2Balance = await this.L2Provider.getBalance(this.account)

      layer1Balances[0].balance = new BN(layer1Balance.toString())
      layer2Balances[0].balance = new BN(layer2Balance.toString())

      const state = store.getState()
      const tA = Object.values(state.tokenList)

      const tokenC = new ethers.Contract(
        allAddresses.L1_ETH_Address,
        L1ERC20Json.abi,
        this.L1Provider
      )

      const getERC20Balance = async(token, tokenAddress, layer, provider) => {
        const balance = await tokenC.attach(tokenAddress).connect(provider).balanceOf(this.account)
        return {
          ...token,
          balance: new BN(balance.toString()),
          layer,
          address: layer === 'L1' ? token.addressL1 : token.addressL2,
          symbol: token.symbolL1
        }
      }

      const getBalancePromise = []

      tA.forEach((token) => {
        if (token.addressL1 === allAddresses.L1_ETH_Address) {
          return getBalancePromise.push(getERC20Balance(token, token.addressL2, "L2", this.L2Provider))

        }
        if (token.addressL2 === allAddresses.L2_BOBA_Address) {
          return getBalancePromise.push(getERC20Balance(token, token.addressL1, "L1", this.L1Provider))
        }
        if (token.addressL1 === null) return
        if (token.addressL2 === null) return
        getBalancePromise.push(getERC20Balance(token, token.addressL1, "L1", this.L1Provider))
        getBalancePromise.push(getERC20Balance(token, token.addressL2, "L2", this.L2Provider))

      })

      const tokenBalances = await Promise.all(getBalancePromise)

      tokenBalances.forEach((token) => {
        if(token.balance.lte(new BN(100000))) {
          //do nothing
        }
        else if (token.layer === 'L1') {
          layer1Balances.push(token)
        } else if (token.layer === 'L2') {
          layer2Balances.push(token)
        }
      })

      return {
        layer1: orderBy(layer1Balances, (i) => i.currency),
        layer2: orderBy(layer2Balances, (i) => i.currency),
      }
    } catch (error) {
      console.log("NS: getBalances error:", error)
      return error
    }

  }

  handleMetaMaskError = (errorCode) => {
    // console.log("MetaMask Errorcode:",errorCode)
    switch (errorCode) {
      case 4001:
        return 'Transaction was rejected by user: signature denied'
      //case -32603:
      //  return 'Execution reverted: ERC20: transfer amount exceeds balance'
      default:
        return null
    }
  }

  //Move ETH from L1 to L2 using the standard deposit system
  /******
   * Deposit ETH from L1 to L2.
   * Deposit ETH from L1 to another L2 account.
   * */

  async depositETHL2({
    recipient = null,
    value_Wei_String
  }) {

    updateSignatureStatus_depositTRAD(false)

    try {

      const time_start = new Date().getTime()
      console.log("TX start time:", time_start)

      const depositTX = await this.L1StandardBridgeContract
        .connect(this.provider.getSigner()).depositNativeToken(
          this.L2GasLimit,
          utils.formatBytes32String(new Date().getTime().toString()),
          {
            value: value_Wei_String
          }
      )

      //at this point the tx has been submitted, and we are waiting...
      await depositTX.wait()

      const block = await this.L1Provider.getTransaction(depositTX.hash)
      console.log(' block:', block)

      //closes the Deposit modal
      updateSignatureStatus_depositTRAD(true)

      const opts = {
        fromBlock: -4000
      }
      const receipt = await this.watcher.waitForMessageReceipt(depositTX, opts)
      console.log(' completed Deposit! L2 tx hash:', receipt.transactionHash)

      const time_stop = new Date().getTime()
      console.log("TX finish time:", time_stop)

      /**************************/
      /*   Remove speed check   */
      /**************************/
      // const data = {
      //   "key": process.env.REACT_APP_SPEED_CHECK,
      //   "hash": depositTX.hash,
      //   "l1Tol2": false, //since we are going L2->L1
      //   "startTime": time_start,
      //   "endTime": time_stop,
      //   "block": block.blockNumber,
      //   "cdmHash": receipt.transactionHash,
      //   "cdmBlock": receipt.blockNumber
      // }

      // console.log("Speed checker data payload:", data)

      // const speed = await omgxWatcherAxiosInstance(
      //   this.networkGateway
      // ).post('send.crossdomainmessage', data)

      // console.log("Speed checker:", speed)

      return receipt
    } catch(error) {
      console.log("NS: depositETHL2 error:",error)
      return error
    }
  }

  //Transfer funds from one account to another, on the L2
  async transfer(address, value_Wei_String, currency) {

    let tx = null

    try {

      if(currency === allAddresses.L2_BOBA_Address) {
        //we are sending ETH

        let wei = BigNumber.from(value_Wei_String)

        // just to be on the safe side
        // no idea why this is needed
        //wei = wei.sub(BigNumber.from('1000000000000'))

        //console.log("wei", wei)
        //console.log("wei.toString()", wei.toString())
        //console.log("hexlify", ethers.utils.hexlify(wei))

        tx = await this.provider
          .getSigner()
          .sendTransaction({
            to: address,
            value: ethers.utils.hexlify(wei)
          })

      } else {

        //any ERC20 json will do....
        tx = await this.L2_TEST_Contract
          .connect(this.provider.getSigner())
          .attach(currency)
          .transfer(
            address,
            value_Wei_String
          )
        await tx.wait()
      }

      return tx
    } catch (error) {
      console.log("NS: transfer error:", error)
      return error
    }
  }

  //Transfer funds from one account to another, on the L2
  async transferEstimate(recipient, value_Wei_String, currency) {

    const gasPrice_BN = await this.L2Provider.getGasPrice()
    //console.log("L2 gas price", gasPrice_BN.toString())

    let cost_BN = BigNumber.from('0')
    let gas_BN = BigNumber.from('0')

    try {

      if(currency === allAddresses.L2_BOBA_Address) {

        gas_BN = await this.provider
          .getSigner()
          .estimateGas({
            from: this.account,
            to: recipient,
            value: value_Wei_String
          })

        cost_BN = gas_BN.mul(gasPrice_BN)
        console.log("ETH: Transfer cost in ETH:", utils.formatEther(cost_BN))

      } else {

        const ERC20Contract = new ethers.Contract(
          currency,
          L2ERC20Json.abi, // any old abi will do...
          this.provider.getSigner()
        )

        const tx = await ERC20Contract
          .populateTransaction
          .transfer(
            recipient,
            value_Wei_String
          )

        gas_BN = await this.L2Provider.estimateGas( tx )

        cost_BN = gas_BN.mul(gasPrice_BN)
        console.log("ERC20: Transfer cost in ETH:", utils.formatEther(cost_BN))
      }

      const safety_margin = BigNumber.from('1000000000000')
      console.log("ERC20: Safety margin:", utils.formatEther(safety_margin))

      return cost_BN.add(safety_margin)
    } catch (error) {
      console.log("NS: transferEstimate error:", error)
      return error
    }
  }

  //figure out which layer we are on right now
  confirmLayer = (layerToConfirm) => async (dispatch) => {
    if (layerToConfirm === this.L1orL2) {
      return true
    } else {
      return false
    }
  }

  async checkAllowance(
    currencyAddress,
    targetContract
  ) {
    console.log("currencyAddress",currencyAddress)
    console.log("targetContract",targetContract)
    try {
      const ERC20Contract = new ethers.Contract(
        currencyAddress,
        L1ERC20Json.abi, //could use any abi - just something with .allowance
        this.provider.getSigner()
      )
      const allowance = await ERC20Contract.allowance(
        this.account,
        targetContract
      )
      return allowance
    } catch (error) {
      console.log("NS: checkAllowance error:", error)
      return error
    }
  }

   // Used when people want to fast exit - they have to deposit funds into the L2LP
  // to start the fast exit
  async approveERC20_L2LP(
    value_Wei_String,
    currencyAddress
  ) {

    try {

      console.log("approveERC20_L2LP")

      //we could use any L2 ERC contract here - just getting generic parts of the abi
      //but we know we alaways have the TEST contract, so will use that
      const L2ERC20Contract = this.L2_TEST_Contract
        .connect(this.provider.getSigner())
        .attach(currencyAddress)

      let allowance_BN = await L2ERC20Contract.allowance(
        this.account,
        allAddresses.L2LPAddress
      )

      //let depositAmount_BN = new BN(value_Wei_String)
      let depositAmount_BN = BigNumber.from(value_Wei_String)

      if (depositAmount_BN.gt(allowance_BN)) {
        const approveStatus = await L2ERC20Contract.approve(
          allAddresses.L2LPAddress,
          value_Wei_String
        )
        await approveStatus.wait()
        return approveStatus
      }

      return allowance_BN
    } catch (error) {
      console.log("NS: approveERC20_L2LP error:", error)
      return error
    }
  }

  //used to stake funds in the L1LP
  async approveERC20_L1LP(
    value_Wei_String,
    currency
  ) {

    console.log("approveERC20_L1LP")
    const approveContractAddress = allAddresses.L1LPAddress

    let allowance_BN = BigNumber.from("0")
    let allowed = false

    try {

      const ERC20Contract = new ethers.Contract(
        currency,
        L1ERC20Json.abi,
        this.provider.getSigner()
      )

      if( currency !== allAddresses.L1_ETH_Address ) {

        let allowance_BN = await ERC20Contract.allowance(
          this.account,
          approveContractAddress
        )
        console.log("Initial allowance:",allowance_BN)

        //recheck the allowance
        allowance_BN = await ERC20Contract.allowance(
          this.account,
          approveContractAddress
        )

        allowed = allowance_BN.gte(BigNumber.from(value_Wei_String))

      } else {
        //we are dealing with ETH - go straight to approve

      }

      if(!allowed) {
        //and now, the normal allowance transaction
        const approveStatus = await ERC20Contract.approve(
          approveContractAddress,
          value_Wei_String
        )
        await approveStatus.wait()
        console.log("ERC 20 L1 Staking approved:",approveStatus)
        return approveStatus
      }

      return allowance_BN

    } catch (error) {
      console.log("NS: approveERC20_L1LP error:", error)
      return error
    }
  }

  async approveERC20(
    value_Wei_String,
    currency,
    approveContractAddress = allAddresses.L1StandardBridgeAddress,
    contractABI = L1ERC20Json.abi
  ) {

    try {

      const ERC20Contract = new ethers.Contract(
        currency,
        contractABI,
        this.provider.getSigner()
      )

      /***********************/

      let allowance_BN = await ERC20Contract.allowance(
        this.account,
        approveContractAddress
      )
      console.log("Initial Allowance is:",allowance_BN)

      //recheck the allowance
      allowance_BN = await ERC20Contract.allowance(
        this.account,
        approveContractAddress
      )
      console.log("Second Allowance is:",allowance_BN)

      const allowed = allowance_BN.gte(BigNumber.from(value_Wei_String))

      console.log("Allowed?:",allowed)

      if(!allowed) {
        console.log("Not good enough - need to set to:",value_Wei_String)
        //and now, the normal allowance transaction
        const approveStatus = await ERC20Contract.approve(
          approveContractAddress,
          value_Wei_String
        )
        await approveStatus.wait()
        console.log("ERC20 L1 SWAP ops approved:",approveStatus)
      }

      return true
    } catch (error) {
      console.log("NS: approveERC20 error:", error)
      return error
    }
  }

  //Used to move ERC20 Tokens from L1 to L2 using the classic deposit
  async depositErc20({
    recipient = null,
    value_Wei_String,
    currency,
    currencyL2 }) {

    updateSignatureStatus_depositTRAD(false)

    const L1_TEST_Contract = this.L1_TEST_Contract.attach(currency)

    let allowance_BN = await L1_TEST_Contract.allowance(
      this.account,
      allAddresses.L1StandardBridgeAddress
    )

    try {
      //recheck the allowance
      allowance_BN = await L1_TEST_Contract.allowance(
        this.account,
        allAddresses.L1StandardBridgeAddress
      )

      const allowed = allowance_BN.gte(BigNumber.from(value_Wei_String))

      if(!allowed) {
        //and now, the normal allowance transaction
        const approveStatus = await L1_TEST_Contract
          .connect(this.provider.getSigner()).approve(
            allAddresses.L1StandardBridgeAddress,
            value_Wei_String
          )
        await approveStatus.wait()
        console.log("ERC20 L1 ops approved:",approveStatus)
      }

      const time_start = new Date().getTime()
      console.log("TX start time:", time_start)

      let depositTX;

      if (!recipient) {
        // incase no recipient
        depositTX = await this.L1StandardBridgeContract
        .connect(this.provider.getSigner()).depositERC20(
          currency,
          currencyL2,
          value_Wei_String,
          this.L2GasLimit,
          utils.formatBytes32String(new Date().getTime().toString())
        )
      } else {
        // deposit ERC20 to L2 account address.
        depositTX = await this.L1StandardBridgeContract
          .connect(this.provider.getSigner())
          .depositERC20To(
          currency,
          currencyL2,
          recipient,
          value_Wei_String,
          this.L2GasLimit,
          utils.formatBytes32String(new Date().getTime().toString())
        )
      }

      console.log("depositTxStatus:",depositTX)

      //at this point the tx has been submitted, and we are waiting...
      await depositTX.wait()

      const block = await this.L1Provider.getTransaction(depositTX.hash)
      console.log(' block:', block)

      //closes the Deposit modal
      updateSignatureStatus_depositTRAD(true)

      const opts = {
        fromBlock: -4000
      }
      const receipt = await this.watcher.waitForMessageReceipt(depositTX, opts)
      console.log(' completed Deposit! L2 tx hash:', receipt.transactionHash)

      const time_stop = new Date().getTime()
      console.log("TX finish time:", time_stop)

      /**************************/
      /*   Remove speed check   */
      /**************************/
      // const data = {
      //   "key": process.env.REACT_APP_SPEED_CHECK,
      //   "hash": depositTX.hash,
      //   "l1Tol2": true,
      //   "startTime": time_start,
      //   "endTime": time_stop,
      //   "block": block.blockNumber,
      //   "cdmHash": receipt.transactionHash,
      //   "cdmBlock": receipt.blockNumber
      // }

      // console.log("Speed checker data payload:", data)

      // const speed = await omgxWatcherAxiosInstance(
      //   this.networkGateway
      // ).post('send.crossdomainmessage', data)

      // console.log("Speed checker:", speed)

      this.getBalances()

      return receipt
    } catch (error) {
      console.log("NS: depositErc20 error:", error)
      return error
    }
  }

  //Standard 7 day exit from BOBA
  async exitBOBA(currencyAddress, value_Wei_String) {

    updateSignatureStatus_exitTRAD(false)

    try {

      const L2BillingContract = new ethers.Contract(
        allAddresses.Proxy__BobaBillingContract,
        L2BillingContractJson.abi,
        this.L2Provider,
      )
      let BobaApprovalAmount = await L2BillingContract.exitFee()

      //now coming in as a value_Wei_String
      const value = BigNumber.from(value_Wei_String)

      const allowance = await this.checkAllowance(
        currencyAddress,
        allAddresses.DiscretionaryExitFee
      )

      // Should approve other tokens
      if( currencyAddress !== allAddresses.L2_BOBA_Address &&
          utils.getAddress(currencyAddress) !== utils.getAddress(allAddresses.TK_L2BOBA) &&
          allowance.lt(value)
        ) {
        const res = await this.approveERC20(
          value,
          currencyAddress,
          allAddresses.DiscretionaryExitFee
        )
        if (!res) return false
      }

      const DiscretionaryExitFeeContract = new ethers.Contract(
        allAddresses.DiscretionaryExitFee,
        DiscretionaryExitFeeJson.abi,
        this.provider.getSigner()
      )
      console.log("DiscretionaryExitFeeContract",DiscretionaryExitFeeContract)

      const tx = await DiscretionaryExitFeeContract.payAndWithdraw(
        currencyAddress,
        value_Wei_String,
        this.L1GasLimit,
        utils.formatBytes32String(new Date().getTime().toString()),
        currencyAddress === allAddresses.L2_BOBA_Address ?
          { value: value.add(BobaApprovalAmount) } : { value: BobaApprovalAmount }
      )

      //everything submitted... waiting
      await tx.wait()

      //can close window now
      updateSignatureStatus_exitTRAD(true)

      const opts = {
        fromBlock: -4000
      }
      const receipt = await this.watcher.waitForMessageReceipt(tx, opts)
      console.log(' got L2->L1 receipt', receipt)

      return tx
    } catch (error) {
      console.log("NS: exitBOBA error:", error)
      return error
    }

  }

  /* Estimate cost of Classical Exit to L1 */
  async getExitCost(currencyAddress) {

    let approvalCost_BN = BigNumber.from('0')

    const gasPrice = await this.L2Provider.getGasPrice()
    console.log("Classical exit gas price", gasPrice.toString())

    console.log(allAddresses.DiscretionaryExitFee)

    if( currencyAddress !== allAddresses.L2_BOBA_Address ) {

      const ERC20Contract = new ethers.Contract(
        currencyAddress,
        L2ERC20Json.abi, //any old abi will do...
        this.provider.getSigner()
      )

      const tx = await ERC20Contract.populateTransaction.approve(
        allAddresses.DiscretionaryExitFee,
        utils.parseEther('1.0')
      )

      const approvalGas_BN = await this.L2Provider.estimateGas({...tx, from: this.gasEstimateAccount})
      approvalCost_BN = approvalGas_BN.mul(gasPrice)
      console.log("Approve cost in ETH:", utils.formatEther(approvalCost_BN))
    }

    const DiscretionaryExitFeeContract = new ethers.Contract(
      allAddresses.DiscretionaryExitFee,
      DiscretionaryExitFeeJson.abi,
      this.provider.getSigner()
    )

    const L2BillingContract = new ethers.Contract(
      allAddresses.Proxy__BobaBillingContract,
      L2BillingContractJson.abi,
      this.L2Provider,
    )
    const exitFee = await L2BillingContract.exitFee()

    console.log(exitFee)

    const tx2 = await DiscretionaryExitFeeContract.populateTransaction.payAndWithdraw(
      allAddresses.L2_BOBA_Address,
      utils.parseEther('0.00001'),
      this.L1GasLimit,
      ethers.utils.formatBytes32String(new Date().getTime().toString()),
      { value: utils.parseEther('0.00001').add(exitFee) }
    )

    console.log(tx2, this.gasEstimateAccount, L2_BOBA_Address)

    const gas_BN = await this.L2Provider.estimateGas({...tx2, from: this.gasEstimateAccount})
    console.log("Classical exit gas", gas_BN.toString())

    const cost_BN = gas_BN.mul(gasPrice)
    console.log("Classical exit cost (ETH):", utils.formatEther(cost_BN))

    const totalCost = utils.formatEther(cost_BN.add(approvalCost_BN))
    console.log("Classical exit total cost (ETH):", totalCost)

    //returns total cost in ETH
    return totalCost
  }

  async fetchLookUpPrice(params) {
    try {
       // fetching only the prices compare to usd.
       const res = await coinGeckoAxiosInstance.get(
         `simple/price?ids=${params.join()}&vs_currencies=usd`
       )
       return res.data
    } catch(error) {
      return error
    }
  }

  /***********************************************/
  /*****                  Fee                *****/
  /***** Fees are reported as integers,      *****/
  /***** where every int represents 0.1%     *****/
  /***********************************************/

  async getL1TotalFeeRate() {

    try{
      const L1LPContract = new ethers.Contract(
        allAddresses.L1LPAddress,
        L1LPJson.abi,
        this.L1Provider
      )
      const [operatorFeeRate, userMinFeeRate, userMaxFeeRate] = await Promise.all([
        L1LPContract.ownerRewardFeeRate(),
        L1LPContract.userRewardMinFeeRate(),
        L1LPContract.userRewardMaxFeeRate()
      ])

      const feeRateL = Number(userMinFeeRate) + Number(operatorFeeRate)
      const feeRateH = Number(userMaxFeeRate) + Number(operatorFeeRate)

      return {
        feeMin: (feeRateL / 10).toFixed(1),
        feeMax: (feeRateH / 10).toFixed(1)
      }

    } catch (error) {
      console.log("NS: getL1TotalFeeRate error:", error)
      return error
    }
  }

  async getL2TotalFeeRate() {

    try{

      const L2LPContract = new ethers.Contract(
        allAddresses.L2LPAddress,
        L2LPJson.abi,
        this.L2Provider
      )
      const [operatorFeeRate, userMinFeeRate, userMaxFeeRate] = await Promise.all([
        L2LPContract.ownerRewardFeeRate(),
        L2LPContract.userRewardMinFeeRate(),
        L2LPContract.userRewardMaxFeeRate()
      ])

      const feeRateL = Number(userMinFeeRate) + Number(operatorFeeRate)
      const feeRateH = Number(userMaxFeeRate) + Number(operatorFeeRate)

      return {
        feeMin: (feeRateL / 10).toFixed(1),
        feeMax: (feeRateH / 10).toFixed(1)
      }
    } catch (error) {
      console.log("NS: getL2TotalFeeRate error:", error)
      return error
    }
  }

  async getL1UserRewardFeeRate(tokenAddress) {
    try{
        const L1LPContract = new ethers.Contract(
        allAddresses.L1LPAddress,
        L1LPJson.abi,
        this.L1Provider
      )
      const feeRate = await L1LPContract.getUserRewardFeeRate(tokenAddress)
      //console.log("NS: getL1UserRewardFeeRate:", feeRate)
      return (feeRate / 10).toFixed(1)
    } catch (error) {
      console.log("NS: getL1UserRewardFeeRate error:", error)
      return error
    }
  }

  async getL2UserRewardFeeRate(tokenAddress) {
    try {
        const L2LPContract = new ethers.Contract(
        allAddresses.L2LPAddress,
        L2LPJson.abi,
        this.L2Provider
      )
      const feeRate = await L2LPContract.getUserRewardFeeRate(tokenAddress)
      //console.log("NS: getL2UserRewardFeeRate:", feeRate)
      return (feeRate / 10).toFixed(1)
    } catch (error) {
      console.log("NS: getL2UserRewardFeeRate error:", error)
      return error
    }
  }

  /*****************************************************/
  /***** Pool, User Info, to populate the Farm tab *****/
  /*****************************************************/
  async getL1LPInfo() {

    const poolInfo = {}
    const userInfo = {}

    let tokenAddressList = Object.keys(allTokens).reduce((acc, cur) => {
      if(cur !== 'xBOBA' &&
        cur !== 'OLO' &&
        cur !== 'WAGMIv0' &&
        cur !== 'WAGMIv1' &&
        cur !== 'WAGMIv2' &&
        cur !== 'WAGMIv2-Oolong' &&
        cur !== 'WAGMIv3' &&
        cur !== 'WAGMIv3-Oolong') {
        acc.push(allTokens[cur].L1.toLowerCase())
      }
      return acc
    }, [allAddresses.L1_ETH_Address])

    const L1LPContract = new ethers.Contract(
      allAddresses.L1LPAddress,
      L1LPJson.abi,
      this.L1Provider
    )

    const L1LPInfoPromise = []

    const getL1LPInfoPromise = async(tokenAddress) => {

      let tokenBalance
      let tokenSymbol
      let tokenName
      let decimals

      if (tokenAddress === allAddresses.L1_ETH_Address) {
        //console.log("Getting eth balance:", tokenAddress)
        //getting eth balance
        tokenBalance = await this.L1Provider.getBalance(allAddresses.L1LPAddress)
        tokenSymbol = this.L1NativeTokenSymbol
        tokenName = this.L1NativeTokenName
        decimals = 18
      } else {
        //getting eth balance
        //console.log("Getting balance for:", tokenAddress)
        tokenBalance = await this.L1_TEST_Contract.attach(tokenAddress).connect(this.L1Provider).balanceOf(allAddresses.L1LPAddress)
        const tokenInfoFiltered = this.tokenInfo.L1[utils.getAddress(tokenAddress)]
        if (tokenInfo) {
          tokenSymbol = tokenInfoFiltered.symbol
          tokenName = tokenInfoFiltered.name
          decimals = tokenInfoFiltered.decimals
        } else {
          tokenSymbol = await this.L1_TEST_Contract.attach(tokenAddress).connect(this.L1Provider).symbol()
          tokenName = await this.L1_TEST_Contract.attach(tokenAddress).connect(this.L1Provider).name()
          decimals = await this.L1_TEST_Contract.attach(tokenAddress).connect(this.L1Provider).decimals()
        }
      }

      const poolTokenInfo = await L1LPContract.poolInfo(tokenAddress)
      let userTokenInfo = {}
      if (typeof this.account !== 'undefined' && this.account) {
        userTokenInfo = await L1LPContract.userInfo(tokenAddress, this.account)
      }
      return { tokenAddress, tokenBalance, tokenSymbol, tokenName, poolTokenInfo, userTokenInfo, decimals }
    }

    tokenAddressList.forEach((tokenAddress) => L1LPInfoPromise.push(getL1LPInfoPromise(tokenAddress)))

    const L1LPInfo = await Promise.all(L1LPInfoPromise)
    sortRawTokens(L1LPInfo).forEach((token) => {
      const userIn = Number(token.poolTokenInfo.userDepositAmount.toString())
      const rewards = Number(token.poolTokenInfo.accUserReward.toString())
      const duration = new Date().getTime() - Number(token.poolTokenInfo.startTime) * 1000
      const durationDays = duration / (60 * 60 * 24 * 1000)
      const annualRewardEstimate = 365 * rewards / durationDays
      let annualYieldEstimate = 100 * annualRewardEstimate / userIn
      if(!annualYieldEstimate) annualYieldEstimate = 0
      poolInfo[token.tokenAddress.toLowerCase()] = {
        symbol: token.tokenSymbol,
        name: token.tokenName,
        decimals: token.decimals,
        l1TokenAddress: token.poolTokenInfo.l1TokenAddress.toLowerCase(),
        l2TokenAddress: token.poolTokenInfo.l2TokenAddress.toLowerCase(),
        accUserReward: token.poolTokenInfo.accUserReward.toString(),
        accUserRewardPerShare: token.poolTokenInfo.accUserRewardPerShare.toString(),
        userDepositAmount: token.poolTokenInfo.userDepositAmount.toString(),
        startTime: token.poolTokenInfo.startTime.toString(),
        APR: annualYieldEstimate,
        tokenBalance: token.tokenBalance.toString()
      }
      userInfo[token.tokenAddress] = {
        l1TokenAddress: token.tokenAddress.toLowerCase(),
        amount: Object.keys(token.userTokenInfo).length? token.userTokenInfo.amount.toString(): 0,
        pendingReward: Object.keys(token.userTokenInfo).length? token.userTokenInfo.pendingReward.toString(): 0,
        rewardDebt: Object.keys(token.userTokenInfo).length? token.userTokenInfo.rewardDebt.toString(): 0
      }
    })
    return { poolInfo, userInfo }
  }

  async getL2LPInfo() {

    const tokenAddressList = Object.keys(allTokens).reduce((acc, cur) => {
      if(cur !== 'xBOBA' &&
         cur !== 'OLO' &&
         cur !== 'WAGMIv0' &&
         cur !== 'WAGMIv1' &&
         cur !== 'WAGMIv2' &&
         cur !== 'WAGMIv2-Oolong' &&
         cur !== 'WAGMIv3' &&
         cur !== 'WAGMIv3-Oolong'
        ) {
        acc.push({
          L1: allTokens[cur].L1.toLowerCase(),
          L2: allTokens[cur].L2.toLowerCase()
        })
      }
      return acc
    }, [{
      L1: allAddresses.L1_ETH_Address,
      L2: allAddresses[`TK_L2${this.L1NativeTokenSymbol}`]
    }])

    const L2LPContract = new ethers.Contract(
      allAddresses.L2LPAddress,
      L2LPJson.abi,
      this.L2Provider
    )

    const poolInfo = {}
    const userInfo = {}

    const L2LPInfoPromise = [];

    const getL2LPInfoPromise = async( tokenAddress, tokenAddressL1 ) => {

      let tokenBalance
      let tokenSymbol
      let tokenName
      let decimals

      if (tokenAddress === allAddresses.L2_BOBA_Address) {
        tokenBalance = await this.L2Provider.getBalance(allAddresses.L2LPAddress)
        tokenSymbol = 'BOBA'
        tokenName = 'BOBA Token'
        decimals = 18
      } else {
        tokenBalance = await this.L2_TEST_Contract.attach(tokenAddress).connect(this.L2Provider).balanceOf(allAddresses.L2LPAddress)
        const tokenInfoFiltered = this.tokenInfo.L2[utils.getAddress(tokenAddress)]
        if (tokenInfo) {
          tokenSymbol = tokenInfoFiltered.symbol
          tokenName = tokenInfoFiltered.name
          decimals = tokenInfoFiltered.decimals
        } else {
          tokenSymbol = await this.L2_TEST_Contract.attach(tokenAddress).connect(this.L2Provider).symbol()
          tokenName = await this.L2_TEST_Contract.attach(tokenAddress).connect(this.L2Provider).name()
          decimals = await this.L1_TEST_Contract.attach(tokenAddressL1).connect(this.L1Provider).decimals()
        }
      }
      const poolTokenInfo = await L2LPContract.poolInfo(tokenAddress)
      let userTokenInfo = {}
      if (typeof this.account !== 'undefined' && this.account) {
        userTokenInfo = await L2LPContract.userInfo(tokenAddress, this.account)
      }
      return { tokenAddress, tokenBalance, tokenSymbol, tokenName, poolTokenInfo, userTokenInfo, decimals }
    }

    tokenAddressList.forEach(({L1, L2}) => L2LPInfoPromise.push(getL2LPInfoPromise(L2, L1)))

    const L2LPInfo = await Promise.all(L2LPInfoPromise)

    sortRawTokens(L2LPInfo).forEach((token) => {
      const userIn = Number(token.poolTokenInfo.userDepositAmount.toString())
      const rewards = Number(token.poolTokenInfo.accUserReward.toString())
      const duration = new Date().getTime() - Number(token.poolTokenInfo.startTime) * 1000
      const durationDays = duration / (60 * 60 * 24 * 1000)
      const annualRewardEstimate = 365 * rewards / durationDays
      let annualYieldEstimate = 100 * annualRewardEstimate / userIn
      if(!annualYieldEstimate) annualYieldEstimate = 0
      poolInfo[token.tokenAddress.toLowerCase()] = {
        symbol: token.tokenSymbol,
        name: token.tokenName,
        decimals: token.decimals,
        l1TokenAddress: token.poolTokenInfo.l1TokenAddress.toLowerCase(),
        l2TokenAddress: token.poolTokenInfo.l2TokenAddress.toLowerCase(),
        accUserReward: token.poolTokenInfo.accUserReward.toString(),
        accUserRewardPerShare: token.poolTokenInfo.accUserRewardPerShare.toString(),
        userDepositAmount: token.poolTokenInfo.userDepositAmount.toString(),
        startTime: token.poolTokenInfo.startTime.toString(),
        APR: annualYieldEstimate,
        tokenBalance: token.tokenBalance.toString()
      }
      userInfo[token.tokenAddress.toLowerCase()] = {
        l2TokenAddress: token.tokenAddress.toLowerCase(),
        amount: Object.keys(token.userTokenInfo).length? token.userTokenInfo.amount.toString(): 0,
        pendingReward: Object.keys(token.userTokenInfo).length? token.userTokenInfo.pendingReward.toString(): 0,
        rewardDebt: Object.keys(token.userTokenInfo).length? token.userTokenInfo.rewardDebt.toString(): 0
      }
    })

    return { poolInfo, userInfo }
  }

  /***********************************************/
  /*****            Add Liquidity            *****/
  /***********************************************/
  async addLiquidity(currency, value_Wei_String, L1orL2Pool) {

    let otherField = {}

    if( currency === allAddresses.L1_ETH_Address || currency === allAddresses.L2_BOBA_Address ) {
      // add value field for ETH
      otherField['value'] = value_Wei_String
    }

    try {
      const TX = await (L1orL2Pool === 'L1LP'
        ? this.L1LPContract
        : this.L2LPContract
      )
      .connect(this.provider.getSigner())
      .addLiquidity(
        value_Wei_String,
        currency,
        otherField
      )
      await TX.wait()
      return TX
    } catch (error) {
      console.log("NS: addLiquidity error:", error)
      return error
    }
  }

  async liquidityEstimate(currency) {

    let otherField = {
      from: this.gasEstimateAccount
    }

    const gasPrice_BN = await this.provider.getGasPrice()
    let approvalCost_BN = BigNumber.from('0')
    let stakeCost_BN = BigNumber.from('0')

    try {

      // First, we need the approval cost
      // not relevant to ETH
      if( currency !== allAddresses.L2_BOBA_Address ) {

        const tx1 = await this.BobaContract
          .populateTransaction
          .approve(
            allAddresses.L2LPAddress,
            utils.parseEther('1.0'),
            otherField
          )

        const approvalGas_BN = await this.provider.estimateGas(tx1)
        approvalCost_BN = approvalGas_BN.mul(gasPrice_BN)
        console.log("Approve cost in BOBA:", utils.formatEther(approvalCost_BN))
      }

      // Second, we need the addLiquidity cost
      // all ERC20s will be the same, so use the BOBA contract
      const tx2 = await this.L2LPContract
        .connect(this.provider)
        .populateTransaction
        .addLiquidity(
          utils.parseEther('1.0'),
          this.tokenAddresses['BOBA'].L2,
          { ...otherField, value: utils.parseEther('1.0') }
        )
      const stakeGas_BN = await this.provider.estimateGas(tx2)
      stakeCost_BN = stakeGas_BN.mul(gasPrice_BN)
      console.log("addLiquidity cost in BOBA:", utils.formatEther(stakeCost_BN))

      const safety_margin_BN = BigNumber.from('1000000000000')
      console.log("Safety margin:", utils.formatEther(safety_margin_BN))

      return approvalCost_BN.add(stakeCost_BN).add(safety_margin_BN)

    } catch (error) {
      console.log('NS: liquidityEstimate() error', error)
      return error
    }

  }

  /***********************************************/
  /*****           Get Reward                *****/
  /***********************************************/
  async getReward(currencyAddress, value_Wei_String, L1orL2Pool) {

    try {
      const TX = await (L1orL2Pool === 'L1LP'
        ? this.L1LPContract
        : this.L2LPContract
      )
      .connect(this.provider.getSigner())
      .withdrawReward(
        value_Wei_String,
        currencyAddress,
        this.account
      )
      await TX.wait()
      return TX
    } catch (error) {
      console.log("NS: getReward error:", error)
      return error
    }
  }

  /***********************************************/
  /*****          Withdraw Liquidity         *****/
  /***********************************************/
  async withdrawLiquidity(currency, value_Wei_String, L1orL2Pool) {

    try {
      const TX = await (L1orL2Pool === 'L1LP'
        ? this.L1LPContract
        : this.L2LPContract
      )
      .connect(this.provider.getSigner())
      .withdrawLiquidity(
        value_Wei_String,
        currency,
        this.account
      )
      await TX.wait()
      return TX
    } catch (error) {
      console.log("NS: withdrawLiquidity error:", error)
      return error
    }
  }

  /***********************************************************/
  /***** SWAP ON to BOBA by depositing funds to the L1LP *****/
  /***********************************************************/
  async depositL1LP(currency, value_Wei_String) {

    updateSignatureStatus_depositLP(false)

    console.log("depositL1LP:",currency)
    console.log("value_Wei_String",value_Wei_String)

    const time_start = new Date().getTime()
    console.log("TX start time:", time_start)
    console.log("Depositing...")

    try {

      let depositTX = await this.L1LPContract
        .connect(this.provider.getSigner())
        .clientDepositL1(
          value_Wei_String,
          currency,
          currency === allAddresses.L1_ETH_Address ? { value: value_Wei_String } : {}
        )

      console.log("depositTX",depositTX)

      //at this point the tx has been submitted, and we are waiting...
      await depositTX.wait()

      const block = await this.L1Provider.getTransaction(depositTX.hash)
      console.log(' block:', block)

      updateSignatureStatus_depositLP(true)

      // const opts = {
      //   fromBlock: -4000
      // }
      // const receipt = await this.watcher.waitForMessageReceipt(depositTX, opts)
      // console.log(' completed swap-on ! L2 tx hash:', receipt.transactionHash)

      // const time_stop = new Date().getTime()
      // console.log("TX finish time:", time_stop)

      // const data = {
      //   "key": process.env.REACT_APP_SPEED_CHECK,
      //   "hash": depositTX.hash,
      //   "l1Tol2": true,
      //   "startTime": time_start,
      //   "endTime": time_stop,
      //   "block": block.blockNumber,
      //   "cdmHash": receipt.transactionHash,
      //   "cdmBlock": receipt.blockNumber
      // }

      // console.log("Speed checker data payload:", data)

      // const speed = await omgxWatcherAxiosInstance(
      //   this.networkGateway
      // ).post('send.crossdomainmessage', data)

      // console.log("Speed checker:", speed)

      return true

    } catch (error) {
      console.log("NS: depositL1LP error:", error)
      return error
    }
  }

  async depositL1LPBatch(payload) {

    const updatedPayload = []
    let ETHAmount = 0

    for (const tokenInput of payload) {
      updatedPayload.push({
        l1TokenAddress: tokenInput.currency,
        amount: utils.parseUnits(tokenInput.value, tokenInput.decimals).toString()
      })
      if (tokenInput.symbol === 'ETH') {
        ETHAmount = utils.parseUnits(tokenInput.value, tokenInput.decimals).toString()
      }
    }

    updateSignatureStatus_depositLP(false)

    try {
      console.log("payload:",updatedPayload)

      const time_start = new Date().getTime()
      console.log("TX start time:", time_start)

      let depositTX
      console.log("Depositing...")
      depositTX = await this.L1LPContract
        .connect(this.provider.getSigner()).clientDepositL1Batch(
          updatedPayload,
          ETHAmount !== 0 ? { value: ETHAmount } : {}
        )

      console.log("depositTX",depositTX)

      //at this point the tx has been submitted, and we are waiting...
      await depositTX.wait()

      const block = await this.L1Provider.getTransaction(depositTX.hash)
      console.log(' block:', block)

      updateSignatureStatus_depositLP(true)

      const opts = {
        fromBlock: -4000
      }
      const receipt = await this.watcher.waitForMessageReceipt(depositTX, opts)
      console.log(' completed swap-on ! L2 tx hash:', receipt.transactionHash)

      const time_stop = new Date().getTime()
      console.log("TX finish time:", time_stop)

      const data = {
        "key": SPEED_CHECK,
        "hash": depositTX.hash,
        "l1Tol2": true,
        "startTime": time_start,
        "endTime": time_stop,
        "block": block.blockNumber,
        "cdmHash": receipt.transactionHash,
        "cdmBlock": receipt.blockNumber
      }

      console.log("Speed checker data payload:", data)

      const speed = await omgxWatcherAxiosInstance(
        this.networkGateway
      ).post('send.crossdomainmessage', data)

      console.log("Speed checker:", speed)

      return receipt

    } catch (error) {
      console.log("NS: depositL1LPBatch error:", error)
      return error
    }
  }

  /***************************************/
  /************ L1LP Pool size ***********/
  /***************************************/
  async L1LPPending(tokenAddress) {

    const L1pending = await omgxWatcherAxiosInstance(
      this.networkGateway
    ).get('get.l2.pendingexits', {})

    const pendingFast = L1pending.data.filter(i => {
       return (i.fastRelay === 1) && //fast exit
        i.exitToken.toLowerCase() === tokenAddress.toLowerCase() //and, this specific token
    })

    let sum = pendingFast.reduce(function(prev, current) {
      let weiString = BigNumber.from(current.exitAmount)
      return prev.add(weiString)
    }, BigNumber.from('0'))

    return sum.toString()

  }

  /***************************************/
  /************ L1LP Pool size ***********/
  /***************************************/
  async L2LPPending(tokenAddress) {
    //Placeholder return
    const sum = BigNumber.from('0')
    return sum.toString()
  }

  /***************************************/
  /************ L1LP Pool size ***********/
  /***************************************/
  async L1LPBalance(tokenAddress) {

    //console.log("L1LPBalance(tokenAddress)")

    let balance
    let tokenAddressLC = tokenAddress.toLowerCase()

    if (
      tokenAddressLC === allAddresses.L2_BOBA_Address ||
      tokenAddressLC === allAddresses.L1_ETH_Address
    ) {
      balance = await this.L1Provider.getBalance(allAddresses.L1LPAddress)
    } else {
      balance = await this.L1_TEST_Contract
        .attach(tokenAddress)
        .connect(this.L1Provider)
        .balanceOf(allAddresses.L1LPAddress)
    }

    return balance.toString()

  }

  /***************************************/
  /************ L2LP Pool size ***********/
  /***************************************/
  async L2LPBalance(tokenAddress) {

    let balance
    let tokenAddressLC = tokenAddress.toLowerCase()

    if (
      tokenAddressLC === allAddresses.L2_BOBA_Address ||
      tokenAddressLC === allAddresses.L1_ETH_Address
    ) {
      //We are dealing with ETH
      balance = await this.L2_ETH_Contract.connect(this.L2Provider).balanceOf(
        allAddresses.L2LPAddress
      )
    } else {
      balance = await this.L2_TEST_Contract.attach(tokenAddress).connect(this.L2Provider).balanceOf(
        allAddresses.L2LPAddress
      )
    }

    return balance.toString()
  }

  /***************************************/
  /*********** L1LP Liquidity ************/
  /***************************************/
  async L1LPLiquidity(tokenAddress) {

    const L1LPContractNS = new ethers.Contract(
      allAddresses.L1LPAddress,
      L1LPJson.abi,
      this.L1Provider
    )

    try {
      const poolTokenInfo = await L1LPContractNS.poolInfo(tokenAddress)
      return poolTokenInfo.userDepositAmount.toString()
    } catch (error) {
      console.log("NS: L1LPLiquidity error:", error)
      return error
    }

  }

  /***************************************/
  /*********** L2LP Liquidity ************/
  /***************************************/
  async L2LPLiquidity(tokenAddress) {

    const L2LPContractNS = new ethers.Contract(
      allAddresses.L2LPAddress,
      L2LPJson.abi,
      this.L2Provider
    )

    try {
      const poolTokenInfo = await L2LPContractNS.poolInfo(tokenAddress)
      return poolTokenInfo.userDepositAmount.toString()
    } catch (error) {
      console.log("NS: L2LPLiquidity error:", error)
      return error
    }

  }

  /* Estimate cost of Fast Exit to L1 */
  async getFastExitCost(currencyAddress) {

    let approvalCost_BN = BigNumber.from('0')

    const gasPrice = await this.L2Provider.getGasPrice()
    console.log("Fast exit gas price", gasPrice.toString())

    if( currencyAddress !== allAddresses.L2_BOBA_Address ) {

      const ERC20Contract = new ethers.Contract(
        currencyAddress,
        L2ERC20Json.abi, //any old abi will do...
        this.provider.getSigner()
      )

      const tx = await ERC20Contract
        .populateTransaction
        .approve(
          allAddresses.L2LPAddress,
          utils.parseEther('1.0')
        )

      const approvalGas_BN = await this.L2Provider.estimateGas({...tx, from: this.gasEstimateAccount})
      approvalCost_BN = approvalGas_BN.mul(gasPrice)
      console.log("Approve cost in ETH:", utils.formatEther(approvalCost_BN))
    }

    let BobaApprovalAmount = await this.L2BillingContract.exitFee()

    //in some cases zero not allowed
    const tx2 = await this.L2LPContract
      .connect(this.provider.getSigner())
      .populateTransaction
      .clientDepositL2(
        currencyAddress === allAddresses.L2_BOBA_Address ? '1' : '0', //ETH does not allow zero
        currencyAddress,
        currencyAddress === allAddresses.L2_BOBA_Address ? {value : BobaApprovalAmount.add('1')} : {value : BobaApprovalAmount}
      )

    const depositGas_BN = await this.L2Provider.estimateGas({...tx2, from: this.gasEstimateAccount})

    let l1SecurityFee = BigNumber.from('0')
    if (this.networkGateway === 'mainnet') {
      delete tx2.from
      l1SecurityFee = await this.gasOracleContract.getL1Fee(
        utils.serializeTransaction(tx2)
      )
      // We can't correctly calculate the final l1 securifty fee,
      // so we increase it by 1.1X to make sure that users have
      // enough balance to cover it
      l1SecurityFee = l1SecurityFee.mul('11').div('10')
      console.log("l1Security fee (ETH)", l1SecurityFee.toString())
    }

    const depositCost_BN = depositGas_BN.mul(gasPrice).add(l1SecurityFee)
    console.log("Fast exit cost (ETH):", utils.formatEther(depositCost_BN))

    //returns total cost in ETH
    return utils.formatEther(depositCost_BN.add(approvalCost_BN))
  }

  /* Estimate cost of Fast Deposit to L2 */
  async getFastDepositCost(currencyAddress) {

    let approvalCost_BN = BigNumber.from('0')

    const gasPrice = await this.L1Provider.getGasPrice()
    console.log("Fast deposit gas price", gasPrice.toString())

    if( currencyAddress !== allAddresses.L1_ETH_Address ) {

      const ERC20Contract = new ethers.Contract(
        currencyAddress,
        L2ERC20Json.abi, //any old abi will do...
        this.provider.getSigner()
      )

      const tx = await ERC20Contract.populateTransaction.approve(
        allAddresses.L1LPAddress,
        utils.parseEther('1.0')
      )

      const approvalGas_BN = await this.L1Provider.estimateGas(tx)
      approvalCost_BN = approvalGas_BN.mul(gasPrice)
      console.log("Approve cost in ETH:", utils.formatEther(approvalCost_BN))
    }

    //in some cases zero not allowed
    const tx2 = await this.L1LPContract
      .connect(this.provider.getSigner()).populateTransaction.clientDepositL1(
        currencyAddress === allAddresses.L1_ETH_Address ? '1' : '0', //ETH does not allow zero
        currencyAddress,
        currencyAddress === allAddresses.L1_ETH_Address ? { value : '1'} : {}
      )

    const depositGas_BN = await this.L1Provider.estimateGas(tx2)
    console.log("Fast deposit gas", depositGas_BN.toString())

    const depositCost_BN = depositGas_BN.mul(gasPrice)
    console.log("Fast deposit cost (ETH):", utils.formatEther(depositCost_BN))

    //returns total cost in ETH
    return utils.formatEther(depositCost_BN.add(approvalCost_BN))
  }

  /* Estimate cost of Fast Deposit to L2 */
  async getFastDepositBatchCost(tokenList) {

    if (tokenList.length === 0) return 0

    let approvalCost_BN = BigNumber.from('0')
    let payload = [], ETHValue = BigNumber.from('0')

    const gasPrice = await this.L1Provider.getGasPrice()
    console.log("Fast deposit gas price", gasPrice.toString())

    // We use BOBA as an example
    const ERC20Contract = new ethers.Contract(
      this.tokenAddresses['BOBA'].L1,
      L2ERC20Json.abi, //any old abi will do...
      this.provider.getSigner()
    )

    const tx = await ERC20Contract.populateTransaction.approve(
      allAddresses.L1LPAddress,
      utils.parseEther('0')
    )

    for (const tokenName of tokenList) {
      if (tokenName !== 'ETH') {
        const approvalGas_BN = await this.L1Provider.estimateGas(tx)
        approvalCost_BN = approvalCost_BN.add(approvalGas_BN.mul(gasPrice))
        payload.push({l1TokenAddress: this.tokenAddresses['BOBA'].L1, amount: utils.parseEther('0.0001')})
      } else {
        ETHValue = utils.parseEther('0.0001')
        payload.push({l1TokenAddress: L1_ETH_Address, amount: utils.parseEther('0.0001')})
      }
    }

    console.log("Approve cost in ETH:", utils.formatEther(approvalCost_BN))

    const fastDepositBatchTx = await this.L1LPContract
      .connect(this.L1Provider).populateTransaction.clientDepositL1Batch(
        payload, { value: ETHValue, from: '0x5E7a06025892d8Eef0b5fa263fA0d4d2E5C3B549' }
      )
    const depositGas_BN = await this.L1Provider.estimateGas(fastDepositBatchTx)
    console.log("Fast batch deposit gas", depositGas_BN.toString())

    const depositCost_BN = depositGas_BN.mul(gasPrice)
    console.log("Fast batch deposit cost (ETH):", utils.formatEther(depositCost_BN))

    //returns total cost in ETH
    return utils.formatEther(depositCost_BN.add(approvalCost_BN))
  }

  /**************************************************************/
  /***** SWAP OFF from BOBA by depositing funds to the L2LP *****/
  /**************************************************************/
  async fastExitAll(currencyAddress) {

    updateSignatureStatus_exitLP(false)

    let approvalGas_BN = BigNumber.from('0')
    let approvalCost_BN = BigNumber.from('0')
    let balance_BN = BigNumber.from('0')

    let gasPrice = await this.L2Provider.getGasPrice()
    console.log("Fast exit gas price", gasPrice.toString())

    if( currencyAddress === allAddresses.L2_BOBA_Address ) {
      balance_BN = await this.L2Provider.getBalance(this.account)
    }

    const L2BillingContract = new ethers.Contract(
      allAddresses.Proxy__BobaBillingContract,
      L2BillingContractJson.abi,
      this.L2Provider,
    )
    let BobaExitFee = await L2BillingContract.exitFee()

    try {
      // Approve other tokens
      if( currencyAddress !== allAddresses.L2_BOBA_Address &&
        utils.getAddress(currencyAddress) !== utils.getAddress(allAddresses.TK_L2BOBA)
      ) {
        const L2ERC20Contract = new ethers.Contract(
          currencyAddress,
          L2ERC20Json.abi,
          this.provider.getSigner()
        )

        balance_BN = await L2ERC20Contract.balanceOf(
          this.account
        )
        console.log("Initial Balance:", utils.formatEther(balance_BN))

        let allowance_BN = await L2ERC20Contract.allowance(
          this.account,
          allAddresses.L2LPAddress
        )
        console.log("Allowance:",utils.formatEther(allowance_BN))

        if (balance_BN.gt(allowance_BN)) {

          //Estimate gas
          const tx = await L2ERC20Contract.populateTransaction.approve(
            allAddresses.L2LPAddress,
            balance_BN
          )

          approvalGas_BN = await this.L2Provider.estimateGas(tx)
          approvalCost_BN = approvalGas_BN.mul(gasPrice)
          console.log("Cost to Approve (ETH):", utils.formatEther(approvalCost_BN))

          const approveStatus = await L2ERC20Contract.approve(
            allAddresses.L2LPAddress,
            balance_BN
          )
          await approveStatus.wait()

          if (!approveStatus)
            return false

        } else {
          console.log("Allowance already suitable:", utils.formatEther(allowance_BN))
        }

      }

      const tx2 = await this.L2LPContract
        .connect(this.provider.getSigner()).populateTransaction.clientDepositL2(
          balance_BN,
          currencyAddress,
          currencyAddress === allAddresses.L2_BOBA_Address ? { value : BobaExitFee.add(balance_BN) } : { value: BobaExitFee}
        )

      let depositGas_BN = await this.L2Provider.estimateGas(tx2)

      let l1SecurityFee = BigNumber.from('0')
      if (this.networkGateway === 'mainnet') {
        delete tx2.from
        l1SecurityFee = await this.gasOracleContract.getL1Fee(
          utils.serializeTransaction(tx2)
        )
        // We can't correctly calculate the final l1 securifty fee,
        // so we increase it by 1.1X to make sure that users have
        // enough balance to cover it
        l1SecurityFee = l1SecurityFee.mul('11').div('10')
        console.log("l1Security fee (ETH)", l1SecurityFee.toString())
      }

      console.log("Deposit gas", depositGas_BN.toString())
      let depositCost_BN = depositGas_BN.mul(gasPrice).add(l1SecurityFee)
      console.log("Deposit gas cost (ETH)", utils.formatEther(depositCost_BN))

      if(currencyAddress === allAddresses.L2_BOBA_Address) {
        //if fee token, need to consider cost to exit
        balance_BN = balance_BN.sub(depositCost_BN)
      }

      const ccBal = await this.L2Provider.getBalance(this.account)

      console.log("Balance:", utils.formatEther(ccBal))
      console.log("Cost to exit:", utils.formatEther(depositCost_BN))
      console.log("Amount to exit:", utils.formatEther(balance_BN))
      console.log("Should be zero (if exiting ETH):", ccBal.sub(balance_BN.add(depositCost_BN)).toString())

      const time_start = new Date().getTime()
      console.log("TX start time:", time_start)

      const depositTX = await this.L2LPContract
        .connect(this.provider.getSigner()).clientDepositL2(
          balance_BN,
          currencyAddress,
          currencyAddress === allAddresses.L2_BOBA_Address ? { value : balance_BN.sub(depositCost_BN) } : {}
        )

      //at this point the tx has been submitted, and we are waiting...
      await depositTX.wait()

      const block = await this.L2Provider.getTransaction(depositTX.hash)
      console.log(' block:', block)

      //closes the modal
      updateSignatureStatus_exitLP(true)

      // const opts = {
      //   fromBlock: -4000
      // }
      // const receipt = await this.fastWatcher.waitForMessageReceipt(depositTX, opts)
      // console.log(' completed Deposit! L1 tx hash:', receipt.transactionHash)

      // const time_stop = new Date().getTime()
      // console.log("TX finish time:", time_stop)

      // const data = {
      //   "key": process.env.REACT_APP_SPEED_CHECK,
      //   "hash": depositTX.hash,
      //   "l1Tol2": false, //since we are going L2->L1
      //   "startTime": time_start,
      //   "endTime": time_stop,
      //   "block": block.blockNumber,
      //   "cdmHash": receipt.transactionHash,
      //   "cdmBlock": receipt.blockNumber
      // }

      // console.log("Speed checker data payload:", data)

      // const speed = await omgxWatcherAxiosInstance(
      //   this.networkGateway
      // ).post('send.crossdomainmessage', data)

      // console.log("Speed checker:", speed)

      return true
    } catch (error) {
      console.log("NS: fastExitAll error:", error)
      return error
    }
  }

  /**************************************************************/
  /***** SWAP OFF from BOBA by depositing funds to the L2LP *****/
  /**************************************************************/
  async depositL2LP(currencyAddress, value_Wei_String) {

    updateSignatureStatus_exitLP(false)

    console.log("depositL2LP currencyAddress",currencyAddress)

    const L2BillingContract = new ethers.Contract(
      allAddresses.Proxy__BobaBillingContract,
      L2BillingContractJson.abi,
      this.L2Provider,
    )
    let BobaExitFee = await L2BillingContract.exitFee()

    try {
      // Approve other tokens
      if( currencyAddress !== allAddresses.L2_BOBA_Address &&
        utils.getAddress(currencyAddress) !== utils.getAddress(allAddresses.TK_L2BOBA)
      ) {

        const L2ERC20Contract = new ethers.Contract(
          currencyAddress,
          L2ERC20Json.abi,
          this.provider.getSigner()
        )

        let allowance_BN = await L2ERC20Contract.allowance(
          this.account,
          allAddresses.L2LPAddress
        )

        let depositAmount_BN = BigNumber.from(value_Wei_String)

        if (depositAmount_BN.gt(allowance_BN)) {
          const approveStatus = await L2ERC20Contract.approve(
            allAddresses.L2LPAddress,
            value_Wei_String
          )
          await approveStatus.wait()
          if (!approveStatus) return false
        }
      }

      const time_start = new Date().getTime()
      console.log("TX start time:", time_start)

      const depositTX = await this.L2LPContract
        .connect(this.provider.getSigner()).clientDepositL2(
          value_Wei_String,
          currencyAddress,
          currencyAddress === allAddresses.L2_BOBA_Address ? { value: BobaExitFee.add(value_Wei_String) } : { value: BobaExitFee }
        )

      //at this point the tx has been submitted, and we are waiting...
      await depositTX.wait()

      const block = await this.L2Provider.getTransaction(depositTX.hash)
      console.log(' block:', block)

      //closes the modal
      updateSignatureStatus_exitLP(true)

      // const opts = {
      //   fromBlock: -4000
      // }
      // const receipt = await this.fastWatcher.waitForMessageReceipt(depositTX, opts)
      // console.log(' completed Deposit! L1 tx hash:', receipt.transactionHash)

      // const time_stop = new Date().getTime()
      // console.log("TX finish time:", time_stop)

      // const data = {
      //   "key": process.env.REACT_APP_SPEED_CHECK,
      //   "hash": depositTX.hash,
      //   "l1Tol2": false, //since we are going L2->L1
      //   "startTime": time_start,
      //   "endTime": time_stop,
      //   "block": block.blockNumber,
      //   "cdmHash": receipt.transactionHash,
      //   "cdmBlock": receipt.blockNumber
      // }

      // console.log("Speed checker data payload:", data)

      // const speed = await omgxWatcherAxiosInstance(
      //   this.networkGateway
      // ).post('send.crossdomainmessage', data)

      // console.log("Speed checker:", speed)

      return true
    } catch (error) {
      console.log("NS: depositL2LP error:", error)
      return error
    }
  }

  /***********************************************/
  /*****         DAO Functions               *****/
  /***********************************************/

  // get DAO Balance
  async getDaoBalance() {

    if( !this.BobaContract ) return

    if( !this.account ) {
      console.log('NS: getDaoBalance() error - called but account === null')
      return
    }

    try {
      let balance = await this.BobaContract.balanceOf(this.account)
      return { balance: formatEther(balance) }
    } catch (error) {
      console.log('Error: getDaoBalance', error)
      return error
    }
  }

  async getDaoBalanceX() {

    if( !this.xBobaContract ) return

    if( !this.account ) {
      console.log('NS: getDaoBalanceX() error - called but account === null')
      return
    }

    try {
      let balance = await this.xBobaContract.balanceOf(this.account)
      return { balanceX: formatEther(balance) }
    } catch (error) {
      console.log('Error: getDaoBalanceX', error)
      return error
    }
  }

  // get DAO Votes
  async getDaoVotes() {

    if( !this.BobaContract ) return

    if( !this.account ) {
      console.log('NS: getDaoVotes() error - called but account === null')
      return
    }

    try {
      let votes = await this.BobaContract.getCurrentVotes(this.account)
      return { votes: formatEther(votes) }
    } catch (error) {
      console.log('NS: getDaoVotes error:', error)
      return error
    }
  }

    // get DAO Votes
  async getDaoVotesX() {

    if( !this.xBobaContract ) return

    if( !this.account ) {
      console.log('NS: getDaoVotesX() error - called but account === null')
      return
    }

    try {
      let votes = await this.xBobaContract.getCurrentVotes(this.account)
      return { votesX: formatEther(votes) }
    } catch (error) {
      console.log('NS: getDaoVotesX error:', error)
      return error
    }
  }

  //Transfer DAO Funds
  async transferDao({ recipient, amount }) {

    if( this.L1orL2 !== 'L2' ) return
    if( !this.BobaContract ) return

    if(!this.account) {
      console.log('NS: transferDao() error - called but account === null')
      return
    }

    try {
      const tx = await this.BobaContract
        .connect(this.provider.getSigner())
        .transfer(recipient, parseEther(amount.toString()))
      await tx.wait()
      return tx
    } catch (error) {
      console.log('NS: transferDao error:', error)
      return error
    }
  }

  //Delegate DAO Authority
  async delegateVotes({ recipient }) {

    if( this.L1orL2 !== 'L2' ) return
    if( !this.BobaContract ) return

    if(!this.account) {
      console.log('NS: delegateVotes() error - called but account === null')
      return
    }

    try {
      const tx = await this.BobaContract
        .connect(this.provider.getSigner())
        .delegate(recipient)
      await tx.wait()
      return tx
    } catch (error) {
      console.log('NS: delegateVotes error:', error)
      return error
    }
  }

  //Delegate DAO Authority
  async delegateVotesX({ recipient }) {

    if( this.L1orL2 !== 'L2' ) return
    if( !this.xBobaContract ) return

    if( !this.account ) {
      console.log('NS: delegateVotesX() error - called but account === null')
      return
    }

    try {
      const tx = await this.xBobaContract
        .connect(this.provider.getSigner())
        .delegate(recipient)
      await tx.wait()
      return tx
    } catch (error) {
      console.log('NS: delegateVotesX error:', error)
      return error
    }
  }

  // Proposal Create Threshold
  async getProposalThreshold() {

    if( !this.delegateContract ) return

    try {
      const delegateCheck = await this.delegateContract.attach(allAddresses.GovernorBravoDelegator)
      const rawThreshold = await delegateCheck.proposalThreshold()
      return { proposalThreshold: formatEther(rawThreshold) }
    } catch (error) {
      console.log('NS: getProposalThreshold error:', error)
      return error
    }
  }

  // Create Proposal
  /************************/
  /*****Old Dao Fix Me.****/
  /************************/
  // FIXME:
  async createProposal(payload) {

    if( this.L1orL2 !== 'L2' ) return
    if( !this.delegateContract ) return

    if( !this.account ) {
      console.log('NS: delegateVotesX() error - called but account === null')
      return
    }

    let signatures = ['']
    let value1 = 0
    let value2 = 0
    let value3 = 0
    let description = ''
    let address = ['']
    let callData = [ '' ]
    // FIXME: Ve DAO From here
    /*
      let tokenIds = payload.tokenIds
      // create proposal only on latest contracts.
      const delegateCheck = await this.delegateContract.attach(allAddresses.GovernorBravoDelegatorV2)

    */
    // FIXME: Ve DAO Till here

    const delegateCheck = await this.delegateContract.attach(allAddresses.GovernorBravoDelegator)

    if( payload.action === 'text-proposal' ) {
      address = ['0x000000000000000000000000000000000000dEaD']
      description = payload.text.slice(0, 252) //100+150+2
      callData = [
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      ]
    } else if ( payload.action === 'change-lp1-fee' ) {
      signatures = ['configureFeeExits(uint256,uint256,uint256)']
      value1 = Number(payload.value[0])
      value2 = Number(payload.value[1])
      value3 = Number(payload.value[2])
      description = `Change L1 LP Bridge fee to ${value1}, ${value2}, and ${value3} integer percent`
      address = [allAddresses.L2LPAddress]
      callData = [ethers.utils.defaultAbiCoder.encode(
        ['uint256','uint256','uint256'],
        [value1, value2, value3]
      )]
    } else if ( payload.action === 'change-lp2-fee' ) {
      address = [delegateCheck.address]
      signatures = ['configureFee(uint256,uint256,uint256)']
      value1 = Number(payload.value[0])
      value2 = Number(payload.value[1])
      value3 = Number(payload.value[2])
      description = `Change L2 LP Bridge fee to ${value1}, ${value2}, and ${value3} integer percent`
      address = [allAddresses.L2LPAddress]
      callData = [ethers.utils.defaultAbiCoder.encode(
        ['uint256','uint256','uint256'],
        [value1, value2, value3]
      )]
    } else if ( payload.action === 'change-threshold' ) {
      address = [delegateCheck.address]
      signatures = ['_setProposalThreshold(uint256)']
      value1 = Number(payload.value[0])
      description = `Change Proposal Threshold to ${value1} BOBA`
      callData = [ethers.utils.defaultAbiCoder.encode(
        ['uint256'],
        [value1]
      )]
    }

    try {

      let values = [0] //amount of ETH to send, generally, zero

      let res = await delegateCheck
        .connect(this.provider.getSigner())
        .propose(
          address,
          values,
          signatures,
          callData,
          description
      )

      return res

    } catch (error) {
      console.log("NS: createProposal error:",error)
      return error
    }
  }

  //Fetch DAO Proposals
  /**
   * Supporting the old (boba, xboba) and new proposals (govBoba / veNft) based.
   * group created proposals by `to` and make use of respective contract to prepare the proposal data list.
   *
  */
  // Use this proposal fetch for veDao.
  async fetchProposalsVeDao() {

    if (!this.delegateContract || this.networkGateway === 'goerli') return

    const delegateCheckV1 = await this.delegateContract.attach(allAddresses.GovernorBravoDelegator)
    const delegateCheckV2 = await this.delegateContract.attach(allAddresses.GovernorBravoDelegatorV2)

    try {

      let proposalList = []
      /// @notice An event emitted when a new proposal is create
      // event ProposalCreated(uint id, address proposer, address[] targets, uint[] values, string[] signatures, bytes[] calldatas, uint startTimestamp, uint endTimestamp, string description);

      const descriptionList = await GraphQLService.queryBridgeProposalCreated()
      const proposalGroup = groupBy(descriptionList.data.governorProposalCreateds, 'to');
      const delegatorList = [ allAddresses.GovernorBravoDelegator, allAddresses.GovernorBravoDelegatorV2 ];

      for (let delegator of delegatorList) {
        let delegateCheck;
        if (delegator === allAddresses.GovernorBravoDelegator) {
          delegateCheck = delegateCheckV1;
        } else if(delegator === allAddresses.GovernorBravoDelegatorV2) {
          delegateCheck = delegateCheckV2;
        }
        const proposals = proposalGroup[ delegator.toLowerCase() ]
        const proposalCounts = await delegateCheck.proposalCount()
        const totalProposals = await proposalCounts.toNumber()

        for (let i = 0; i < totalProposals; i++) {
          const proposalRaw = proposals[i]

          if (typeof (proposalRaw) === 'undefined') continue

          let proposalID = proposalRaw.proposalId

          let proposalData = await delegateCheck.proposals(proposalID)

          const proposalStates = [
            'Pending',
            'Active',
            'Canceled',
            'Defeated',
            'Succeeded',
            'Queued',
            'Expired',
            'Executed',
          ]

          let state = await delegateCheck.state(proposalID)

          let againstVotes = parseInt(formatEther(proposalData.againstVotes))
          let forVotes = parseInt(formatEther(proposalData.forVotes))
          let abstainVotes = parseInt(formatEther(proposalData.abstainVotes))

          let proposal = await delegateCheck.getActions(i+2)

          let description = proposalRaw.description.toString()

          proposalList.push({
             id: proposalID.toString(),
             proposal,
             description,
             totalVotes: forVotes + againstVotes,
             forVotes,
             againstVotes,
             abstainVotes,
             state: proposalStates[state],
             startTimestamp : proposalRaw.startTimestamp,
             endTimestamp: proposalRaw.endTimestamp,
          })
        }
      }

      // hasLive proposal only checking for GovernorBravoDelegatorV2 contracts
      let hasLiveProposal = false

      if (this.account) {
        const latestProposalIdRaw = await delegateCheckV2.latestProposalIds(this.account);
        const latestProposalId = await latestProposalIdRaw.toNumber();
        if (latestProposalId) { /// only if proposalId greater than 0
          const latestProposalState = await delegateCheckV2.state(latestProposalId);
          hasLiveProposal = [ 0, 1 ].includes(latestProposalState) /// pending & active proposal check.
        }
      }

      return {
        proposalList,
        hasLiveProposal
      }
    } catch (error) {
      console.log("NS: fetchProposals error:",error)
      return error
    }
  }

  // to check wether the token has been already used for voting on proposal.
  async checkProposalVote(proposalId,tokenId) {
    if (!this.delegateContract) return

    try {
      const delegateCheck = await this.delegateContract.attach(allAddresses.GovernorBravoDelegatorV2)

      if (this.account) {
        const receipt = await delegateCheck.getReceipt(Number(proposalId), tokenId);
        return receipt;
      }

    } catch (error) {
      console.log('NS: checkProposalVote() error', error)
      return error;
    }
  }



  //Cast vote for proposal
  // FIXME: keeping this to refer in next release will cleanup.
  async castProposalVoteVeDao({id, userVote,tokenIds}) {

    if( !this.delegateContract ) return

    if( !this.account ) {
      console.log('NS: castProposalVote() error - called but account === null')
      return
    }

    try {
      const delegateCheck = await this.delegateContract
        .connect(this.provider.getSigner())
        .attach(allAddresses.GovernorBravoDelegatorV2)

      const res = await delegateCheck.castVote(id, userVote, tokenIds)

      return res;

    } catch (error) {
      console.log("NS: castProposalVote error:",error)
      return error
    }
  }

  async queueProposal(proposalID) {

    if( !this.delegateContract ) return

    if( !this.account ) {
      console.log('NS: queueProposal() error - called but account === null')
      return
    }

    try {
      const delegateCheck = await this.delegateContract
        .connect(this.provider.getSigner())
        .attach(allAddresses.GovernorBravoDelegator)
      let res = delegateCheck.queue(Number(proposalID))
      return res
    } catch(error) {
      console.log("NS: queueProposal error:",error)
      return error
    }

  }

  async executeProposal(proposalID) {

    if( !this.delegateContract ) return

    if( !this.account ) {
      console.log('NS: executeProposal() error - called but account === null')
      return
    }

    try {
      const delegateCheck = await this.delegateContract
        .connect(this.provider.getSigner())
        .attach(allAddresses.GovernorBravoDelegator)
      let res = delegateCheck.execute(Number(proposalID))
      return res
    } catch(error) {
      console.log("NS: executeProposal error:",error)
      return error
    }

  }

  /***********************************************/
  /*****       Fixed savings account         *****/
  /***********************************************/
  async addFS_Savings(value_Wei_String) {

    if(!this.account) {
      console.log('NS: withdrawFS_Savings() error - called but account === null')
      return
    }

    try {

      const FixedSavings = new ethers.Contract(
        allAddresses.BobaFixedSavings,
        L2SaveJson.abi,
        this.provider.getSigner()
      )

      console.log("FixedSavings.address:",FixedSavings.address)

      let allowance_BN = await this.BobaContract
        .connect(this.provider.getSigner())
        .allowance(
          this.account,
          allAddresses.BobaFixedSavings
        )
      console.log("Allowance:", allowance_BN.toString())

      let depositAmount_BN = BigNumber.from(value_Wei_String)
      console.log("Deposit:", depositAmount_BN)

      let approveAmount_BN = depositAmount_BN.add(BigNumber.from('1000000000000'))

      try {
        if (approveAmount_BN.gt(allowance_BN)) {
          console.log("Need to approve YES:", approveAmount_BN)
          const approveStatus = await this.BobaContract
            .connect(this.provider.getSigner())
            .approve(
              allAddresses.BobaFixedSavings,
              approveAmount_BN
            )
          const TX = await approveStatus.wait()
          console.log("approveStatus:", TX)
        }
        else {
          console.log("Allowance is sufficient:", allowance_BN.toString(), depositAmount_BN.toString())
        }
      } catch (error) {
        console.log("NS: addFS_Savings approve error:", error)
        return error
      }

      const TX = await FixedSavings.stake(value_Wei_String)
      await TX.wait()
      return TX
    } catch (error) {
      console.log("NS: addFS_Savings error:", error)
      return error
    }
  }

  async savingEstimate() {

    // used to generate gas estimates for contracts that cannot set amount === 0
    // to avoid need to approve amount

    let otherField = {
      from: this.gasEstimateAccount
    }

    const gasPrice_BN = await this.provider.getGasPrice()
    console.log("gas price", gasPrice_BN.toString())

    let approvalCost_BN = BigNumber.from('0')
    let stakeCost_BN = BigNumber.from('0')

    try {

      // first, we need the allowance of the benchmarkAccount
      let allowance_BN = await this.BobaContract
        .connect(this.provider)
        .allowance(
          this.gasEstimateAccount,
          allAddresses.BobaFixedSavings
        )
      console.log("benchmarkAllowance_BN",allowance_BN.toString())

      // second, we need the approval cost
      const tx1 = await this.BobaContract
        .connect(this.provider.getSigner())
        .populateTransaction
        .approve(
          allAddresses.BobaFixedSavings,
          allowance_BN.toString(),
        )

      const approvalGas_BN = await this.provider.estimateGas(tx1)
      approvalCost_BN = approvalGas_BN.mul(gasPrice_BN)
      console.log("Approve cost in ETH:", utils.formatEther(approvalCost_BN))

      // third, we need the stake cost
      const FixedSavings = new ethers.Contract(
        allAddresses.BobaFixedSavings,
        L2SaveJson.abi,
        this.provider
      )

      const tx2 = await FixedSavings
        .populateTransaction
        .stake(
          allowance_BN.toString(),
          otherField
        )
      const stakeGas_BN = await this.provider.estimateGas(tx2)
      stakeCost_BN = stakeGas_BN.mul(gasPrice_BN)
      console.log("Stake cost in ETH:", utils.formatEther(stakeCost_BN))

      const safety_margin_BN = BigNumber.from('1000000000000')
      console.log("Stake safety margin:", utils.formatEther(safety_margin_BN))

      return approvalCost_BN.add(stakeCost_BN).add(safety_margin_BN)

    } catch (error) {
      console.log('NS: stakingEstimate() error', error)
      return error
    }
  }

  async withdrawFS_Savings(stakeID) {

    if(!this.account) {
      console.log('NS: withdrawFS_Savings() error - called but account === null')
      return
    }

    try {
      const FixedSavings = new ethers.Contract(
        allAddresses.BobaFixedSavings,
        L2SaveJson.abi,
        this.provider.getSigner()
      )
      const TX = await FixedSavings.unstake(stakeID)
      await TX.wait()
      return TX
    } catch (error) {
      console.log("NS: withdrawFS_Savings error:", error)
      return error
    }
  }

  async getFS_Saves() {

    if(this.account === null) {
      console.log('NS: getFS_Saves() error - called but account === null')
      return
    }

    try {
      const FixedSavings = new ethers.Contract(
        allAddresses.BobaFixedSavings,
        L2SaveJson.abi,
        this.L2Provider
      )
      await FixedSavings.l2Boba()
      let stakecount = await FixedSavings.personalStakeCount(this.account)
      return { stakecount: Number(stakecount) }
    } catch (error) {
      console.log('NS: getSaves error:', error)
      return error
    }
  }

  async estimateApprove() {

    const approvalAmount = utils.parseEther('10.0')
    let allowance_BN = null
    let approveStatus = null

    if(allAddresses.hasOwnProperty('BobaFixedSavings')) {
      allowance_BN = await this.BobaContract
        .connect(this.provider.getSigner())
        .allowance(
          this.account,
          allAddresses.BobaFixedSavings
        )
      console.log("Fixed Savings Allowance", allowance_BN.toString())

      approveStatus = await this.BobaContract
        .connect(this.provider.getSigner())
        .approve(
          allAddresses.BobaFixedSavings,
          approvalAmount
        )
      await approveStatus.wait()
      console.log("Fixed Savings Approval", approveStatus)
    }

    if(allAddresses.hasOwnProperty('DiscretionaryExitFee')) {
      allowance_BN = await this.BobaContract
        .connect(this.provider.getSigner())
        .allowance(
          this.account,
          allAddresses.DiscretionaryExitFee
        )
      console.log("DiscretionaryExitFee Allowance", allowance_BN.toString())

      approveStatus = await this.BobaContract
        .connect(this.provider.getSigner())
        .approve(
          allAddresses.DiscretionaryExitFee,
          approvalAmount
        )
      await approveStatus.wait()
      console.log("DiscretionaryExitFee Approval", approveStatus)
    }

    if(allAddresses.hasOwnProperty('L2LPAddress')) {
      allowance_BN = await this.BobaContract
        .connect(this.provider.getSigner())
        .allowance(
          this.account,
          allAddresses.L2LPAddress
        )
      console.log("L2LP", allowance_BN.toString())

      approveStatus = await this.BobaContract
        .connect(this.provider.getSigner())
        .approve(
          allAddresses.L2LPAddress,
          approvalAmount
        )
      await approveStatus.wait()
      console.log("L2LP", approveStatus)
    }

  }

  async getFS_Info() {

    if(this.account === null) {
      console.log('NS: getFS_Info() error - called but account === null')
      return
    }

    try {

      const FixedSavings = new ethers.Contract(
        allAddresses.BobaFixedSavings,
        L2SaveJson.abi,
        this.L2Provider
      )

      let stakeInfo = []

      const stakeCounts = await FixedSavings.personalStakeCount(this.account)

      for (let i = 0; i < stakeCounts; i++) {

        const stakeId = await FixedSavings.personalStakePos(this.account, i)
        const stakeData = await FixedSavings.stakeDataMap(stakeId)

        stakeInfo.push({
          stakeId: Number(stakeId.toString()),
          depositTimestamp: Number(stakeData.depositTimestamp.toString()),
          depositAmount: logAmount(stakeData.depositAmount.toString(), 18),
          isActive: stakeData.isActive
        })

      }
      return { stakeInfo }
    } catch (error) {
      console.log("NS: getFS_Info error:",error)
      return error
    }

  }

  /***********************************************/
  /*****            L1 Security Fee          *****/
  /***********************************************/
  async estimateL1SecurityFee(payload=this.payloadForL1SecurityFee) {
    const deepCopyPayload = { ...payload }
    delete deepCopyPayload.from
    // Gas oracle
    this.gasOracleContract = new ethers.Contract(
      L2GasOracle,
      OVM_GasPriceOracleJson.abi,
      this.L2Provider
    )
    const l1SecurityFee = await this.gasOracleContract.getL1Fee(
      ethers.utils.serializeTransaction(deepCopyPayload)
    )
    return l1SecurityFee.toNumber()
  }

  /***********************************************/
  /*****                L2 Fee              *****/
  /***********************************************/
  async estimateL2Fee(payload=this.payloadForL1SecurityFee) {
    const l2GasPrice = await this.L2Provider.getGasPrice()
    const l2GasEstimate = await this.L2Provider.estimateGas(payload)
    return l2GasPrice.mul(l2GasEstimate).toNumber()
  }

  /***********************************************/
  /*****          L2 LP BATCH INFO           *****/
  /***********************************************/
  async getL2UserAndLPBalanceBatch(tokenList) {
    const getInfo = async (l1TokenAddress, l2TokenAddress) => {
      const payload = []
      // get fee info
      payload.push(this.getL2UserRewardFeeRate(l2TokenAddress))
      // get LP balance
      payload.push(this.L2LPBalance(l2TokenAddress))
      // get LP liquidity
      payload.push(this.L2LPLiquidity(l2TokenAddress))
      return await Promise.all(payload)
    }

    const payload = {}
    const layer1 = store.getState().balance.layer1
    for (const tokenName of tokenList) {
      if (tokenName === 'ETH') {
        const [l2LPFeeRate, l2LPBalance, l2Liquidity] = await getInfo(L1_ETH_Address, L2_BOBA_Address)
        const filteredBalance = layer1.filter(i => i.symbol === tokenName)[0]
        payload['ETH'] = {
          l2LPFeeRate, l2LPBalanceInWei: l2LPBalance, l2LPBalance: utils.formatUnits(BigNumber.from(l2LPBalance), filteredBalance.decimals),
          balanceInWEI: filteredBalance.balance,
          balance: utils.formatUnits(BigNumber.from(filteredBalance.balance.toString()), filteredBalance.decimals),
          decimals: filteredBalance.decimals, address: filteredBalance.address,
          LPRatio:
            Number(utils.formatUnits(BigNumber.from(l2LPBalance), filteredBalance.decimals)) > 0 ?
            (Number(utils.formatUnits(BigNumber.from(l2LPBalance), filteredBalance.decimals)) /
            Number(utils.formatUnits(BigNumber.from(l2Liquidity), filteredBalance.decimals))).toFixed(3): 0
        }
      } else if (tokenName) {
        const l1TokenAddress = this.tokenAddresses[tokenName].L1
        const l2TokenAddress = this.tokenAddresses[tokenName].L2
        const [l2LPFeeRate, l2LPBalance, l2Liquidity] = await getInfo(l1TokenAddress, l2TokenAddress)
        const filteredBalance = layer1.filter(i => i.symbol === tokenName)[0]
        payload[tokenName] = {
          l2LPFeeRate, l2LPBalanceInWei: l2LPBalance, l2LPBalance: utils.formatUnits(BigNumber.from(l2LPBalance), filteredBalance.decimals),
          balanceInWEI: filteredBalance.balance,
          balance: utils.formatUnits(BigNumber.from(filteredBalance.balance.toString()), filteredBalance.decimals),
          decimals: filteredBalance.decimals, address: filteredBalance.address,
          LPRatio:
            Number(utils.formatUnits(BigNumber.from(l2LPBalance), filteredBalance.decimals)) > 0 ?
            (Number(utils.formatUnits(BigNumber.from(l2LPBalance), filteredBalance.decimals)) /
            Number(utils.formatUnits(BigNumber.from(l2Liquidity), filteredBalance.decimals))).toFixed(3): 0
        }
      }
    }
    return payload
  }

  /***********************************************/
  /*****              Exit fee               *****/
  /***********************************************/
  async getExitFeeFromBillingContract() {
    const L2BillingContract = new ethers.Contract(
      allAddresses.Proxy__BobaBillingContract,
      L2BillingContractJson.abi,
      this.L2Provider,
    )
    return ethers.utils.formatEther(await L2BillingContract.exitFee())
  }


  /***********************************************/
  /*****            Boba Bridges             *****/
  /***********************************************/

  getTokenSpecificBridges(tokenSymbol) {
    return bobaBridges.filter((bridge) => bridge.tokens.includes(tokenSymbol))
  }

  /***********************************************/
  /*****              VeBoba                 *****/
  /***********************************************/


  /**
   * CreateLock
   *  - to create veboba lock
   */
  async createLock({
    value_Wei_String,
    lock_duration
  }) {
    if (!this.account) {
      console.log('NS: createLock() error - called but account === null');
      return
    }

    try {
      const ve = new ethers.Contract(
        allAddresses.Ve_BOBA,
        veJson.abi,
        this.provider.getSigner()
      )

      let allowance_BN = await this.BobaContract
        .connect(this.provider.getSigner())
        .allowance(
          this.account,
          allAddresses.Ve_BOBA
        )

      let depositAmount_BN = BigNumber.from(value_Wei_String)

      let approveAmount_BN = depositAmount_BN.add(BigNumber.from('1000000000000'))

      try {
        if (approveAmount_BN.gt(allowance_BN)) {
          const approveStatus = await this.BobaContract
            .connect(this.provider.getSigner())
            .approve(
              allAddresses.Ve_BOBA,
              approveAmount_BN
            )
          const TX = await approveStatus.wait()
          console.log("approveStatus:", TX)
        }
        else {
          console.log("Allowance is sufficient:", allowance_BN.toString(), depositAmount_BN.toString())
        }
      } catch (error) {
        console.log("NS: ve:lock approve error:", error)
        return error
      }

      const TX = await ve.create_lock(value_Wei_String, lock_duration)
      await TX.wait()
      return TX

    } catch (error) {
      console.log("NS: Ve: createLock error:", error)
      return error;
    }
  }

  /**
   * withdrawLock
   *  - To withdraw existing expired lock
   */
  async withdrawLock({tokenId}) {
    if(!this.account) {
      console.log('NS: withdrawLock() error - called but account === null')
      return
    }

    try {
      const ve = new ethers.Contract(
        allAddresses.Ve_BOBA, //check ve address is present
        veJson.abi,
        this.provider.getSigner()
      )

      const TX = await ve.withdraw(tokenId)
      await TX.wait()
      return TX
     } catch (error) {
        console.log("NS: Ve: withdrawLock error:",error)
       return error;
     }
  }

  /**
   * increaseLockAmount
   *  - To increse amount of existing lock
   */
  async increaseLockAmount({
    tokenId, value_Wei_String
  }) {
    if(this.account === null) {
      console.log('NS: increaseLockAmount() error - called but account === null')
      return
    }
     try {
      const ve = new ethers.Contract(
        allAddresses.Ve_BOBA, //check ve address is present
        veJson.abi,
        this.provider.getSigner()
      )

      let allowance_BN = await this.BobaContract
      .connect(this.provider.getSigner())
      .allowance(
        this.account,
        allAddresses.Ve_BOBA
      )

      let depositAmount_BN = BigNumber.from(value_Wei_String)

      let approveAmount_BN = depositAmount_BN.add(BigNumber.from('1000000000000'))

      try {
        if (approveAmount_BN.gt(allowance_BN)) {
          const approveStatus = await this.BobaContract
            .connect(this.provider.getSigner())
            .approve(
              allAddresses.Ve_BOBA,
              approveAmount_BN
            )
          await approveStatus.wait()
        }
        else {
          console.log("Allowance is sufficient:", allowance_BN.toString(), depositAmount_BN.toString())
        }
      } catch (error) {
        console.log("NS: ve:increaseLockAmount approve error:", error)
        return error
      }

      const TX = await ve.increase_amount(tokenId, value_Wei_String)
      await TX.wait()
      return TX
     } catch (error) {
        console.log("NS: Ve: increaseLockAmount error:",error)
       return error;
     }
  }

  /**
   * extendLockTime
   *  - To extend lock time of existing lock
   */
  async extendLockTime({
    tokenId, lock_duration
  }) {

    if(this.account === null) {
      console.log('NS: increaseUnlockTime() error - called but account === null')
      return
    }

    try {
      const ve = new ethers.Contract(
        allAddresses.Ve_BOBA, //check ve address is present
        veJson.abi,
        this.provider.getSigner()
      )

      const TX = await ve.increase_unlock_time(tokenId, lock_duration)
      await TX.wait()
      return TX

     } catch (error) {
        console.log("NS: Ve: extendLockTime error:",error)
       return error;
     }
  }

  /**
   * fetchLockRecords
   *  - To to fetch list of existing lock records.
   */
   async fetchLockRecords() {
    if (this.account === null) {
      console.log('NS: fetchLockRecords() error - called but account === null')
      return
    }

    try {

      const ve = new ethers.Contract(
        allAddresses.Ve_BOBA, //check ve address is present
        veJson.abi,
        this.provider
      )

      const baseVoter = new ethers.Contract(
        allAddresses.BASE_V1_VOTER,
        voterJson.abi,
        this.provider
      )

      let tokenIdList = [];
      let balanceInfo = [];
      let nftCount = await ve.balanceOf(this.account)

      for (let index = 0; index < Number(nftCount); index++) {
        const tokenId = await ve.tokenOfOwnerByIndex(this.account, index)
        tokenIdList.push(Number(tokenId))
      }

      for (let tokenId of tokenIdList) {
        const balance = await ve.balanceOfNFT(tokenId);
        const locked = await ve.locked(tokenId);
        const usedWeights = await baseVoter.usedWeights(tokenId);


        balanceInfo.push({
          tokenId,
          balance: Number(utils.formatUnits(balance, 18)),
          lockedAmount: Number(utils.formatUnits(locked.amount, 18)),
          expiry: new Date(locked.end.toString() * 1000),
          expirySeconds: locked.end.toString() * 1000,
          usedWeights: Number(utils.formatUnits(usedWeights, 18))
        })
      }

      return {
        records: balanceInfo,
      }
    } catch (error) {
      console.log("NS: Ve: fetchLockRecords error:", error)
      return error;
    }
  }


  /*************************************************
   **************** Alt L1 Functions ***************
   *************************************************/

  /**
   * Get Cross Chain Deposit Fee
   * @getAltL1DepositFee
   *   - as of now we are just supporting BOBA so no need to check for other tokens.
  */


  async getAltL1DepositFee() {
    if (this.account === null) {
      console.log('NS: depositErc20ToL1() error - called but account === null')
      return
    }
    try {
      const pResponse = this.supportedAltL1Chains.map(async (type) => {
        let L0_ETH_ENDPOINT = allAddresses.Layer_Zero_Endpoint;
        let ETH_L1_BOBA_ADDRESS = allAddresses[`${type}_TK_BOBA`];
        let L0_TARGET_CHAIN_ID = allAddresses.layerZeroTargetChainID;
        let ALT_L1_BOBA_ADDRESS = allAddresses.Eth_TK_BOBA;
        let PROXY_ETH_L1_BRIDGE_ADDRESS_TO = allAddresses[`Proxy__${type}BridgeToEth`];

        // Layer zero doesn't support moonbase
        // return 0 for those bridges that haven't been implemented yet
        if (typeof ALT_L1_BOBA_ADDRESS === 'undefined' || typeof PROXY_ETH_L1_BRIDGE_ADDRESS_TO === 'undefined') {
          return {type, fee: '0' }
        }

        const Proxy__EthBridge = new ethers.Contract(
          PROXY_ETH_L1_BRIDGE_ADDRESS_TO,
          AltL1BridgeJson.abi,
          this.provider.getSigner()
        );

        const ETHLayzerZeroEndpoint = new ethers.Contract(
          L0_ETH_ENDPOINT,
          LZEndpointMockJson.abi,
          this.provider.getSigner()
        );

        const payload = ethers.utils.defaultAbiCoder.encode(
          [ "address", "address", "address", "address", "uint256", "bytes" ],
          [
            ETH_L1_BOBA_ADDRESS,
            ALT_L1_BOBA_ADDRESS,
            this.account,
            this.account,
            ethers.utils.parseEther('1'),
            "0x",
          ]
        );

        console.log(`🆙 loading 💵 FEE for ${type}`);
        console.log("L0_TARGET_CHAIN_ID: ", L0_TARGET_CHAIN_ID)
        const estimatedFee = await ETHLayzerZeroEndpoint.estimateFees(
          L0_TARGET_CHAIN_ID,
          Proxy__EthBridge.address,
          payload,
          false,
          "0x"
        );
        console.log(`💵 FEE for ${type} => ${ethers.utils.formatEther(estimatedFee._nativeFee)}`);

        return { type, ...estimatedFee, fee: ethers.utils.formatEther(estimatedFee._nativeFee) }
      })
      const fees = await Promise.all(pResponse);
      let result = {};
      fees.forEach((fee) => result[ fee.type ] = fee);
      return result

    } catch (error) {
      console.log('NS: getAltL1DepositFee() error - called but account === null')
      return error
    }
  }

   /**
   * Multichain Deposit to alt l1s Only support boba as of now.
   *
  */

  async depositErc20ToL1({
    value,
    type
  }) {
    if (this.account === null) {
      console.log('NS: depositErc20ToL1() error - called but account === null')
      return
    }
    try {
      let L0_ETH_ENDPOINT = allAddresses.Layer_Zero_Endpoint;
      let L0_TARGET_CHAIN_ID = allAddresses.layerZeroTargetChainID;
      let ETH_L1_BOBA_ADDRESS = allAddresses[`${type}_TK_BOBA`];
      let ALT_L1_BOBA_ADDRESS = allAddresses.Eth_TK_BOBA;
      let PROXY_ETH_L1_BRIDGE_ADDRESS_TO = allAddresses[`Proxy__${type}BridgeToEth`];
      /* proxy eth bridge contract */
      const Proxy__EthBridge = new ethers.Contract(
        PROXY_ETH_L1_BRIDGE_ADDRESS_TO,
        AltL1BridgeJson.abi,
        this.provider.getSigner()
      );

      /* eth boba bridge contract */
      const EthBOBA = new ethers.Contract(
        ETH_L1_BOBA_ADDRESS,
        L2StandardERC20Json.abi,
        this.provider
      );

      /* L0 endpoint contract*/
      const ETHLayzerZeroEndpoint = new ethers.Contract(
        L0_ETH_ENDPOINT,
        LZEndpointMockJson.abi,
        this.provider.getSigner()
      );

      let approveTx = await EthBOBA
        .connect(this.provider.getSigner())
        .approve(
        Proxy__EthBridge.address,
        ethers.utils.parseEther(value)
      );

      console.log(`⏲  Waiting for approval`)

      await approveTx.wait();

      console.log(`✅  approval done`)

      let payload = ethers.utils.defaultAbiCoder.encode(
        ["address", "address", "address", "address", "uint256", "bytes"],
        [
          ETH_L1_BOBA_ADDRESS,
          ALT_L1_BOBA_ADDRESS,
          this.account,
          this.account,
          ethers.utils.parseEther(value),
          "0x",
        ]
      );

      let estimatedFee = await ETHLayzerZeroEndpoint.estimateFees(
        L0_TARGET_CHAIN_ID,
        Proxy__EthBridge.address,
        payload,
        false,
        "0x"
      );

      console.log(`🆙 Depositing ${value} 👉 ${type} l1 with 💵 FEE ${ethers.utils.formatEther(estimatedFee._nativeFee)}`);

      await Proxy__EthBridge.withdraw(
        ETH_L1_BOBA_ADDRESS,
        ethers.utils.parseEther(value),
        ethers.constants.AddressZero,
        "0x", // adapterParams
        "0x",
        { value: estimatedFee._nativeFee }
      );

      console.log(`🔥 🔥 🔥 🔥 🔥  ${value} AMT TRANSFER  👉  ${type} !`);
      return true;
    } catch (error) {
      console.log("NS: Ve: depositErc20ToL1 error:", error)
      return error;
    }
  }

  /************************************/
  /********* Vote & Dao Pools *********/
  /************************************/

  async savePoolVote({
    tokenId,
    pools,
    weights
  }) {
    if (this.account === null) {
      console.log('NS: savePoolVote() error - called but account === null')
      return
    }

    try {
      const baseVoter = new ethers.Contract(
        allAddresses.BASE_V1_VOTER,
        voterJson.abi,
        this.provider
      )

      await baseVoter
        .connect(this.provider.getSigner())
        .vote(
          tokenId,
          pools,
          weights
        )
      return true;

    } catch (error) {
      console.log('NS: savePoolVote() error', error)
      return error;
    }
  }

  async distributePool({gaugeAddress}) {
    if (this.account === null) {
      console.log('NS: distributePool() error - called but account === null')
      return
    }

    try {
      const baseVoter = new ethers.Contract(
        allAddresses.BASE_V1_VOTER,
        voterJson.abi,
        this.provider.getSigner()
      )
        console.log('gaugeAddress',gaugeAddress)
      await baseVoter['distribute(address)'](gaugeAddress);

      return true;
    } catch (error) {
      console.log('NS: distributePool() error', error)
      return error;
    }
  }

  async fetchPools() {
    if (this.account === null) {
      console.log('NS: fetchPools() error - called but account === null')
      return
    }

    try {

      const pools = []
      const baseVoter = new ethers.Contract(
        allAddresses.BASE_V1_VOTER,
        voterJson.abi,
        this.provider
      )
      // load and iterate over nft to find vote on pools.
      let { records } = await this.fetchLockRecords();
      // filter the ve nft records which has used.
      records = records.filter((token)=> token.usedWeights > 0)

      const poolLen = await baseVoter.length();

      for (let i = 0; i < Number(poolLen); i++) {
        const poolId = await baseVoter.pools(i);
        // pool votes
        const rawVotes = await baseVoter.weights(poolId);
        const votes = Number(utils.formatUnits(rawVotes, 18));
        // total pools weights
        const rawTotalWeights = await baseVoter.totalWeight();
        const totalWeigths = Number(utils.formatUnits(rawTotalWeights, 18));

        // vote percentage
        const votePercentage = (votes / totalWeigths) * 100;
        // guage address needed to distribute w.r.to pool.
        const gaugeAddress = await baseVoter.gauges(poolId);

        let usedTokens = [];
        for (let j = 0; j < records.length; j++) {
          const nft = records[ j ];
          const rawTokenVote = await baseVoter.votes(nft.tokenId, poolId);
          const tokenVote = Number(utils.formatUnits(rawTokenVote, 18));

          if (tokenVote) {
            usedTokens.push({
              tokenId: nft.tokenId,
              vote: tokenVote
            })
          }
        }

        pools.push({
          ...getPoolDetail(poolId),
          poolId,
          totalVotes: votes.toFixed(2),
          votePercentage,
          gaugeAddress,
          usedTokens
        })
      }

      return {
        pools
      }

    } catch (error) {
      console.log("NS: Ve: fetchPools error:", error)
      return error;
    }
  }

  /****************************************
   ************* STARTS HERE **************
   ***********OLD DAO REMOVE ME ***********
   *****************************************/

  // FIXME: remove me once deprecated old dao.

  async fetchProposals() {

    if (!this.delegateContract) return

    const delegateCheck = await this.delegateContract.attach(allAddresses.GovernorBravoDelegator)

    try {

      let proposalList = []

      const proposalCounts = await delegateCheck.proposalCount()
      const totalProposals = await proposalCounts.toNumber()

      /// @notice An event emitted when a new proposal is created
      // event ProposalCreated(uint id, address proposer, address[] targets, uint[] values, string[] signatures, bytes[] calldatas, uint startTimestamp, uint endTimestamp, string description);

      let descriptionList = await GraphQLService.queryBridgeProposalCreated()

      for (let i = 0; i < totalProposals; i++) {
        const proposalRaw = descriptionList.data.governorProposalCreateds[i]

        if(typeof(proposalRaw) === 'undefined') continue

        let proposalID = proposalRaw.proposalId

        //this is a number such as 2
        let proposalData = await delegateCheck.proposals(proposalID)

        const proposalStates = [
          'Pending',
          'Active',
          'Canceled',
          'Defeated',
          'Succeeded',
          'Queued',
          'Expired',
          'Executed',
        ]

        let state = await delegateCheck.state(proposalID)

        let againstVotes = parseInt(formatEther(proposalData.againstVotes))
        let forVotes = parseInt(formatEther(proposalData.forVotes))
        let abstainVotes = parseInt(formatEther(proposalData.abstainVotes))

        let startTimestamp = proposalData.startTimestamp.toString()
        let endTimestamp = proposalData.endTimestamp.toString()

        let proposal = await delegateCheck.getActions(i+2)

        let hasVoted = null

        let description = proposalRaw.description.toString()

        proposalList.push({
           id: proposalID?.toString(),
           proposal,
           description,
           totalVotes: forVotes + againstVotes,
           forVotes,
           againstVotes,
           abstainVotes,
           state: proposalStates[state],
           startTimestamp,
           endTimestamp,
           hasVoted: hasVoted
        })

      }
      return { proposalList }
    } catch(error) {
      console.log("NS: fetchProposals error:",error)
      return error
    }
  }


  async castProposalVote({id, userVote}) {

    if( !this.delegateContract ) return

    if( !this.account ) {
      console.log('NS: castProposalVote() error - called but account === null')
      return
    }
    try {
      const delegateCheck = await this.delegateContract
        .connect(this.provider.getSigner())
        .attach(allAddresses.GovernorBravoDelegator)
      return delegateCheck.castVote(id, userVote)
    } catch(error) {
      console.log("NS: castProposalVote error:",error)
      return error
    }
  }


  /****************************************
   ************* END HERE *****************
   ***********OLD DAO REMOVE ME TILL HERE *
   *****************************************/

   async submitTxBuilder(contract, methodIndex, methodName, inputs) {

    const parseResult = (result, outputs) => {
      let parseResult = []
      if (outputs.length === 1) {
        return result.toString()
      }
      for (let i = 0; i < outputs.length; i++) {
        try {
          const output = outputs[i]
          const key = output.name ? output.name : output.type
          if (output.type.includes('uint')) {
            parseResult.push({[key]: result[i].toString()})
          } else {
            parseResult.push({[key]:result[i]})
          }
        } catch (err) {
          return 'Error: Failed to parse result'
        }
      }
      return JSON.stringify(parseResult)
    }

    let parseInput = Object.values(inputs)
    let value = 0
    const stateMutability = contract.interface.functions[methodName].stateMutability
    const outputs = contract.interface.functions[methodName].outputs
    if (stateMutability === 'payable') {
      value = parseInput[parseInput.length - 1]
      parseInput = parseInput.slice(0, parseInput.length - 1)
    }

    let result
    try {
      if (stateMutability === 'view' || stateMutability === 'pure') {
        result = await contract[methodName](...parseInput)
        return { methodIndex, result: { result: parseResult(result, outputs), err: null }}
      } else if (stateMutability === 'payable') {
        console.log({ value }, ...parseInput)
        const tx = await contract[methodName](...parseInput, { value })
        return { methodIndex, result: { transactionHash: tx.hash, err: null }}
      } else {
        const tx = await contract[methodName](...parseInput)
        return { methodIndex, result: { transactionHash: tx.hash, err: null }}
      }
    } catch (err) {
      return { methodIndex, result: { err: JSON.stringify(err) }}
    }
   }
}

const networkService = new NetworkService()
export default networkService
