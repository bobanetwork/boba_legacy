/* eslint-disable quotes */
/*
Copyright 2019-present OmiseGO Pte Ltd

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
  addNFT,
  addMonster,
  getNFTs
} from 'actions/nftAction'

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
import L2ERC721Json from '@boba/contracts/artifacts/contracts/standards/L2StandardERC721.sol/L2StandardERC721.json'
import Boba from "@boba/contracts/artifacts/contracts/DAO/governance-token/BOBA.sol/BOBA.json"
import GovernorBravoDelegate from "@boba/contracts/artifacts/contracts/DAO/governance/GovernorBravoDelegate.sol/GovernorBravoDelegate.json"
import GovernorBravoDelegator from "@boba/contracts/artifacts/contracts/DAO/governance/GovernorBravoDelegator.sol/GovernorBravoDelegator.json"
import L2BillingContractJson from "@boba/contracts/artifacts/contracts/L2BillingContract.sol/L2BillingContract.json"

//special one-off locations
import L1ERC20Json from '../deployment/contracts/L1ERC20.json'
import OMGJson from '../deployment/contracts/OMG.json'
import BobaAirdropJson from "../deployment/contracts/BobaAirdrop.json"
import BobaAirdropL1Json from "../deployment/contracts/BobaAirdropSecond.json"
import TuringMonsterJson from "../deployment/contracts/NFTMonsterV2.json"
import Boba_GasPriceOracleJson from "../deployment/contracts/Boba_GasPriceOracle.json"

//WAGMI ABIs
import WAGMIv0Json from "../deployment/contracts/WAGMIv0.json"
import WAGMIv1Json from "../deployment/contracts/WAGMIv1.json"

import { getNftImageUrl } from 'util/nftImage'
import { getNetwork } from 'util/masterConfig'

import etherScanInstance from 'api/etherScanAxios'
import omgxWatcherAxiosInstance from 'api/omgxWatcherAxios'
import coinGeckoAxiosInstance from 'api/coinGeckoAxios'
import verifierWatcherAxiosInstance from 'api/verifierWatcherAxios'
import metaTransactionAxiosInstance from 'api/metaTransactionAxios'

import { sortRawTokens } from 'util/common'
import GraphQLService from "./graphQLService"

import addresses_Rinkeby from "@boba/register/addresses/addressesRinkeby_0x93A96D6A5beb1F661cf052722A1424CDDA3e9418"
import addresses_Mainnet from "@boba/register/addresses/addressesMainnet_0x8376ac6C3f73a25Dd994E0b0669ca7ee0C02F089"
import { bobaBridges } from 'util/bobaBridges'

require('dotenv').config()

const ERROR_ADDRESS = '0x0000000000000000000000000000000000000000'
const L1_ETH_Address = '0x0000000000000000000000000000000000000000'
const L2_ETH_Address = '0x4200000000000000000000000000000000000006'
const L2MessengerAddress = '0x4200000000000000000000000000000000000007'
const L2StandardBridgeAddress = '0x4200000000000000000000000000000000000010'
const L2GasOracle = '0x420000000000000000000000000000000000000F'

let allAddresses = {}
// preload allAddresses
if (process.env.REACT_APP_CHAIN === 'rinkeby') {
  allAddresses = {
    ...addresses_Rinkeby,
    L1LPAddress: addresses_Rinkeby.Proxy__L1LiquidityPool,
    L2LPAddress: addresses_Rinkeby.Proxy__L2LiquidityPool
  }
} else if (process.env.REACT_APP_CHAIN === 'mainnet') {
  allAddresses = {
    ...addresses_Mainnet,
    L1LPAddress: addresses_Mainnet.Proxy__L1LiquidityPool,
    L2LPAddress: addresses_Mainnet.Proxy__L2LiquidityPool
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

  async fetchAirdropStatusL1() {

    // NOT SUPPORTED on LOCAL
    if (this.networkGateway === 'local') return

    const response = await omgxWatcherAxiosInstance(
      this.networkGateway
    ).post('get.l1.airdrop', {
      address: this.account,
      key: process.env.REACT_APP_AIRDROP
    })

    console.log("L1 response:", response)

    if (response.status === 201) {
      const status = response.data
      return status
    } else {
      console.log("Bad gateway response")
      return false
    }

  }

  async fetchAirdropStatusL2() {

    // NOT SUPPORTED on LOCAL
    if (this.networkGateway === 'local') return

    const response = await omgxWatcherAxiosInstance(
      this.networkGateway
    ).post('get.l2.airdrop', {
      address: this.account,
      key: process.env.REACT_APP_AIRDROP
    })

    if (response.status === 201) {
      const status = response.data
      return status
    } else {
      console.log("Bad gateway response")
      return false
    }

  }

  async initiateAirdrop(callData) {

    console.log("Initiating airdrop")
    console.log("getAirdropL1(callData)",callData.merkleProof)

    // NOT SUPPORTED on LOCAL
    if (this.networkGateway === 'local') return

    const airdropContract = new ethers.Contract(
      allAddresses.BobaAirdropL1,
      BobaAirdropL1Json.abi,
      this.provider.getSigner()
    )

    console.log("airdropL1Contract.address:", airdropContract.address)

    try {

      //function claim(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof)
      let claim = await airdropContract.initiateClaim(
        callData.merkleProof.index,  //Spec - 1 - Type Number,
        callData.merkleProof.amount, //Spec 101 Number - this is Number in the spec but an StringHexWei in the payload
        callData.merkleProof.proof   //proof1
      )

      await claim.wait()

      //Interact with API if the contract interaction was successful
      //success of this this call has no bearing on the airdrop itself, since the api is just
      //used for user status updates etc.
      //send.l1.airdrop
      const response = await omgxWatcherAxiosInstance(
        this.networkGateway
      ).post('initiate.l1.airdrop', {
          address: this.account,
          key: process.env.REACT_APP_AIRDROP
      })

      if (response.status === 201) {
        console.log("L1 Airdrop gateway response:",response.data)
      } else {
        console.log("L1 Airdrop gateway response:",response)
      }

      return claim

    } catch (error) {
      console.log(error)
      return error
    }

  }

  async getAirdropL1(callData) {

    console.log("getAirdropL1")
    console.log("getAirdropL1(callData)",callData.merkleProof)
    console.log("this.account:",this.account)

    //Interact with contract
    const airdropContract = new ethers.Contract(
      allAddresses.BobaAirdropL1,
      BobaAirdropL1Json.abi,
      this.provider.getSigner()
    )

    console.log("airdropL1Contract.address:", airdropContract.address)

    try {

      //function claim(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof)
      let claim = await airdropContract.claim(
        callData.merkleProof.index,  //Spec - 1 - Type Number,
        this.account,                //wallet address
        callData.merkleProof.amount, //Spec 101 Number - this is Number in the spec but an StringHexWei in the payload
        callData.merkleProof.proof   //proof1
      )

      await claim.wait()

      //Interact with API if the contract interaction was successful
      //success of this this call has no bearing on the airdrop itself, since the api is just
      //used for user status updates etc.
      //send.l1.airdrop
      const response = await omgxWatcherAxiosInstance(
        this.networkGateway
      ).post('send.l1.airdrop', {
          address: this.account,
          key: process.env.REACT_APP_AIRDROP
      })

      if (response.status === 201) {
        console.log("L1 Airdrop gateway response:",response.data)
      } else {
        console.log("L1 Airdrop gateway response:",response)
      }

      return claim

    } catch (error) {
      console.log(error)
      return error
    }

  }

  async getAirdropL2(callData) {

    console.log("getAirdropL2(callData)",callData)
    console.log("this.account:",this.account)

    //Interact with contract
    const airdropContract = new ethers.Contract(
      allAddresses.BobaAirdropL2,
      BobaAirdropJson.abi,
      this.provider.getSigner()
    )

    console.log("airdropL2Contract.address:", airdropContract.address)

    try {

      //function claim(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof)
      let claim = await airdropContract.claim(
        callData.merkleProof.index,  //Spec - 1 - Type Number,
        this.account,                //wallet address
        callData.merkleProof.amount, //Spec 101 Number - this is Number in the spec but an StringHexWei in the payload
        callData.merkleProof.proof   //proof1
      )

      await claim.wait()

      //Interact with API if the contract interaction was successful
      //success of this this call has no bearing on the airdrop itself, since the api is just
      //used for user status updates etc.
      //send.l2.airdrop
      const response = await omgxWatcherAxiosInstance(
        this.networkGateway
      ).post('send.l2.airdrop', {
          address: this.account,
          key: process.env.REACT_APP_AIRDROP
      })

      if (response.status === 201) {
        console.log("L2 Airdrop gateway response:",response.data)
      } else {
        console.log("L2 Airdrop gateway response:",response)
      }

      return claim

    } catch (error) {
      console.log(error)
      return error
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

      let feeChoice = await bobaFeeContract.bobaFeeTokenUsers(this.account)
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

      } else if (targetFee === 'ETH') {
        tx = await bobaFeeContract.useETHAsFeeToken()
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

    let value = (await Boba_GasPriceOracle.getBOBAForSwap()).toString()
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
      ).post('/send.swapBOBAForETH', { owner, spender, value, deadline, signature, data })
      console.log("response",response)
      await this.getBobaFeeChoice()
    } catch (error) {
      console.log(error)
      // sigh
      let errorData = error.response.data.error
      if(errorData.hasOwnProperty('error')) {
        errorData = errorData.error.error.body
      }
      console.log("returning:",error)
      return errorData
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

    try {

      //fire up the base providers
      const Web3 = require("web3")

      this.L1ProviderBASE = new Web3(new Web3.providers.HttpProvider(L1rpc))
      this.L2ProviderBASE = new Web3(new Web3.providers.HttpProvider(L2rpc))

      //this.L1ProviderBASE.eth.handleRevert = true
      //this.L2ProviderBASE.eth.handleRevert = true

      if (networkGateway === 'mainnet' || networkGateway === 'rinkeby') {
        this.payloadForL1SecurityFee = nw[networkGateway].payloadForL1SecurityFee
        this.payloadForFastDepositBatchCost = nw[networkGateway].payloadForFastDepositBatchCost
        this.gasEstimateAccount = nw[networkGateway].gasEstimateAccount
        console.log('gasEstimateAccount:', this.gasEstimateAccount)
      }

      this.L1Provider = new ethers.providers.StaticJsonRpcProvider(
        nw[networkGateway]['L1']['rpcUrl']
      )
      this.L2Provider = new ethers.providers.StaticJsonRpcProvider(
        nw[networkGateway]['L2']['rpcUrl']
      )

      if (networkGateway === 'rinkeby') {
        addresses = addresses_Rinkeby
        console.log('Rinkeby Addresses:', addresses)
      } else if (networkGateway === 'mainnet') {
        addresses = addresses_Mainnet
        console.log('Mainnet Addresses:', addresses)
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
      if (!(await this.getAddressCached(addresses, 'Proxy__BobaFixedSavings', 'BobaFixedSavings'))) return
      if (!(await this.getAddressCached(addresses, 'Proxy__Boba_GasPriceOracle', 'Boba_GasPriceOracle'))) return
      //if (!(await this.getAddressCached(addresses, 'DiscretionaryExitFee', 'DiscretionaryExitFee'))) return

      // not critical
      this.getAddressCached(addresses, 'DiscretionaryExitFee', 'DiscretionaryExitFee')
      console.log("DiscretionaryExitFee:",allAddresses.DiscretionaryExitFee)

      // not critical
      this.getAddressCached(addresses, 'BobaAirdropL1', 'BobaAirdropL1')
      console.log("BobaAirdropL1:",allAddresses.BobaAirdropL1)

      // not critical
      this.getAddressCached(addresses, 'BobaAirdropL2', 'BobaAirdropL2')
      console.log("BobaAirdropL2:",allAddresses.BobaAirdropL2)

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

      //L2_ETH_Address is a predeploy, so add by hand....
      allAddresses = {
        ...allAddresses,
        'L2_ETH_Address': L2_ETH_Address
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

      this.supportedTokens = [ 'USDT',   'DAI', 'USDC',  'WBTC',
                               'REP',    'BAT',  'ZRX', 'SUSHI',
                               'LINK',   'UNI', 'BOBA', 'xBOBA',
                               'OMG',   'FRAX',  'FXS',  'DODO',
                               'UST',   'BUSD',  'BNB',   'FTM',
                               'MATIC',  'UMA',  'DOM',   'OLO',
                               'WAGMIv0',
                               'WAGMIv1', 
                               'WAGMIv2', 'WAGMIv2-Oolong',
                               'WAGMIv3', 'WAGMIv3-Oolong'
                              ]

      //not all tokens are on Rinkeby
      if ( networkGateway === 'rinkeby') {
        this.supportedTokens = [ 'USDT', 'DAI', 'USDC',  'WBTC',
                                 'BAT',  'ZRX', 'SUSHI',
                                 'LINK', 'UNI', 'BOBA', 'xBOBA',
                                 'OMG', 'DOM'
                                ]
      }

      await Promise.all(this.supportedTokens.map(async (key) => {

        const L2a = addresses['TK_L2'+key]

        if(key === 'xBOBA') {
          if (L2a === ERROR_ADDRESS) {
            console.log(key + ' ERROR: TOKEN NOT IN ADDRESSMANAGER')
            return false
          } else {
            allTokens[key] = {
              'L1': 'xBOBA',
              'L2': L2a
            }
          }
        }
        else if(key === 'WAGMIv0') {
          allTokens[key] = {
            'L1': 'WAGMIv0',
            'L2': '0x8493C4d9Cd1a79be0523791E3331c78Abb3f9672'
          }
        }
        else if(key === 'WAGMIv1') {
          allTokens[key] = {
            'L1': 'WAGMIv1',
            'L2': '0xCe055Ea4f29fFB8bf35E852522B96aB67Cbe8197'
          }
        }
        else if(key === 'WAGMIv2') {
          allTokens[key] = {
            'L1': 'WAGMIv2',
            'L2': '0x76B5908ecd0ae3DB23011ae96b7C1f803D63136c'
          }
        }
        else if(key === 'WAGMIv2-Oolong') {
          allTokens[key] = {
            'L1': 'WAGMIv2-Oolong',
            'L2': '0x49a3e4a1284829160f95eE785a1A5FfE2DD5Eb1D'
          }
        }
        else if(key === 'WAGMIv3') {
          allTokens[key] = {
            'L1': 'WAGMIv3',
            'L2': '0xC6158B1989f89977bcc3150fC1F2eB2260F6cabE'
          }
        }
        else if(key === 'WAGMIv3-Oolong') {
          allTokens[key] = {
            'L1': 'WAGMIv3-Oolong',
            'L2': '0x70bf3c5B5d80C4Fece8Bde0fCe7ef38B688463d4'
          }
        }
        else if(key === 'OLO') {
          allTokens[key] = {
            'L1': 'OLO',
            'L2': '0x5008F837883EA9a07271a1b5eB0658404F5a9610'
          }
        }
        else {
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
        }

      }))

      console.log("tokens:",allTokens)
      this.tokenAddresses = allTokens

      if (!(await this.getAddressCached(addresses, 'BobaMonsters', 'BobaMonsters'))) return

      if (!(await this.getAddressCached(addresses, 'Proxy__L1LiquidityPool', 'L1LPAddress'))) return
      if (!(await this.getAddressCached(addresses, 'Proxy__L2LiquidityPool', 'L2LPAddress'))) return

      if(allAddresses.L2StandardBridgeAddress !== null) {
        this.L2StandardBridgeContract = new ethers.Contract(
          allAddresses.L2StandardBridgeAddress,
          L2StandardBridgeJson.abi,
          this.L2Provider
        )
      }
      console.log("L2StandardBridgeContract:", this.L2StandardBridgeContract.address)

      this.L2_ETH_Contract = new ethers.Contract(
        allAddresses.L2_ETH_Address,
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
      //console.log('L1_TEST_Contract:', this.L1_TEST_Contract)

      this.L2_TEST_Contract = new ethers.Contract(
        allTokens.BOBA.L2, //this will get changed anyway when the contract is used
        L2ERC20Json.abi,
        this.L2Provider
      )
      //console.log('L2_TEST_Contract:', this.L2_TEST_Contract)

      /*The OMG token*/
      //We need this seperately because OMG is not ERC20 compliant
      this.L1_OMG_Contract = new ethers.Contract(
        allTokens.OMG.L1,
        OMGJson,
        this.L1Provider
      )
      //console.log('L1_OMG_Contract:', this.L1_OMG_Contract)

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

      if(networkGateway === 'mainnet') {
        this.watcher = new CrossChainMessenger({
          l1SignerOrProvider: this.L1Provider,
          l2SignerOrProvider: this.L2Provider,
          l1ChainId: 1,
          fastRelayer: false,
        })
        this.fastWatcher = new CrossChainMessenger({
          l1SignerOrProvider: this.L1Provider,
          l2SignerOrProvider: this.L2Provider,
          l1ChainId: 1,
          fastRelayer: true,
        })
      } else if (networkGateway === 'rinkeby') {
        this.watcher = new CrossChainMessenger({
          l1SignerOrProvider: this.L1Provider,
          l2SignerOrProvider: this.L2Provider,
          l1ChainId: 4,
          fastRelayer: false,
        })
        this.fastWatcher = new CrossChainMessenger({
          l1SignerOrProvider: this.L1Provider,
          l2SignerOrProvider: this.L2Provider,
          l1ChainId: 4,
          fastRelayer: true,
        })
      }
      else {
        this.watcher = null
        this.fastWatcher = null
      }

      this.BobaContract = new ethers.Contract(
        allTokens.BOBA.L2,
        Boba.abi,
        this.L2Provider
      )

      this.xBobaContract = new ethers.Contract(
        allTokens.xBOBA.L2,
        Boba.abi,
        this.L2Provider
      )

      if (!(await this.getAddressCached(addresses, 'GovernorBravoDelegate', 'GovernorBravoDelegate'))) return
      if (!(await this.getAddressCached(addresses, 'GovernorBravoDelegator', 'GovernorBravoDelegator'))) return

      this.delegateContract = new ethers.Contract(
        allAddresses.GovernorBravoDelegate,
        GovernorBravoDelegate.abi,
        this.L2Provider
      )

      this.delegatorContract = new ethers.Contract(
        allAddresses.GovernorBravoDelegator,
        GovernorBravoDelegator.abi,
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
      if (networkGateway === 'local' && networkMM.chainId === L2ChainId) {
        //ok, that's reasonable
        //local deployment, L2
        this.L1orL2 = 'L2'
      } else if (networkGateway === 'local' && networkMM.chainId === L1ChainId) {
        //ok, that's reasonable
        //local deployment, L1
        this.L1orL2 = 'L1'
      } else if (networkGateway === 'rinkeby' && networkMM.chainId === L1ChainId) {
        //ok, that's reasonable
        //rinkeby, L1
        this.L1orL2 = 'L1'
      } else if (networkGateway === 'rinkeby' && networkMM.chainId === L2ChainId) {
        //ok, that's reasonable
        //rinkeby, L2
        this.L1orL2 = 'L2'
      } else if (networkGateway === 'rinkeby_integration' && networkMM.chainId === L1ChainId) {
        //ok, that's reasonable
        //rinkeby, L1
        this.L1orL2 = 'L1'
      } else if (networkGateway === 'rinkeby_integration' && networkMM.chainId === L2ChainId) {
        //ok, that's reasonable
        //rinkeby, L2
        this.L1orL2 = 'L2'
      } else if (networkGateway === 'mainnet' && networkMM.chainId === L1ChainId) {
        //ok, that's reasonable
        //rinkeby, L2
        this.L1orL2 = 'L1'
      } else if (networkGateway === 'mainnet' && networkMM.chainId === L2ChainId) {
        //ok, that's reasonable
        //rinkeby, L2
        this.L1orL2 = 'L2'
      } else {
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

  async getFastExits() {

    console.log("getFastExits()")

    // NOT SUPPORTED on LOCAL
    if (this.networkGateway === 'local') return

    const response = await omgxWatcherAxiosInstance(
      this.networkGateway
    ).get('get.l2.pendingexits')

    if (response.status === 201) {
      const data = response.data
      const filtered = data.filter(
        (i) => (i.fastRelay === 1) && (i.status === 'pending')
      )
      return filtered
    } else {
      return []
    }
  }

  async fetchMyMonsters() {

    let monsterList = await GraphQLService.queryMonsterTransfer(this.account)

    const contract = new ethers.Contract(
      allAddresses.BobaMonsters,
      TuringMonsterJson.abi,
      this.L2Provider
    )

    if(monsterList.hasOwnProperty('data')) {
      const monsters = monsterList.data.turingMonstersTransferEvents
      for (let i = 0; i < monsters.length; i++) {
        // console.log("adding monster:", i + 1)
        const tokenId = monsters[i].tokenId
        const owner = await contract.ownerOf(tokenId)
            //console.log("owner:", owner)
        if(owner.toLowerCase() === this.account.toLowerCase()) {
          this.addNFT( allAddresses.BobaMonsters, tokenId )
        }
      }
      this.checkMonster()
    }
  }

  async checkMonster() {

    const NFTs = getNFTs()

    let validMonsters = []

    try {

      const contract = new ethers.Contract(
        allAddresses.BobaMonsters,
        TuringMonsterJson.abi,
        this.L2Provider
      )

      const monsterBalance = await contract.balanceOf(this.account)

      let topMagic = 0
      let topTop = 0

      if(NFTs && Number(monsterBalance) > 0) {
        //console.log("checking monsters")
        for (const [ key, value ] of Object.entries(NFTs)) {
          //console.log(`${key} value: ${value.name}`)
          if(value.name === 'TuringMonster') {
            const owner = await contract.ownerOf(value.tokenID)
            //console.log("owner:", owner)
            if(owner.toLowerCase() === this.account.toLowerCase()) {
              const attributes = {
                top:   value.meta.attributes[3].value,
                magic: value.meta.attributes[4].value,
              }
              if(value.meta.attributes[3].value === 'crown') topTop = 1
              if(value.meta.attributes[4].value === 'wizzard') topMagic = 1
              validMonsters.push({tokenID: value.tokenID, attributes})
            }
          }
        }

        if(topMagic === 0 && topTop === 0) {
          validMonsters.push({monsterType: 'basic'})
        } else if (topMagic === 0 && topTop === 1) {
          validMonsters.push({monsterType: 'crowned'})
        } else if (topMagic === 1 && topTop === 0) {
          validMonsters.push({monsterType: 'wizard'})
        } else if (topMagic === 1 && topTop === 1) {
          validMonsters.push({monsterType: 'crowned wizard'})
        }

        await addMonster( validMonsters )

      }

      return Number(monsterBalance.toString())

    } catch (error) {
      console.log("NS: checkMonster error:",error)
      return error
    }

  }

  /* This is for manually adding NFTs */
  async addNFT( address, tokenID ) {

    console.log("address", address)

    try {

      const contract = new ethers.Contract(
        address,
        L2ERC721Json.abi,
        this.L2Provider
      )

      const nftName = await contract.name()
      const nftSymbol = await contract.symbol()
      const nftMeta = await contract.tokenURI(tokenID)
      console.log("nftMeta RAW:", nftMeta)
      const UUID = address.substring(1, 6) + '_' + tokenID.toString() + '_' + this.account.substring(1, 6)

      const { url , meta = [] } = await getNftImageUrl(nftMeta)

      console.log("meta:", meta)

      const NFT = {
        UUID,
        address,
        name: nftName,
        tokenID,
        symbol: nftSymbol,
        url,
        meta,
        account: this.account,
        network: this.networkGateway,
        layer: this.L1orL2
      }

      await addNFT( NFT )

    } catch (error) {
      console.log("NS: addNFT error:",error)
      return error
    }

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
        addressL2: allAddresses.L2_ETH_Address,
        currency: allAddresses.L1_ETH_Address,
        symbol: 'ETH',
        decimals: 18,
        balance: new BN(0),
      },
    ]

    const layer2Balances = [
      {
        address: allAddresses.L2_ETH_Address,
        addressL1: allAddresses.L1_ETH_Address,
        addressL2: allAddresses.L2_ETH_Address,
        currency: allAddresses.L1_ETH_Address,
        symbol: 'ETH',
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
        if (token.addressL1 === allAddresses.L1_ETH_Address) return
        if (token.addressL2 === allAddresses.L2_ETH_Address) return
        if (token.addressL1 === null) return
        if (token.addressL2 === null) return

        if (token.symbolL1 === 'xBOBA') {
          //there is no L1 xBOBA
          getBalancePromise.push(getERC20Balance(token, token.addressL2, "L2", this.L2Provider))
        }
        else if (token.symbolL1 === 'WAGMIv0') {
          //there is no L1 WAGMIv0
          getBalancePromise.push(getERC20Balance(token, token.addressL2, "L2", this.L2Provider))
        }
        else if (token.symbolL1 === 'WAGMIv1') {
          //there is no L1 WAGMIv1
          getBalancePromise.push(getERC20Balance(token, token.addressL2, "L2", this.L2Provider))
        }
        else if (token.symbolL1 === 'WAGMIv2') {
          //there is no L2 WAGMIv2
          getBalancePromise.push(getERC20Balance(token, token.addressL2, "L2", this.L2Provider))
        }
        else if (token.symbolL1 === 'WAGMIv2-Oolong') {
          //there is no L2 WAGMIv2OLO
          getBalancePromise.push(getERC20Balance(token, token.addressL2, "L2", this.L2Provider))
        }
        else if (token.symbolL1 === 'WAGMIv3') {
          //there is no L2 WAGMIv3
          getBalancePromise.push(getERC20Balance(token, token.addressL2, "L2", this.L2Provider))
        }
        else if (token.symbolL1 === 'WAGMIv3-Oolong') {
          //there is no L2 WAGMIv3OLO
          getBalancePromise.push(getERC20Balance(token, token.addressL2, "L2", this.L2Provider))
        }
        else if (token.symbolL1 === 'OLO') {
          //there is no L1 OLO
          getBalancePromise.push(getERC20Balance(token, token.addressL2, "L2", this.L2Provider))
        }
        else {
          getBalancePromise.push(getERC20Balance(token, token.addressL1, "L1", this.L1Provider))
          getBalancePromise.push(getERC20Balance(token, token.addressL2, "L2", this.L2Provider))
        }
      })

      const tokenBalances = await Promise.all(getBalancePromise)

      tokenBalances.forEach((token) => {
        if(token.balance.lte(new BN(1000000))) {
          //do nothing
        }
        else if (token.layer === 'L1' &&
            token.symbol !== 'xBOBA' &&
            token.symbol !== 'WAGMIv0' &&
            token.symbol !== 'WAGMIv1' &&
            token.symbol !== 'WAGMIv2' &&
            token.symbol !== 'WAGMIv2-Oolong' &&
            token.symbol !== 'WAGMIv3' &&
            token.symbol !== 'WAGMIv3-Oolong'
          ) {
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
        .connect(this.provider.getSigner()).depositETH(
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

      const data = {
        "key": process.env.REACT_APP_SPEED_CHECK,
        "hash": depositTX.hash,
        "l1Tol2": false, //since we are going L2->L1
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
    } catch(error) {
      console.log("NS: depositETHL2 error:",error)
      return error
    }
  }

  async monsterMint() {

    console.log("NS: monsterMint")

    // ONLY SUPPORTED on L2
    if( this.L1orL2 !== 'L2' ) return

    // ONLY SUPPORTED on Rinkeby and Mainnet
    if (this.networkGateway === 'local') return

    try {

      const contract = new ethers.Contract(
        allAddresses.BobaMonsters,
        TuringMonsterJson.abi,
        this.L2Provider
      )

      const tx = await contract
        .connect(this.provider.getSigner())
        .mint(1)

      const receipt = await tx.wait()
      console.log("NS: monsterMint TX:", receipt.logs)

      const rawData = receipt.logs[3].topics[1]
      const numberHexString = rawData.slice(-64)
      let tokenID = parseInt(numberHexString, 16)
      await this.addNFT( allAddresses.BobaMonsters, tokenID )

      return tx
    } catch (error) {
      console.log("NS: monsterMint error:", error)
      return error
    }

  }

  async settle_v0() {

    console.log("NS: settle_v0")

    // ONLY SUPPORTED on L2
    if( this.L1orL2 !== 'L2' ) return

    // ONLY SUPPORTED on MAINNET
    if (this.networkGateway !== 'mainnet') return

    try {

      const contractLSP = new ethers.Contract(
        '0x7F969E3F19355C47f6bc957E502c79C75b373BF3',
        WAGMIv0Json.abi,
        this.L2Provider
      )

      const contractWAGMIv0 = new ethers.Contract(
        '0x8493C4d9Cd1a79be0523791E3331c78Abb3f9672',
        L1ERC20Json.abi,
        this.L2Provider
      )

      const balance = await contractWAGMIv0.connect(this.provider).balanceOf(this.account)
      console.log("You have WAGMIv0:", balance.toString())

      const TX = await contractLSP
      .connect(this.provider.getSigner())
      .settle(
        balance,
        ethers.utils.parseEther("0")
      )
      await TX.wait()
      return TX
    } catch (error) {
      console.log("NS: settle_v0 error:", error)
      return error
    }

  }

  async settle_v1() {

    console.log("NS: settle_v1")

    // ONLY SUPPORTED on L2
    if( this.L1orL2 !== 'L2' ) return

    // ONLY SUPPORTED on MAINNET
    if (this.networkGateway !== 'mainnet') return

    try {

      const contractLSP = new ethers.Contract(
        '0x9153ACD675F04Fe16B7df72577F6553526879A6e',
        WAGMIv1Json.abi,
        this.L2Provider
      )

      const contractWAGMIv1 = new ethers.Contract(
        '0xCe055Ea4f29fFB8bf35E852522B96aB67Cbe8197',
        L1ERC20Json.abi,
        this.L2Provider
      )

      const balance = await contractWAGMIv1.connect(this.provider).balanceOf(this.account)
      console.log("You have WAGMIv1:", balance.toString())

      const TX = await contractLSP
        .connect(this.provider.getSigner())
        .settle(
          balance,
          ethers.utils.parseEther("0")
        )
      await TX.wait()
      return TX
    } catch (error) {
      console.log("NS: settle_v1 error:", error)
      return error
    }

  }

  async settle_v2() {

    console.log("NS: settle_v2")

    // ONLY SUPPORTED on L2
    if( this.L1orL2 !== 'L2' ) return

    // ONLY SUPPORTED on MAINNET
    if (this.networkGateway !== 'mainnet') return

    try {

      const contractLSP = new ethers.Contract(
        '0x140Ca41a6eeb484E2a7736b2e8DA836Ffd1bFAb9',
        WAGMIv1Json.abi, // WAGMIv2 contract same as WAGMIv1 contract so can use the same ABI
        this.L2Provider
      )

      const contractWAGMIv2 = new ethers.Contract(
        '0x76B5908ecd0ae3DB23011ae96b7C1f803D63136c',
        L1ERC20Json.abi,
        this.L2Provider
      )

      const balance = await contractWAGMIv2.connect(this.provider).balanceOf(this.account)
      console.log("You have WAGMIv2:", balance.toString())

      const TX = await contractLSP
        .connect(this.provider.getSigner())
        .settle(
          balance,
          ethers.utils.parseEther("0")
        )
      await TX.wait()
      return TX
    } catch (error) {
      console.log("NS: settle_v2 error:", error)
      return error
    }

  }

  async settle_v2OLO() {

    console.log("NS: settle_v2OLO")

    // ONLY SUPPORTED on L2
    if( this.L1orL2 !== 'L2' ) return

    // ONLY SUPPORTED on MAINNET
    if (this.networkGateway !== 'mainnet') return

    try {

      const contractLSP = new ethers.Contract(
        //need to update this address
        '0x353d9d6082aBb5dA7D721ac0f7898484bB5C98F5',
        WAGMIv1Json.abi, // WAGMIv2OLO contract same as WAGMIv1 contract so can use the same ABI
        this.L2Provider
      )

      const contractWAGMIv2OLO = new ethers.Contract(
        '0x49a3e4a1284829160f95eE785a1A5FfE2DD5Eb1D',
        L1ERC20Json.abi,
        this.L2Provider
      )

      const balance = await contractWAGMIv2OLO.connect(this.provider).balanceOf(this.account)
      console.log("You have WAGMIv2OLO:", balance.toString())

      const TX = await contractLSP
        .connect(this.provider.getSigner())
        .settle(
          balance,
          ethers.utils.parseEther("0")
        )

      await TX.wait()
      return TX
    } catch (error) {
      console.log("NS: settle_v2OLO error:", error)
      return error
    }

  }

  //Transfer funds from one account to another, on the L2
  async transfer(address, value_Wei_String, currency) {

    let tx = null

    try {

      if(currency === allAddresses.L2_ETH_Address) {
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

      if(currency === allAddresses.L2_ETH_Address) {

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

  //Transfer funds from one account to another, on the L2
  async transferNFT(recipient, token) {

    console.log("Transferring NFT:", token.address)
    console.log("tokenID:", token.tokenID)
    console.log("Transferring to:", recipient)

    try {

      const contract = new ethers.Contract(
        token.address,
        TuringMonsterJson.abi,
        this.L2Provider
      )

      console.log("contract:",contract)

      const tx = await contract
        .connect(this.provider.getSigner())
        .transferFrom(
            this.account,
            recipient,
            token.tokenID
          )

      const receipt = await tx.wait()
      console.log("NS: NFT transfer TX:", receipt.logs)

      return tx
    } catch (error) {
      console.log("NS: NFT transfer error:", error)
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

        /*
        OMG IS A SPECIAL CASE - allowance needs to be set to zero, and then
        set to actual amount, unless current approval amount is equal to, or
        bigger than, the current approval value
        */
        if( allowance_BN.lt(BigNumber.from(value_Wei_String)) &&
            (currency.toLowerCase() === allTokens.OMG.L1.toLowerCase())
        )
        {
          console.log("Current OMG Token allowance too small - might need to reset to 0, unless it's already zero")
          if (allowance_BN.gt(BigNumber.from("0"))) {
            const approveOMG = await ERC20Contract.approve(
              approveContractAddress,
              ethers.utils.parseEther("0")
            )
            await approveOMG.wait()
            console.log("OMG Token allowance has been set to 0")
          }
        }

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

      /*
      OMG IS A SPECIAL CASE - allowance needs to be set to zero, and then
      set to actual amount, unless current approval amount is equal to, or
      bigger than, the current approval value
      */
      if( allowance_BN.lt(BigNumber.from(value_Wei_String)) &&
          (currency.toLowerCase() === allTokens.OMG.L1.toLowerCase())
      )
      {
        console.log("Current OMG Token allowance too small - might need to reset to 0, unless it's already zero")
        if (allowance_BN.gt(BigNumber.from("0"))) {
          const approveOMG = await ERC20Contract.approve(
            approveContractAddress,
            ethers.utils.parseEther("0")
          )
          await approveOMG.wait()
          console.log("OMG Token allowance has been set to 0")
        }
      }

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

  async approveFastDepositBatch(payload) {
    for (const tokenInput of payload) {
      if (tokenInput.symbol !== 'ETH') {
        const res = await this.approveERC20(
          utils.parseUnits(tokenInput.value, tokenInput.decimals).toString(),
          tokenInput.currency,
          this.L1LPContract.address,
        )
        if (!res) {
          return res
        }
      }
    }
    return true
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
      /*
      OMG IS A SPECIAL CASE - allowance needs to be set to zero, and then
      set to actual amount, unless current approval amount is equal to, or
      bigger than, the current approval value
      */
      if( allowance_BN.lt(BigNumber.from(value_Wei_String)) &&
          (currency.toLowerCase() === allTokens.OMG.L1.toLowerCase())
      )
      {
        console.log("Current OMG Token allowance too small - might need to reset to 0, unless it's already zero")
        if (allowance_BN.gt(BigNumber.from("0"))) {
          const approveOMG = await L1_TEST_Contract.approve(
            allAddresses.L1StandardBridgeAddress,
            ethers.utils.parseEther("0")
          )
          await approveOMG.wait()
          console.log("OMG Token allowance has been set to 0")
        }
      }

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

      const data = {
        "key": process.env.REACT_APP_SPEED_CHECK,
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

      const BobaAllowance = await this.checkAllowance(
        allAddresses.TK_L2BOBA,
        allAddresses.DiscretionaryExitFee
      )

      if (utils.getAddress(currencyAddress) === utils.getAddress(allAddresses.TK_L2BOBA)) {
        BobaApprovalAmount = BobaApprovalAmount.add(value)
      }

      // Should approve BOBA
      if ( BobaAllowance.lt(BobaApprovalAmount) ) {
        const res = await this.approveERC20(
          BobaApprovalAmount,
          allAddresses.TK_L2BOBA,
          allAddresses.DiscretionaryExitFee
        )
        if (!res) return false
      }

      // Should approve other tokens
      if( currencyAddress !== allAddresses.L2_ETH_Address &&
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
        currencyAddress === allAddresses.L2_ETH_Address ?
          { value: value_Wei_String } : {}
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

    if( currencyAddress !== allAddresses.L2_ETH_Address ) {

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

    const tx2 = await DiscretionaryExitFeeContract.populateTransaction.payAndWithdraw(
      allAddresses.L2_ETH_Address,
      utils.parseEther('0.00001'),
      this.L1GasLimit,
      ethers.utils.formatBytes32String(new Date().getTime().toString()),
      { value: utils.parseEther('0.00001') }
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
        tokenSymbol = 'ETH'
        tokenName = 'Ethereum'
        decimals = 18
      } else {
        //getting eth balance
        //console.log("Getting balance for:", tokenAddress)
        tokenBalance = await this.L1_TEST_Contract.attach(tokenAddress).connect(this.L1Provider).balanceOf(allAddresses.L1LPAddress)
        tokenSymbol = await this.L1_TEST_Contract.attach(tokenAddress).connect(this.L1Provider).symbol()
        tokenName = await this.L1_TEST_Contract.attach(tokenAddress).connect(this.L1Provider).name()
        decimals = await this.L1_TEST_Contract.attach(tokenAddress).connect(this.L1Provider).decimals()
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
      L2: allAddresses.L2_ETH_Address
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

      if (tokenAddress === allAddresses.L2_ETH_Address) {
        tokenBalance = await this.L2Provider.getBalance(allAddresses.L2LPAddress)
        tokenSymbol = 'ETH'
        tokenName = 'Ethereum'
        decimals = 18
      } else {
        tokenBalance = await this.L2_TEST_Contract.attach(tokenAddress).connect(this.L2Provider).balanceOf(allAddresses.L2LPAddress)
        tokenSymbol = await this.L2_TEST_Contract.attach(tokenAddress).connect(this.L2Provider).symbol()
        tokenName = await this.L2_TEST_Contract.attach(tokenAddress).connect(this.L2Provider).name()
        decimals = await this.L1_TEST_Contract.attach(tokenAddressL1).connect(this.L1Provider).decimals()
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

    if( currency === allAddresses.L1_ETH_Address || currency === allAddresses.L2_ETH_Address ) {
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
      if( currency !== allAddresses.L2_ETH_Address ) {

        const tx1 = await this.BobaContract
          .populateTransaction
          .approve(
            allAddresses.L2LPAddress,
            utils.parseEther('1.0'),
            otherField
          )

        const approvalGas_BN = await this.provider.estimateGas(tx1)
        approvalCost_BN = approvalGas_BN.mul(gasPrice_BN)
        console.log("Approve cost in ETH:", utils.formatEther(approvalCost_BN))
      }

      // Second, we need the addLiquidity cost
      // all ERC20s will be the same, so use the BOBA contract
      const tx2 = await this.L2LPContract
        .connect(this.provider)
        .populateTransaction
        .addLiquidity(
          utils.parseEther('1.0'),
          this.tokenAddresses['BOBA'].L2,
          otherField
        )
      const stakeGas_BN = await this.provider.estimateGas(tx2)
      stakeCost_BN = stakeGas_BN.mul(gasPrice_BN)
      console.log("addLiquidity cost in ETH:", utils.formatEther(stakeCost_BN))

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

      const opts = {
        fromBlock: -4000
      }
      const receipt = await this.watcher.waitForMessageReceipt(depositTX, opts)
      console.log(' completed swap-on ! L2 tx hash:', receipt.transactionHash)

      const time_stop = new Date().getTime()
      console.log("TX finish time:", time_stop)

      const data = {
        "key": process.env.REACT_APP_SPEED_CHECK,
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
        "key": process.env.REACT_APP_SPEED_CHECK,
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
      tokenAddressLC === allAddresses.L2_ETH_Address ||
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
      tokenAddressLC === allAddresses.L2_ETH_Address ||
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

    if( currencyAddress !== allAddresses.L2_ETH_Address ) {

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

    //in some cases zero not allowed
    const tx2 = await this.L2LPContract
      .connect(this.provider.getSigner())
      .populateTransaction
      .clientDepositL2(
        currencyAddress === allAddresses.L2_ETH_Address ? '1' : '0', //ETH does not allow zero
        currencyAddress,
        currencyAddress === allAddresses.L2_ETH_Address ? { value : '1'} : {}
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

    if( currencyAddress === allAddresses.L2_ETH_Address ) {
      balance_BN = await this.L2Provider.getBalance(this.account)
    }

    const L2BillingContract = new ethers.Contract(
      allAddresses.Proxy__BobaBillingContract,
      L2BillingContractJson.abi,
      this.L2Provider,
    )
    let BobaApprovalAmount = await L2BillingContract.exitFee()

    const BobaAllowance = await this.checkAllowance(
      allAddresses.TK_L2BOBA,
      allAddresses.L2LPAddress,
    )

    try {
      // Approve BOBA first
      if (BobaAllowance.lt(BobaApprovalAmount)) {
        const approveStatus = await this.approveERC20(
          BobaApprovalAmount,
          allAddresses.TK_L2BOBA,
          allAddresses.L2LPAddress
        )
        if (!approveStatus) return false
      }

      // Approve other tokens
      if( currencyAddress !== allAddresses.L2_ETH_Address &&
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
          currencyAddress === allAddresses.L2_ETH_Address ? { value : '1' } : {}
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

      if(currencyAddress === allAddresses.L2_ETH_Address) {
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
          currencyAddress === allAddresses.L2_ETH_Address ? { value : balance_BN.sub(depositCost_BN) } : {}
        )

      //at this point the tx has been submitted, and we are waiting...
      await depositTX.wait()

      const block = await this.L2Provider.getTransaction(depositTX.hash)
      console.log(' block:', block)

      //closes the modal
      updateSignatureStatus_exitLP(true)

      const opts = {
        fromBlock: -4000
      }
      const receipt = await this.fastWatcher.waitForMessageReceipt(depositTX, opts)
      console.log(' completed Deposit! L1 tx hash:', receipt.transactionHash)

      const time_stop = new Date().getTime()
      console.log("TX finish time:", time_stop)

      const data = {
        "key": process.env.REACT_APP_SPEED_CHECK,
        "hash": depositTX.hash,
        "l1Tol2": false, //since we are going L2->L1
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
    let BobaApprovalAmount = await L2BillingContract.exitFee()

    const BobaAllowance = await this.checkAllowance(
      allAddresses.TK_L2BOBA,
      allAddresses.L2LPAddress,
    )

    try {
      // Approve BOBA first
      if (utils.getAddress(currencyAddress) === utils.getAddress(allAddresses.TK_L2BOBA)) {
        BobaApprovalAmount = BobaApprovalAmount.add(BigNumber.from(value_Wei_String))
      }
      if (BobaAllowance.lt(BobaApprovalAmount)) {
        const approveStatus = await this.approveERC20(
          BobaApprovalAmount,
          allAddresses.TK_L2BOBA,
          allAddresses.L2LPAddress
        )
        if (!approveStatus) return false
      }

      // Approve other tokens
      if( currencyAddress !== allAddresses.L2_ETH_Address &&
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
          currencyAddress === allAddresses.L2_ETH_Address ? { value: value_Wei_String } : {}
        )

      //at this point the tx has been submitted, and we are waiting...
      await depositTX.wait()

      const block = await this.L2Provider.getTransaction(depositTX.hash)
      console.log(' block:', block)

      //closes the modal
      updateSignatureStatus_exitLP(true)

      const opts = {
        fromBlock: -4000
      }
      const receipt = await this.fastWatcher.waitForMessageReceipt(depositTX, opts)
      console.log(' completed Deposit! L1 tx hash:', receipt.transactionHash)

      const time_stop = new Date().getTime()
      console.log("TX finish time:", time_stop)

      const data = {
        "key": process.env.REACT_APP_SPEED_CHECK,
        "hash": depositTX.hash,
        "l1Tol2": false, //since we are going L2->L1
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
      console.log("NS: depositL2LP error:", error)
      return error
    }
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
        const [l2LPFeeRate, l2LPBalance, l2Liquidity] = await getInfo(L1_ETH_Address, L2_ETH_Address)
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

}

const networkService = new NetworkService()
export default networkService
