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
import { orderBy } from 'lodash'
import BN from 'bn.js'

import { logAmount } from 'util/amountConvert'
import { getToken } from 'actions/tokenAction'

import {
  addBobaFee,
} from 'actions/setupAction'

import {
  updateSignatureStatus_exitTRAD,
  updateSignatureStatus_depositTRAD
} from 'actions/signAction'

// Base contracts
import L1StandardBridgeJson from '@eth-optimism/contracts/artifacts/contracts/L1/messaging/L1StandardBridge.sol/L1StandardBridge.json'
import L2StandardBridgeJson from '@eth-optimism/contracts/artifacts/contracts/L2/messaging/L2StandardBridge.sol/L2StandardBridge.json'
import L2ERC20Json from '@eth-optimism/contracts/artifacts/contracts/standards/L2StandardERC20.sol/L2StandardERC20.json'
import OVM_GasPriceOracleJson from '@eth-optimism/contracts/artifacts/contracts/L2/predeploys/OVM_GasPriceOracle.sol/OVM_GasPriceOracle.json'

// Boba contracts
import DiscretionaryExitFeeJson from '@boba/contracts/artifacts/contracts/DiscretionaryExitFee.sol/DiscretionaryExitFee.json'
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
// import gaugeFactoryJson from "../deployment/contracts/BaseV1GaugeFactory.json"
// import gaugeJson from "../deployment/contracts/Gauge.json"
// import voterJson from "../deployment/contracts/BaseV1Voter.json"
// import dispatcherJson from "../deployment/contracts/BaseV1Dispatcher.json"

import { getNftImageUrl } from 'util/nftImage'
import { getNetwork } from 'util/masterConfig'

import etherScanInstance from 'api/etherScanAxios'
import omgxWatcherAxiosInstance from 'api/omgxWatcherAxios'
import coinGeckoAxiosInstance from 'api/coinGeckoAxios'
import verifierWatcherAxiosInstance from 'api/verifierWatcherAxios'
import metaTransactionAxiosInstance from 'api/metaTransactionAxios'

import GraphQLService from "./graphQLService"

import addresses_BobaBase from "@boba/register/addresses/addressesBobaBase_0xF8d0bF3a1411AC973A606f90B2d1ee0840e5979B"
import addresses_BobaOperaTestnet from "@boba/register/addresses/addressesBobaOperaTestnet_0x12ad9f501149D3FDd703cC10c567F416B7F0af8b"
import addresses_BobaFuji from "@boba/register/addresses/addressBobaFuji_0xcE78de95b85212BC348452e91e0e74c17cf37c79.json"

import { bobaBridges } from 'util/bobaBridges'

// Icon
import * as React from 'react';
import MoonbeamIcon from 'components/icons/MoonbeamIcon.js'
import MoonbaseIcon from 'components/icons/MoonbaseIcon.js'
import FantomIcon from 'components/icons/FantomIcon.js'
import AvaxIcon from 'components/icons/AvaxIcon.js'

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
  }
}
if (process.env.REACT_APP_CHAIN === 'bobaOperaTestnet') {
  allAddresses = {
    ...addresses_BobaOperaTestnet,
  }
}
if (process.env.REACT_APP_CHAIN === 'bobaFuji') {
  allAddresses = {
    ...addresses_BobaFuji,
  }
}

// suported chains
const supportedMultiChains = ['bobaBase', 'bobaOperaTestnet', 'bobaFuji']

// assets for different chains
const L1ChainAssets = {
  'bobaBase': {
    name: 'Moonbase',
    l2Name: 'Bobabase',
    icon: (bool) => <MoonbaseIcon selected={bool}/>,
    supportedTokens: [ 'BOBA', process.env.REACT_APP_L1_NATIVE_TOKEN_SYMBOL]
  },
  'bobaOperaTestnet': {
    name: 'Fantom Testenet',
    l2Name: 'Boba',
    icon: (bool) => <FantomIcon selected={bool}/>,
    supportedTokens: [ 'BOBA', process.env.REACT_APP_L1_NATIVE_TOKEN_SYMBOL]
  },
  'bobaFuji': {
    name: 'Avalanche Testnet',
    l2Name: 'Boba',
    icon: (bool) => <AvaxIcon selected={bool}/>,
    supportedTokens: [ 'BOBA', process.env.REACT_APP_L1_NATIVE_TOKEN_SYMBOL]
  }
}

let allTokens = {}

function handleChangeChainOnce(chainID_hex_string) {
  console.log("handleChangeChainOnce: switched to chain", Number(chainID_hex_string))
  localStorage.setItem('chainChangedInit', true)
  console.log("chainChangedInit", true)
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

    // Gas oracle
    this.gasOracleContract = null

    // swap data for calculating the l1 security fee
    this.payloadForL1SecurityFee = null
    // fast deposit in batch
    this.payloadForFastDepositBatchCost = null

    // support token
    this.supportedTokens = []

    // L1 Native Token Symbol
    this.L1NativeTokenSymbol = null

    // chain
    this.chain = process.env.REACT_APP_CHAIN

    // twitter faucet promotion text
    this.twitterFaucetPromotionText = ''

    // block explorer urls for the footer
    this.blockExplorerUrls = getNetwork()[this.chain].L2.blockExplorer

    // supported chain
    this.supportedMultiChains = supportedMultiChains

    this.L1ChainAsset = L1ChainAssets[this.chain]
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

    console.log("Verifier response: ", response)

    if (response.status === 200) {
      const status = response.data.result
      return status
    } else {
      console.log("Bad verifier response")
      return false
    }
  }

  async getBobaFeeChoice() {

    console.log("getBobaFeeChoice()")
    console.log("this.account:",this.account)

    const bobaFeeContract = new ethers.Contract(
      allAddresses.Boba_GasPriceOracle,
      Boba_GasPriceOracleJson.abi,
      this.L2Provider
    )

    try {

      let priceRatio = await bobaFeeContract.priceRatio()
      console.log("BFO: priceRatio:",priceRatio)

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

    console.log("switchFee()")
    console.log("this.account:",this.account)

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

    console.log("triggering getETHMetaTransaction")

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
    this.networkGateway = networkGateway // e.g. mainnet | rinkeby | ...

    // defines the set of possible networks along with chainId for L1 and L2
    const nw = getNetwork()
    const L1rpc = nw[networkGateway]['L1']['rpcUrl']
    const L2rpc = nw[networkGateway]['L2']['rpcUrl']

    // add l1 native token symbol
    this.L1NativeTokenSymbol = nw[networkGateway]['L1']['symbol']

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

      if (this.supportedMultiChains.includes(networkGateway)) {
        addresses = allAddresses
        console.log(`${networkGateway} Addresses: ${addresses}`)
      }
      // else if (networkGateway === 'local') {
      //     //addresses = addresses_Local
      //     console.log('Rinkeby Addresses:', addresses)
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
      console.log("L1StandardBridgeContract:", this.L1StandardBridgeContract.address)

      this.supportedTokens = networkService.L1ChainAsset.supportedTokens

      await Promise.all(this.supportedTokens.map(async (key) => {

        const L2a = addresses['TK_L2'+key]

        const L1a = addresses['TK_L1'+key]
        if (L1a === ERROR_ADDRESS || L2a === ERROR_ADDRESS) {
          console.log(key + ' ERROR: TOKEN NOT IN ADDRESSMANAGER')
          return false
        } else {
          allTokens[key] = {
            'L1': L1a,
            'L2': L2a
          }
        }

      }))

      console.log("tokens:",allTokens)
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
      // either local, rinkeby etc
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
      blockExplorerUrls = [nw[network].L2.blockExplorer.slice(0, -1)]
    }

    //the chainParams are only needed for the L2s
    const chainParam = {
      chainId: '0x' + nw[network].L2.chainId.toString(16),
      chainName: nw[network].L2.name,
      rpcUrls: [nw[network].L2.rpcUrl],
      blockExplorerUrls
    }

    const targetIDHex = nw[network][targetLayer].chainIdHex

    this.provider = new ethers.providers.Web3Provider(window.ethereum)

    console.log("switchChain to:", targetLayer)

    try {
      await this.provider.send('wallet_switchEthereumChain', [{ chainId: targetIDHex }])
      console.log("calling: window.ethereum.on('chainChanged', handleChangeChainOnce)")
      window.ethereum.on('chainChanged', handleChangeChainOnce)
      return true
    } catch (error) {
      // 4902 = the chain has not been added to MetaMask.
      // So, lets add it
      if (error.code === 4902) {
        try {
          await this.provider.send('wallet_addEthereumChain', [chainParam, this.account])
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

    console.log("Getting transactions...")

    let txL1 = []
    let txL1pending = []
    let txL2 = []

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

    //console.log("responseL1",txL1)

    const responseL2 = await omgxWatcherAxiosInstance(
      this.networkGateway
    ).post('get.l2.transactions', {
      address: this.account,
      fromRange:  0,
      toRange: 1000,
    })

    //console.log("responseL2",responseL2)

    if (responseL2.status === 201) {
      //add the chain: 'L2' field
      txL2 = responseL2.data.map(v => ({...v, chain: 'L2'}))
    }

    const responseL1pending = await omgxWatcherAxiosInstance(
      this.networkGateway
    ).post('get.l1.transactions', {
      address: this.account,
      fromRange:  0,
      toRange: 1000,
    })

    //console.log("responseL1pending",responseL1pending)

    if (responseL1pending.status === 201) {
      //add the chain: 'L1pending' field
      txL1pending = responseL1pending.data.map(v => ({...v, chain: 'L1pending'}))
      //console.log("txL1pending",txL1pending)
      const annotated = //await this.parseTransaction(
        [
          ...txL1,
          ...txL2,
          ...txL1pending //the new data product
        ]
      //)
      //console.log("annotated:",annotated)
      return annotated
    }

  }

  async getExits() {

    console.log("getExits()")

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
    // Only Rinkeby
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
        if(token.balance.lte(new BN(1000000))) {
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
  depositETHL2 = async (value_Wei_String) => {

    //console.log("this.L1StandardBridgeContract:",this.L1StandardBridgeContract)

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
  async depositErc20(value_Wei_String, currency, currencyL2) {

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

      const depositTX = await this.L1StandardBridgeContract
        .connect(this.provider.getSigner()).depositERC20(
          currency,
          currencyL2,
          value_Wei_String,
          this.L2GasLimit,
          utils.formatBytes32String(new Date().getTime().toString())
        )

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

    const tx2 = await DiscretionaryExitFeeContract.populateTransaction.payAndWithdraw(
      allAddresses.L2_BOBA_Address,
      utils.parseEther('0.00001'),
      this.L1GasLimit,
      ethers.utils.formatBytes32String(new Date().getTime().toString()),
      { value: utils.parseEther('0.00001').add(exitFee) }
    )

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
    let callData = ['']

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
      console.log("NS: getProposalThreshold error:",error)
      return error
    }
  }

  //Fetch DAO Proposals
  async fetchProposals() {

    if( !this.delegateContract ) return

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

        let startBlock = proposalData.startBlock.toString()
        let startTimestamp = proposalData.startTimestamp.toString()
        let endTimestamp = proposalData.endTimestamp.toString()

        let proposal = await delegateCheck.getActions(i+2)

        let hasVoted = null

        if( this.account ) {
          hasVoted = await delegateCheck.getReceipt(proposalID, this.account)
        }

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
           startBlock,
           startTimestamp,
           endTimestamp,
           hasVoted: hasVoted
        })

      }
      return { proposalList }
    } catch (error) {
      console.log("NS: fetchProposals error:",error)
      return error
    }
  }

  //Cast vote for proposal
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

  async queueProposal(proposalID) {

    if( !this.delegateContract ) return

    if( !this.account ) {
      console.log('NS: queueProposal() error - called but account === null')
      return
    }

    console.log("ProposalID:",Number(proposalID))

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

    console.log("ProposalID:",Number(proposalID))

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
      console.log("Allowance:", allowance_BN.toString())

      let depositAmount_BN = BigNumber.from(value_Wei_String)
      console.log("Increase Amount:", depositAmount_BN)

      let approveAmount_BN = depositAmount_BN.add(BigNumber.from('1000000000000'))

      try {
        if (approveAmount_BN.gt(allowance_BN)) {
          console.log("Need to approve YES:", approveAmount_BN)
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

    console.log('tokenId, lock_duration', {
      tokenId, lock_duration
    })
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

        balanceInfo.push({
          tokenId,
          balance: Number(utils.formatUnits(balance, 18)).toFixed(2),
          lockedAmount: Number(utils.formatUnits(locked.amount, 18)).toFixed(2),
          expiry: new Date(locked.end.toString() * 1000),
          expirySeconds: locked.end.toString() * 1000,
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

}

const networkService = new NetworkService()
export default networkService
