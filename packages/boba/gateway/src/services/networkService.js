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

import {formatEther, parseEther} from '@ethersproject/units'
import {CrossChainMessenger,} from '@eth-optimism/sdk'

import {BigNumber, ethers, utils} from 'ethers'

import store from 'store'
import {groupBy, orderBy} from 'util/lodash';
import BN from 'bn.js'

import {logAmount} from 'util/amountConvert'
import {getToken} from 'actions/tokenAction'

import {addBobaFee,} from 'actions/setupAction'

import {
  updateSignatureStatus_depositLP,
  updateSignatureStatus_exitLP,
  updateSignatureStatus_exitTRAD
} from 'actions/signAction'

// Base contracts
// import L1StandardBridgeJson from '@eth-optimism/contracts/artifacts/contracts/L1/messaging/L1StandardBridge.sol/L1StandardBridge.json'
import L2StandardBridgeJson
  from '@eth-optimism/contracts/artifacts/contracts/L2/messaging/L2StandardBridge.sol/L2StandardBridge.json'
import L2ERC20Json from '@eth-optimism/contracts/artifacts/contracts/standards/L2StandardERC20.sol/L2StandardERC20.json'
import OVM_GasPriceOracleJson
  from '@eth-optimism/contracts/artifacts/contracts/L2/predeploys/OVM_GasPriceOracle.sol/OVM_GasPriceOracle.json'

// Boba contracts
import DiscretionaryExitFeeJson
  from '@boba/contracts/artifacts/contracts/DiscretionaryExitFee.sol/DiscretionaryExitFee.json'
import L1LPJson from '@boba/contracts/artifacts/contracts/LP/L1LiquidityPool.sol/L1LiquidityPool.json'
import TeleportationJson from '@boba/contracts/artifacts/contracts/Teleportation.sol/Teleportation.json'
import L2LPJson from '@boba/contracts/artifacts/contracts/LP/L2LiquidityPool.sol/L2LiquidityPool.json'
import L2SaveJson from '@boba/contracts/artifacts/contracts/BobaFixedSavings.sol/BobaFixedSavings.json'
import Boba from "@boba/contracts/artifacts/contracts/DAO/governance-token/BOBA.sol/BOBA.json"
import GovernorBravoDelegate
  from "@boba/contracts/artifacts/contracts/DAO/governance/GovernorBravoDelegate.sol/GovernorBravoDelegate.json"
import GovernorBravoDelegator
  from "@boba/contracts/artifacts/contracts/DAO/governance/GovernorBravoDelegator.sol/GovernorBravoDelegator.json"
import L2BillingContractJson from "@boba/contracts/artifacts/contracts/L2BillingContract.sol/L2BillingContract.json"

//special one-off locations
import L1ERC20Json from '../deployment/contracts/L1ERC20.json'
import TuringMonsterJson from "../deployment/contracts/NFTMonsterV2.json"
import AuthenticatedFaucetJson from "../deployment/contracts/AuthenticatedFaucet.json"

//WAGMI ABIs
import WAGMIv0Json from "../deployment/contracts/WAGMIv0.json"
import WAGMIv1Json from "../deployment/contracts/WAGMIv1.json"

//veBoba ABIs
import veJson from "../deployment/contracts/ve.json"
import voterJson from "../deployment/contracts/BaseV1Voter.json"

// multi chain alt l1s ABI's
// import AltL1BridgeJson from "../deployment/contracts/crosschain/AltL1Bridge.json"
import ETHL1BridgeJson from "../deployment/contracts/crosschain/EthBridge.json"
import L2StandardERC20Json from "../deployment/contracts/crosschain/L2StandardERC20.json"
import LZEndpointMockJson from "../deployment/contracts/crosschain/LZEndpointMock.json"

import omgxWatcherAxiosInstance from 'api/omgxWatcherAxios'
import coinGeckoAxiosInstance from 'api/coinGeckoAxios'
import metaTransactionAxiosInstance from 'api/metaTransactionAxios'

import {sortRawTokens} from 'util/common'
import { graphQLService } from "./graphql.service"

import tokenInfo from "@boba/register/addresses/tokenInfo"

import {isDevBuild, Layer, MIN_NATIVE_L1_BALANCE} from 'util/constant'
import {getPoolDetail} from 'util/poolDetails'
import {CHAIN_ID_LIST, getNetworkDetail, getRpcUrl, NETWORK, NETWORK_TYPE, pingRpcUrl} from 'util/network/network.util'
import appService from './app.service'
import walletService from './wallet.service'

import BobaGasPriceOracleABI from './abi/BobaGasPriceOracle.abi'
import L1StandardBridgeABI from './abi/L1StandardBridge.abi'
import {setFetchDepositTxBlock} from 'actions/bridgeAction';
import {LAYER} from "../containers/history/types";

const ERROR_ADDRESS = '0x0000000000000000000000000000000000000000'
const L1_ETH_Address = '0x0000000000000000000000000000000000000000'
const L2_ETH_Address = '0x4200000000000000000000000000000000000006'
// const L2MessengerAddress = '0x4200000000000000000000000000000000000007'
// const L2StandardBridgeAddress = '0x4200000000000000000000000000000000000010'
const L2GasOracle = '0x420000000000000000000000000000000000000F'
const L2_SECONDARYFEETOKEN_ADDRESS = '0x4200000000000000000000000000000000000023'

let allTokens = {}

class NetworkService {

  constructor() {

    this.account = null    // the user's account
    this.L1Provider = null // L1 Infura
    this.L2Provider = null // L2 to Boba replica
    this.provider = null   // from MetaMask
    this.chainId = null // from Metamask

    this.environment = null

    // L1 or L2
    this.L1orL2 = null
    this.networkGateway = null
    this.networkType = null


    // Watcher
    this.watcher = null
    this.fastWatcher = null

    // addresses
    this.AddressManagerAddress = null
    this.AddressManager = null

    this.L1_TEST_Contract = null
    this.L2_TEST_Contract = null
    this.L2_ETH_Contract = null

    this.tokenAddresses = null

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

    // Gas oracle
    this.gasOracleContract = null

    // swap data for calculating the l1 security fee
    this.payloadForL1SecurityFee = null
    // fast deposit in batch
    this.payloadForFastDepositBatchCost = null

    // support token
    this.supportedTokens = []
    this.supportedTokenAddresses = {}

    // support alt l1 tokens
    this.supportedAltL1Chains = []

    // token info
    this.tokenInfo = {}

    // newly added properties to network services.
    this.addresses = {}
    this.network = null;
    this.networkConfig = null

    // wallet service
    this.walletService = walletService
  }

  async getBobaFeeChoice() {

    const bobaFeeContract = new ethers.Contract(
      this.addresses.Boba_GasPriceOracle,
      BobaGasPriceOracleABI,
      this.L2Provider
    )

    try {
      let priceRatio = await bobaFeeContract.priceRatio()

      let feeChoice;
      if (this.networkGateway === NETWORK.ETHEREUM) {
        feeChoice = await bobaFeeContract.bobaFeeTokenUsers(this.account)
      } else {
        // this returns weather the secondary token getting use as tokenfee
        feeChoice = await bobaFeeContract.secondaryFeeTokenUsers(this.account)
        // if it's false which means boba is getting used as tokenfee which is default value.
        feeChoice = !feeChoice;
      }
      const bobaFee = {
        priceRatio: priceRatio.toString(),
        feeChoice
      }
      await addBobaFee(bobaFee)
      return bobaFee

    } catch (error) {

      console.log(error)
      return error
    }
  }

  async estimateMinL1NativeTokenForFee() {
    if (this.L1orL2 !== 'L2') return 0;

    if (this.networkGateway === NETWORK.ETHEREUM) {
      // for ethereum l1 fee is always const to 0.002.
      return MIN_NATIVE_L1_BALANCE
    } else {
      // for alt l1 this fee can change
      const bobaFeeContract = new ethers.Contract(
        this.addresses.Boba_GasPriceOracle,
        BobaGasPriceOracleABI,
        this.provider.getSigner()
      )

      const minTokenForFee = await bobaFeeContract.secondaryFeeTokenMinimum();

      return logAmount(minTokenForFee.toString(), 18)
    }

  }

  async switchFee(targetFee) {

    if (this.L1orL2 !== 'L2') return

    const bobaFeeContract = new ethers.Contract(
      this.addresses.Boba_GasPriceOracle,
      BobaGasPriceOracleABI,
      this.provider.getSigner()
    )

    try {

      let tx = null

      if (targetFee === 'BOBA') {
        tx = await bobaFeeContract.useBobaAsFeeToken()
        await tx.wait()

      } else if (targetFee === 'ETH') {
        tx = await bobaFeeContract.useETHAsFeeToken()
        await tx.wait()
      } else if (targetFee === this.L1NativeTokenSymbol) {
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
      {name: 'name', type: 'string'},
      {name: 'version', type: 'string'},
      {name: 'chainId', type: 'uint256'},
      {name: 'verifyingContract', type: 'address'},
    ]
    const Permit = [
      {name: 'owner', type: 'address'},
      {name: 'spender', type: 'address'},
      {name: 'value', type: 'uint256'},
      {name: 'nonce', type: 'uint256'},
      {name: 'deadline', type: 'uint256'},
    ]

    const owner = this.account
    const spender = this.addresses.Proxy__Boba_GasPriceOracle

    const Boba_GasPriceOracle = new ethers.Contract(
      this.addresses.Proxy__Boba_GasPriceOracle,
      BobaGasPriceOracleABI,
      this.provider.getSigner()
    )

    let rawValue;
    if (this.networkGateway === NETWORK.ETHEREUM) {
      rawValue = await Boba_GasPriceOracle.getBOBAForSwap();
    } else {
      rawValue = await Boba_GasPriceOracle.getSecondaryFeeTokenForSwap();
    }

    let value = (rawValue).toString()

    const nonce = (await this.BobaContract.nonces(this.account)).toNumber()
    const deadline = Math.floor(Date.now() / 1000) + 300
    const verifyingContract = this.BobaContract.address

    const name = await this.BobaContract.name()
    const version = '1'
    const chainId = (await this.L2Provider.getNetwork()).chainId

    const data = {
      primaryType: 'Permit',
      types: {EIP712Domain, Permit},
      domain: {name, version, chainId, verifyingContract},
      message: {owner, spender, value, nonce, deadline},
    }

    let signature

    try {
      signature = await this.provider.send('eth_signTypedData_v4', [this.account, JSON.stringify(data)])
    } catch (error) {
      return error
    }

    try {
      // change url if network is ethereum
      const swapUrl = this.networkGateway === NETWORK.ETHEREUM ? '/send.swapBOBAForETH' : '/send.swapSecondaryFeeToken'
      const response = await metaTransactionAxiosInstance(
        this.networkConfig
      ).post(swapUrl, { owner, spender, value, deadline, signature, data })
      await this.getBobaFeeChoice()
    } catch (error) {
      let errorData = error.response.data.error
      if (errorData.hasOwnProperty('error')) {
        errorData = errorData.error.error.body
      }
      return errorData
    }
  }

  async getAddress(contractName, varToSet) {
    const address = await this.AddressManager.getAddress(contractName)
    if (address === ERROR_ADDRESS) {
      return false
    } else {
      this.addresses = {
        ...this.addresses,
        [varToSet]: address
      }
      return true
    }
  }

  async getAddressCached(cache, contractName, varToSet) {
    const address = cache[contractName]
    if (typeof (address) === 'undefined') {
      return false
    } else {
      this.addresses = {
        ...this.addresses,
        [varToSet]: address
      }
      return true
    }
  }

  getAllAddresses() {
    return this.addresses;
  }

  async initializeBase({
                         networkGateway: network,
                         networkType
                       }) {

    this.network = network; //// refer this in other services and clean up iteratively.
    this.networkGateway = network // e.g. mainnet | goerli | ...
    this.networkType = networkType // e.g. mainnet | goerli | ...

    // defines the set of possible networks along with chainId for L1 and L2
    const networkDetail = getNetworkDetail({
      network,
      networkType
    })

    this.networkConfig = networkDetail;

    try {

      if (NETWORK[network]) {
        this.payloadForL1SecurityFee = networkDetail.payloadForL1SecurityFee
        this.payloadForFastDepositBatchCost = networkDetail.payloadForFastDepositBatchCost
        this.gasEstimateAccount = networkDetail.gasEstimateAccount
      }

      let activeL1RpcURL = networkDetail['L1']['rpcUrl'][0]
      for (const rpcURL of networkDetail['L1']['rpcUrl']) {
        if (await pingRpcUrl(rpcURL)) {
          activeL1RpcURL = rpcURL
          break
        }
      }

      this.L1Provider = new ethers.providers.StaticJsonRpcProvider(
        activeL1RpcURL
      )

      this.L2Provider = new ethers.providers.StaticJsonRpcProvider(
        networkDetail['L2']['rpcUrl']
      )

      this.L1NativeTokenSymbol = networkDetail['L1']['symbol']
      this.L1NativeTokenName = networkDetail['L1']['tokenName'] || this.L1NativeTokenSymbol

      appService.setupInitState({
        l1Token: this.L1NativeTokenSymbol,
        l1TokenName: this.L1NativeTokenName
      })

      // get the tokens based on l1ChainId
      const chainId = (await this.L1Provider.getNetwork()).chainId
      this.tokenInfo = tokenInfo[chainId]

      // fetch supported tokens, addresses, assets for network selected.
      const tokenAsset = appService.fetchSupportedAssets({
        network,
        networkType
      })

      this.supportedTokens = tokenAsset.tokens;
      this.supportedTokenAddresses = tokenAsset.tokenAddresses;
      this.supportedAltL1Chains = tokenAsset.altL1Chains;

      let addresses = {};
      // setting up all address;
      if (!!NETWORK[network]) {
        addresses = appService.fetchAddresses({
          network,
          networkType
        });
      }

      this.addresses = addresses
      console.log("LOADED ADDRESSES", this.addresses)

      // this.AddressManagerAddress = nw[networkGateway].addressManager
      // console.log("AddressManager address:",this.AddressManagerAddress)

      // this.AddressManager = new ethers.Contract(
      //   this.AddressManagerAddress,
      //   AddressManagerJson.abi,
      //   this.L1Provider
      // )
      // //console.log("AddressManager Contract:",this.AddressManager)

      if (network === NETWORK.ETHEREUM) {
        // check only if selected network is ETHEREUM
        if (!(await this.getAddressCached(this.addresses, 'BobaMonsters', 'BobaMonsters'))) return
        if (!(await this.getAddressCached(this.addresses, 'Proxy__L1LiquidityPool', 'L1LPAddress'))) return
        if (!(await this.getAddressCached(this.addresses, 'Proxy__L2LiquidityPool', 'L2LPAddress'))) return
        if (!(await this.getAddressCached(this.addresses, 'Proxy__BobaFixedSavings', 'BobaFixedSavings'))) return
      }

      if (!(await this.getAddressCached(this.addresses, 'Proxy__L1CrossDomainMessenger', 'L1MessengerAddress'))) return
      if (!(await this.getAddressCached(this.addresses, 'Proxy__L1CrossDomainMessengerFast', 'L1FastMessengerAddress'))) return
      if (!(await this.getAddressCached(this.addresses, 'Proxy__L1StandardBridge', 'L1StandardBridgeAddress'))) return
      if (!(await this.getAddressCached(this.addresses, 'Proxy__Boba_GasPriceOracle', 'Boba_GasPriceOracle'))) return

      // not critical
      this.getAddressCached(this.addresses, 'DiscretionaryExitFee', 'DiscretionaryExitFee')

      this.L1StandardBridgeContract = new ethers.Contract(
        this.addresses.L1StandardBridgeAddress,
        L1StandardBridgeABI,
        this.L1Provider
      )

      const tokenList = {}

      this.supportedTokens.forEach((key) => {
        const L1a = this.addresses['TK_L1' + key]
        const L2a = this.addresses['TK_L2' + key]

        if (key === 'xBOBA') {
          if (L2a === ERROR_ADDRESS) {
            return false
          } else {
            tokenList[key] = {
              'L1': 'xBOBA',
              'L2': L2a
            }
          }
        }

        // NOTE: if not in address manager then refer it from token assets config.
        if (typeof L1a === 'undefined' || typeof L2a === 'undefined') {
          if (typeof this.supportedTokenAddresses[key] !== 'undefined') {
            tokenList[key] = this.supportedTokenAddresses[key]
          }
          return false
        } else {
          tokenList[key] = {
            'L1': L1a,
            'L2': L2a
          }
        }
      })

      this.tokenAddresses = tokenList
      allTokens = tokenList;

      if (this.addresses.L2StandardBridgeAddress !== null) {
        this.L2StandardBridgeContract = new ethers.Contract(
          this.addresses.L2StandardBridgeAddress,
          L2StandardBridgeJson.abi,
          this.L2Provider
        )
      }

      this.L2_ETH_Contract = new ethers.Contract(
        this.addresses.L2_ETH_Address,
        L2ERC20Json.abi,
        this.L2Provider
      )

      /*The test token*/
      this.L1_TEST_Contract = new ethers.Contract(
        allTokens.BOBA.L1, //this will get changed anyway when the contract is used
        L1ERC20Json.abi,
        this.L1Provider
      )

      this.L2_TEST_Contract = new ethers.Contract(
        allTokens.BOBA.L2, //this will get changed anyway when the contract is used
        L2ERC20Json.abi,
        this.L2Provider
      )

      // Teleportation
      if (this.addresses.Proxy__L1Teleportation) {
        // not deployed on mainnets yet
        this.Teleportation = new ethers.Contract(
          // correct one is used accordingly
          this.addresses.Proxy__L1Teleportation,
          TeleportationJson.abi,
        )
      }

      // Liquidity pools

      this.L1LPContract = new ethers.Contract(
        this.addresses.L1LPAddress,
        L1LPJson.abi,
        this.L1Provider
      )
      this.L2LPContract = new ethers.Contract(
        this.addresses.L2LPAddress,
        L2LPJson.abi,
        this.L2Provider
      )

      this.watcher = new CrossChainMessenger({
        l1SignerOrProvider: this.L1Provider,
        l2SignerOrProvider: this.L2Provider,
        l1ChainId: chainId,
        fastRelayer: false,
      })
      this.fastWatcher = new CrossChainMessenger({
        l1SignerOrProvider: this.L1Provider,
        l2SignerOrProvider: this.L2Provider,
        l1ChainId: chainId,
        fastRelayer: true,
      })

      let l2SecondaryFeeTokenAddress = L2_SECONDARYFEETOKEN_ADDRESS
      if (NETWORK.ETHEREUM === network && chainId === 1) {
        l2SecondaryFeeTokenAddress = allTokens.BOBA.L2
      }
      this.BobaContract = new ethers.Contract(
        l2SecondaryFeeTokenAddress,
        Boba.abi,
        this.L2Provider
      )

      if (NETWORK.ETHEREUM === network) {
        this.xBobaContract = new ethers.Contract(
          allTokens.xBOBA.L2,
          Boba.abi,
          this.L2Provider
        )

        if (!(await this.getAddressCached(this.addresses, 'GovernorBravoDelegate', 'GovernorBravoDelegate'))) return
        if (!(await this.getAddressCached(this.addresses, 'GovernorBravoDelegator', 'GovernorBravoDelegator'))) return

        this.delegateContract = new ethers.Contract(
          this.addresses.GovernorBravoDelegate,
          GovernorBravoDelegate.abi,
          this.L2Provider
        )

        this.delegatorContract = new ethers.Contract(
          this.addresses.GovernorBravoDelegator,
          GovernorBravoDelegator.abi,
          this.L2Provider
        )

        this.delegatorContractV2 = new ethers.Contract(
          this.addresses.GovernorBravoDelegatorV2,
          GovernorBravoDelegator.abi,
          this.L2Provider
        )
      }

      this.gasOracleContract = new ethers.Contract(
        L2GasOracle,
        OVM_GasPriceOracleJson.abi,
        this.L2Provider
      )

      return 'enabled'

    } catch (error) {
      console.log(`NS: ERROR: InitializeBase `, error)
      return false
    }
  }

  async initializeAccount({chainIdChanged}) {

    try {

      if (!window.ethereum) {
        return 'nometamask'
      }

      this.walletService.bindProviderListeners()

      // connect to the wallet
      this.provider = this.walletService.provider
      this.chainId = (await this.provider.getNetwork()).chainId
      this.account = await this.provider.getSigner().getAddress()

      let chainId = chainIdChanged
      if (!chainId) {
        chainId = await this.provider.getNetwork().then(nt => nt.chainId)
      }

      // defines the set of possible networks along with chainId for L1 and L2
      const networkDetail = getNetworkDetail({
        network: this.networkGateway,
        networkType: this.networkType
      })

      const L1ChainId = networkDetail['L1']['chainId']
      const L2ChainId = networkDetail['L2']['chainId']

      // there are numerous possible chains we could be on also, either L1 or L2
      // at this point, we only know whether we want to be on which network etc

      if (!!NETWORK[this.networkGateway] && chainId === L2ChainId) {
        this.L1orL2 = 'L2';
      } else if (!!NETWORK[this.networkGateway] && chainId === L1ChainId) {
        this.L1orL2 = 'L1';
      } else {
        return 'wrongnetwork'
      }

      // this should not do anything unless we changed chains
      if (this.L1orL2 === 'L2') {
        await this.getBobaFeeChoice()
      }

      return this.L1orL2 // return the layer we are actually on

    } catch (error) {
      console.log(`NS: ERROR: InitializeAccount `, error)
      return false
    }
  }


  async switchChain(targetLayer) {
    // ignore request if we are already on the target layer
    if (!targetLayer) {
      return false
    }

    const networkDetail = getNetworkDetail({
      network: this.networkGateway,
      networkType: this.networkType
    })

    const targetIDHex = networkDetail[targetLayer].chainIdHex
    const rpcURL = targetLayer === 'L1' ? this.L1Provider.connection.url : networkDetail[targetLayer].rpcUrl
    const chainParam = {
      chainId: '0x' + networkDetail[targetLayer].chainId.toString(16),
      chainName: networkDetail[targetLayer].name,
      rpcUrls: [rpcURL],
      nativeCurrency: {
        name: networkDetail[targetLayer].tokenName,
        symbol: networkDetail[targetLayer].symbol,
        decimals: 18,
      },
      blockExplorerUrls: [networkDetail[targetLayer]?.blockExplorerUrl?.slice(0, -1)]
    }

    return await this.walletService.switchChain(targetIDHex, chainParam)
  }

  async claimAuthenticatedTestnetTokens(tweetId) {
    // Only Testnet
    const contract = new ethers.Contract(
      this.addresses.AuthenticatedFaucet,
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
      console.log("NS: getL1FeeBalance error:", error)
      return error
    }
  }

  async getL2BalanceETH() {
    try {
      const balance = await this.L2Provider.getBalance(this.account)
      return utils.formatEther(balance)
    } catch (error) {
      console.log("NS: getL2BalanceETH error:", error)
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
      console.log("NS: getL2BalanceBOBA error:", error)
      return error
    }
  }


  async getBalances() {

    try {

      let layer1Balances, layer2Balances;

      if (this.network === NETWORK.ETHEREUM) {
        layer1Balances = [
          {
            address: this.addresses.L1_ETH_Address,
            addressL2: this.addresses.L2_ETH_Address,
            currency: this.addresses.L1_ETH_Address,
            symbol: 'ETH',
            decimals: 18,
            balance: new BN(0),
          },
        ]

        layer2Balances = [
          {
            address: this.addresses.L2_ETH_Address,
            addressL1: this.addresses.L1_ETH_Address,
            addressL2: this.addresses.L2_ETH_Address,
            currency: this.addresses.L1_ETH_Address,
            symbol: 'ETH',
            decimals: 18,
            balance: new BN(0),
          },
        ]
      } else {
        layer1Balances = [
          {
            address: this.addresses.L1_ETH_Address,
            addressL2: this.addresses["TK_L2" + networkService.L1NativeTokenSymbol],
            currency: this.addresses.L1_ETH_Address,
            symbol: networkService.L1NativeTokenSymbol,
            decimals: 18,
            balance: new BN(0),
          },
        ]

        layer2Balances = [
          {
            address: this.addresses.L2_ETH_Address,
            addressL1: this.addresses.TK_L1BOBA,
            addressL2: this.addresses.L2_ETH_Address,
            currency: this.addresses.TK_L1BOBA,
            symbol: 'BOBA',
            decimals: 18,
            balance: new BN(0),
          },
        ]

      }

      // Always check ETH
      const layer1Balance = await this.L1Provider.getBalance(this.account)
      const layer2Balance = await this.L2Provider.getBalance(this.account)

      layer1Balances[0].balance = new BN(layer1Balance.toString())
      layer2Balances[0].balance = new BN(layer2Balance.toString())

      const state = store.getState()
      const tA = Object.values(state.tokenList);

      const tokenC = new ethers.Contract(
        this.addresses.L1_ETH_Address,
        L1ERC20Json.abi,
        this.L1Provider
      )

      const getERC20Balance = async (token, tokenAddress, layer, provider) => {
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
        if (token.addressL1 === null) return
        if (token.addressL2 === null) return
        if (this.network === NETWORK.ETHEREUM) {
          if (token.addressL1 === this.addresses.L1_ETH_Address) return
          if (token.addressL2 === this.addresses.L2_ETH_Address) return
        } else {
          if (token.addressL1 === this.addresses.L1_ETH_Address) {
            return getBalancePromise.push(getERC20Balance(token, token.addressL2, "L2", this.L2Provider))

          }
          if (token.addressL2 === this.addresses.L2_BOBA_Address) {
            return getBalancePromise.push(getERC20Balance(token, token.addressL1, "L1", this.L1Provider))
          }
        }

        if ([
          'xBOBA',
          'WAGMIv0',
          'WAGMIv1',
          'WAGMIv2',
          'WAGMIv2-Oolong',
          'WAGMIv3',
          'WAGMIv3-Oolong',
          'OLO'
        ].includes(token.symbolL1)) {
          //there is no L1 xBOBA, WAGMIv0, WAGMIv1, WAGMIv2, WAGMIv2OLO, WAGMIv3, WAGMIv3OLO, OLO
          getBalancePromise.push(getERC20Balance(token, token.addressL2, "L2", this.L2Provider))
        } else {
          getBalancePromise.push(getERC20Balance(token, token.addressL1, "L1", this.L1Provider))
          getBalancePromise.push(getERC20Balance(token, token.addressL2, "L2", this.L2Provider))
        }
      })

      const tokenBalances = await Promise.allSettled(getBalancePromise).then(
        (results) =>
          results
            .filter((result) => result.status === 'fulfilled')
            .map((result) => result.value)
      )

      tokenBalances.forEach((token) => {
        if (token.layer === 'L1' &&
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
  /******
   * Deposit ETH from L1 to L2.
   * Deposit ETH from L1 to another L2 account.
   * */

  async depositETHL2({
                       recipient = null,
                       value_Wei_String
                     }) {

    try {
      setFetchDepositTxBlock(false);

      let depositTX;
      if (this.network === NETWORK.ETHEREUM) {
        if (!recipient) {
          depositTX = await this.L1StandardBridgeContract
            .connect(this.provider.getSigner())
            .depositETH(
              this.L2GasLimit,
              utils.formatBytes32String(new Date().getTime().toString()),
              {
                value: value_Wei_String
              }
            )
        } else {
          depositTX = await this.L1StandardBridgeContract
            .connect(this.provider.getSigner())
            .depositETHTo(
              recipient,
              this.L2GasLimit,
              utils.formatBytes32String(new Date().getTime().toString()),
              {
                value: value_Wei_String
              }
            )
        }
      } else {
        if (!recipient) {
          depositTX = await this.L1StandardBridgeContract
            .connect(this.provider.getSigner())
            .depositNativeToken(
              this.L2GasLimit,
              utils.formatBytes32String(new Date().getTime().toString()),
              {
                value: value_Wei_String
              }
            )
        } else {
          depositTX = await this.L1StandardBridgeContract
            .connect(this.provider.getSigner())
            .depositNativeTokenTo(
              recipient,
              this.L2GasLimit,
              utils.formatBytes32String(new Date().getTime().toString()),
              {
                value: value_Wei_String
              }
            )
        }
      }

      setFetchDepositTxBlock(true);

      //at this point the tx has been submitted, and we are waiting...
      await depositTX.wait()

      const opts = {
        fromBlock: -4000
      }

      const receipt = await this.watcher.waitForMessageReceipt(depositTX, opts)
      const txReceipt = receipt.transactionReceipt;
      console.log('completed Deposit! L2 tx hash:', receipt.transactionReceipt)
      return txReceipt
    } catch (error) {
      console.log("NS: depositETHL2 error:", error)
      return error
    }
  }

  async settle_v0() {

    console.log("NS: settle_v0")

    // ONLY SUPPORTED on L2
    if (this.L1orL2 !== 'L2') return

    // ONLY SUPPORTED on MAINNET
    if (!(this.networkGateway === NETWORK.ETHEREUM && this.networkType === NETWORK_TYPE.MAINNET)) {
      return
    }

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
    if (this.L1orL2 !== 'L2') return

    // ONLY SUPPORTED on MAINNET
    if (!(this.networkGateway === NETWORK.ETHEREUM && this.networkType === NETWORK_TYPE.MAINNET)) {
      return
    }

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
    if (this.L1orL2 !== 'L2') return

    // ONLY SUPPORTED on MAINNET
    if (!(this.networkGateway === NETWORK.ETHEREUM && this.networkType === NETWORK_TYPE.MAINNET)) {
      return
    }

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
    if (this.L1orL2 !== 'L2') return

    // ONLY SUPPORTED on MAINNET
    if (!(this.networkGateway === NETWORK.ETHEREUM && this.networkType === NETWORK_TYPE.MAINNET)) {
      return
    }

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

  async settle_v3() {

    console.log("NS: settle_v3")

    // ONLY SUPPORTED on L2
    if (this.L1orL2 !== 'L2') return

    // ONLY SUPPORTED on MAINNET
    if (!(this.networkGateway === NETWORK.ETHEREUM && this.networkType === NETWORK_TYPE.MAINNET)) {
      return
    }

    try {

      const contractLSP = new ethers.Contract(
        '0x878221C39a7a279E6f19858AaE48875d4B1e4f5e',
        WAGMIv1Json.abi, // WAGMIv2 contract same as WAGMIv1 contract so can use the same ABI
        this.L2Provider
      )

      const contractWAGMIv3 = new ethers.Contract(
        '0xC6158B1989f89977bcc3150fC1F2eB2260F6cabE',
        L1ERC20Json.abi,
        this.L2Provider
      )

      const balance = await contractWAGMIv3.connect(this.provider).balanceOf(this.account)
      console.log("You have WAGMIv3:", balance.toString())

      const TX = await contractLSP
        .connect(this.provider.getSigner())
        .settle(
          balance,
          ethers.utils.parseEther("0")
        )
      await TX.wait()
      return TX
    } catch (error) {
      console.log("NS: settle_v3 error:", error)
      return error
    }

  }

  async settle_v3OLO() {

    console.log("NS: settle_v3OLO")

    // ONLY SUPPORTED on L2
    if (this.L1orL2 !== 'L2') return

    // ONLY SUPPORTED on MAINNET
    if (!(this.networkGateway === NETWORK.ETHEREUM && this.networkType === NETWORK_TYPE.MAINNET)) {
      return
    }

    try {

      const contractLSP = new ethers.Contract(
        //need to update this address
        '0xDd3BDD13b1c123AE340f0Ba63BA4B172d335a92C',
        WAGMIv1Json.abi, // WAGMIv2OLO contract same as WAGMIv1 contract so can use the same ABI
        this.L2Provider
      )

      const contractWAGMIv3OLO = new ethers.Contract(
        '0x70bf3c5B5d80C4Fece8Bde0fCe7ef38B688463d4',
        L1ERC20Json.abi,
        this.L2Provider
      )

      const balance = await contractWAGMIv3OLO.connect(this.provider).balanceOf(this.account)
      console.log("You have WAGMIv3OLO:", balance.toString())

      const TX = await contractLSP
        .connect(this.provider.getSigner())
        .settle(
          balance,
          ethers.utils.parseEther("0")
        )

      await TX.wait()
      return TX
    } catch (error) {
      console.log("NS: settle_v3OLO error:", error)
      return error
    }

  }

  //Transfer funds from one account to another, on the L2
  async transfer(address, value_Wei_String, currency) {

    let tx = null

    try {

      if (currency === this.addresses.L2_ETH_Address) {
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

      if (currency === this.addresses.L2_ETH_Address) {

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

        gas_BN = await this.L2Provider.estimateGas(tx)

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

      console.log("contract:", contract)

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
    console.log("currencyAddress", currencyAddress)
    console.log("targetContract", targetContract)
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
        this.addresses.L2LPAddress
      )

      //let depositAmount_BN = new BN(value_Wei_String)
      let depositAmount_BN = BigNumber.from(value_Wei_String)

      if (depositAmount_BN.gt(allowance_BN)) {
        const approveStatus = await L2ERC20Contract.approve(
          this.addresses.L2LPAddress,
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
    const approveContractAddress = this.addresses.L1LPAddress

    let allowance_BN = BigNumber.from("0")
    let allowed = false

    try {

      const ERC20Contract = new ethers.Contract(
        currency,
        L1ERC20Json.abi,
        this.provider.getSigner()
      )

      if (currency !== this.addresses.L1_ETH_Address) {

        let allowance_BN = await ERC20Contract.allowance(
          this.account,
          approveContractAddress
        )
        console.log("Initial allowance:", allowance_BN)

        /*
        OMG IS A SPECIAL CASE - allowance needs to be set to zero, and then
        set to actual amount, unless current approval amount is equal to, or
        bigger than, the current approval value
        */
        if (this.networkGateway === NETWORK.ETHEREUM
          && allowance_BN.lt(BigNumber.from(value_Wei_String)) &&
          (currency.toLowerCase() === allTokens.OMG.L1.toLowerCase())
        ) {
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

      if (!allowed) {
        //and now, the normal allowance transaction
        const approveStatus = await ERC20Contract.approve(
          approveContractAddress,
          value_Wei_String
        )
        await approveStatus.wait()
        console.log("ERC 20 L1 Staking approved:", approveStatus)
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
    approveContractAddress = this.addresses.L1StandardBridgeAddress,
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
      console.log("Initial Allowance is:", allowance_BN)

      /*
      OMG IS A SPECIAL CASE - allowance needs to be set to zero, and then
      set to actual amount, unless current approval amount is equal to, or
      bigger than, the current approval value
      */
      if (this.networkGateway === NETWORK.ETHEREUM &&
        allowance_BN.lt(BigNumber.from(value_Wei_String)) &&
        (currency.toLowerCase() === allTokens.OMG.L1.toLowerCase())
      ) {
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
      console.log("Second Allowance is:", allowance_BN)

      const allowed = allowance_BN.gte(BigNumber.from(value_Wei_String))

      console.log("Allowed?:", allowed)

      if (!allowed) {
        console.log("Not good enough - need to set to:", value_Wei_String)
        //and now, the normal allowance transaction
        const approveStatus = await ERC20Contract.approve(
          approveContractAddress,
          value_Wei_String
        )
        await approveStatus.wait()
        console.log("ERC20 L1 SWAP ops approved:", approveStatus)
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
  async depositErc20({
                       recipient = null,
                       value_Wei_String,
                       currency,
                       currencyL2
                     }) {

    const L1_TEST_Contract = this.L1_TEST_Contract.attach(currency)

    let allowance_BN = await L1_TEST_Contract.allowance(
      this.account,
      this.addresses.L1StandardBridgeAddress
    )
    setFetchDepositTxBlock(false)
    try {
      /*
      OMG IS A SPECIAL CASE - allowance needs to be set to zero, and then
      set to actual amount, unless current approval amount is equal to, or
      bigger than, the current approval value
      */
      if (this.networkGateway === NETWORK.ETHEREUM &&
        allowance_BN.lt(BigNumber.from(value_Wei_String)) &&
        (currency.toLowerCase() === allTokens.OMG.L1.toLowerCase())
      ) {
        console.log("Current OMG Token allowance too small - might need to reset to 0, unless it's already zero")
        if (allowance_BN.gt(BigNumber.from("0"))) {
          const approveOMG = await L1_TEST_Contract.approve(
            this.addresses.L1StandardBridgeAddress,
            ethers.utils.parseEther("0")
          )
          await approveOMG.wait()
          console.log("OMG Token allowance has been set to 0")
        }
      }

      //recheck the allowance
      allowance_BN = await L1_TEST_Contract.allowance(
        this.account,
        this.addresses.L1StandardBridgeAddress
      )

      const allowed = allowance_BN.gte(BigNumber.from(value_Wei_String))

      if (!allowed) {
        //and now, the normal allowance transaction
        const approveStatus = await L1_TEST_Contract
          .connect(this.provider.getSigner()).approve(
            this.addresses.L1StandardBridgeAddress,
            value_Wei_String
          )
        await approveStatus.wait()
        console.log("ERC20 L1 ops approved:", approveStatus)
      }
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
      setFetchDepositTxBlock(true)
      //at this point the tx has been submitted, and we are waiting...
      await depositTX.wait()

      const opts = {
        fromBlock: -4000
      }
      const receipt = await this.watcher.waitForMessageReceipt(depositTX, opts)
      const txReceipt = receipt.transactionReceipt;
      this.getBalances()
      return txReceipt
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
        this.addresses.Proxy__BobaBillingContract,
        L2BillingContractJson.abi,
        this.L2Provider,
      )
      let BobaApprovalAmount = await L2BillingContract.exitFee()

      //now coming in as a value_Wei_String
      const value = BigNumber.from(value_Wei_String)

      const allowance = await this.checkAllowance(
        currencyAddress,
        this.addresses.DiscretionaryExitFee
      )

      const BobaAllowance = await this.checkAllowance(
        this.addresses.TK_L2BOBA,
        this.addresses.DiscretionaryExitFee
      )

      if (this.networkGateway === NETWORK.ETHEREUM) {
        // Should approve BOBA
        if (utils.getAddress(currencyAddress) === utils.getAddress(this.addresses.TK_L2BOBA)) {
          BobaApprovalAmount = BobaApprovalAmount.add(value)
        }

        if (BobaAllowance.lt(BobaApprovalAmount)) {
          const res = await this.approveERC20(
            BobaApprovalAmount,
            this.addresses.TK_L2BOBA,
            this.addresses.DiscretionaryExitFee
          )
          if (!res) return false
        }

      }

      let otherField;
      if (this.networkGateway === NETWORK.ETHEREUM) {
        otherField = currencyAddress === this.addresses.L2_ETH_Address ? {value: value} : {}
      } else {
        otherField = currencyAddress === this.addresses.L2_ETH_Address ?
          {value: value.add(BobaApprovalAmount)} : {value: BobaApprovalAmount}
      }

      // Should approve other tokens
      if (currencyAddress !== this.addresses.L2_ETH_Address &&
        utils.getAddress(currencyAddress) !== utils.getAddress(this.addresses.TK_L2BOBA) &&
        allowance.lt(value)
      ) {
        const res = await this.approveERC20(
          value,
          currencyAddress,
          this.addresses.DiscretionaryExitFee
        )
        if (!res) return false
      }

      const DiscretionaryExitFeeContract = new ethers.Contract(
        this.addresses.DiscretionaryExitFee,
        DiscretionaryExitFeeJson.abi,
        this.provider.getSigner()
      )

      const tx = await DiscretionaryExitFeeContract.payAndWithdraw(
        currencyAddress,
        value_Wei_String,
        this.L1GasLimit,
        utils.formatBytes32String(new Date().getTime().toString()),
        otherField
      )

      //everything submitted... waiting
      await tx.wait()

      //can close window now
      updateSignatureStatus_exitTRAD(true)

      return tx
    } catch (error) {
      console.log("NS: exitBOBA error:", error)
      return error
    }

  }

  /* Estimate cost of Classical Exit to L1 */
  async getExitCost(currencyAddress) {

    try {

      let approvalCost_BN = BigNumber.from('0')

      const gasPrice = await this.L2Provider.getGasPrice()
      console.log("Classical exit gas price", gasPrice.toString())

      if (currencyAddress !== this.addresses.L2_ETH_Address) {

        const ERC20Contract = new ethers.Contract(
          currencyAddress,
          L2ERC20Json.abi, //any old abi will do...
          this.provider.getSigner()
        )

        const tx = await ERC20Contract.populateTransaction.approve(
          this.addresses.DiscretionaryExitFee,
          utils.parseEther('1.0')
        )

        const approvalGas_BN = await this.L2Provider.estimateGas({...tx, from: this.gasEstimateAccount})
        approvalCost_BN = approvalGas_BN.mul(gasPrice)
        console.log("Approve cost in ETH:", utils.formatEther(approvalCost_BN))
      }

      const DiscretionaryExitFeeContract = new ethers.Contract(
        this.addresses.DiscretionaryExitFee,
        DiscretionaryExitFeeJson.abi,
        this.provider.getSigner()
      )

      const L2BillingContract = new ethers.Contract(
        this.addresses.Proxy__BobaBillingContract,
        L2BillingContractJson.abi,
        this.L2Provider,
      )
      const exitFee = await L2BillingContract.exitFee()
      let value = utils.parseEther('0.00001').add(exitFee)
      if (this.networkGateway === NETWORK.ETHEREUM) {
        value = utils.parseEther('0.00001')
      }

      const tx2 = await DiscretionaryExitFeeContract.populateTransaction.payAndWithdraw(
        this.addresses.L2_ETH_Address,
        utils.parseEther('0.00001'),
        this.L1GasLimit,
        ethers.utils.formatBytes32String(new Date().getTime().toString()),
        {value}
      )

      const gas_BN = await this.L2Provider.estimateGas({...tx2, from: this.gasEstimateAccount})
      console.log("Classical exit gas", gas_BN.toString())

      const cost_BN = gas_BN.mul(gasPrice)
      console.log("Classical exit cost (ETH):", utils.formatEther(cost_BN))

      const totalCost = utils.formatEther(cost_BN.add(approvalCost_BN))
      console.log("Classical exit total cost (ETH):", totalCost)

      //returns total cost in ETH
      return totalCost
    } catch (error) {
      return 0;
    }
  }

  /***********************************************/
  /*****                  Fee                *****/
  /***** Fees are reported as integers,      *****/
  /***** where every int represents 0.1%     *****/

  /***********************************************/

  async getL1TotalFeeRate() {

    try {
      const L1LPContract = new ethers.Contract(
        this.addresses.L1LPAddress,
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

    try {

      const L2LPContract = new ethers.Contract(
        this.addresses.L2LPAddress,
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
    try {
      const L1LPContract = new ethers.Contract(
        this.addresses.L1LPAddress,
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
        this.addresses.L2LPAddress,
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
  /***** Pool, User Info, to populate the Earn tab *****/

  /*****************************************************/
  async getL1LPInfo() {

    const poolInfo = {}
    const userInfo = {}

    let tokenAddressList = Object.keys(this.tokenAddresses).reduce((acc, cur) => {
      if (cur !== 'xBOBA' &&
        cur !== 'OLO' &&
        cur !== 'WAGMIv0' &&
        cur !== 'WAGMIv1' &&
        cur !== 'WAGMIv2' &&
        cur !== 'WAGMIv2-Oolong' &&
        cur !== 'WAGMIv3' &&
        cur !== 'WAGMIv3-Oolong') {
        acc.push(this.tokenAddresses[cur].L1.toLowerCase())
      }
      return acc
    }, [this.addresses.L1_ETH_Address])

    const L1LPContract = new ethers.Contract(
      this.addresses.L1LPAddress,
      L1LPJson.abi,
      this.L1Provider
    )

    const L1LPInfoPromise = []

    const getL1LPInfoPromise = async (tokenAddress) => {

      let tokenBalance
      let tokenSymbol
      let tokenName
      let decimals

      if (tokenAddress === this.addresses.L1_ETH_Address) {
        //getting eth balance
        tokenBalance = await this.L1Provider.getBalance(this.addresses.L1LPAddress)
        tokenSymbol = this.L1NativeTokenSymbol
        tokenName = this.L1NativeTokenName
        decimals = 18
      } else {
        //getting eth balance
        tokenBalance = await this.L1_TEST_Contract.attach(tokenAddress).connect(this.L1Provider).balanceOf(this.addresses.L1LPAddress)
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
      return {tokenAddress, tokenBalance, tokenSymbol, tokenName, poolTokenInfo, userTokenInfo, decimals}
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
      if (!annualYieldEstimate) annualYieldEstimate = 0
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
        amount: Object.keys(token.userTokenInfo).length ? token.userTokenInfo.amount.toString() : 0,
        pendingReward: Object.keys(token.userTokenInfo).length ? token.userTokenInfo.pendingReward.toString() : 0,
        rewardDebt: Object.keys(token.userTokenInfo).length ? token.userTokenInfo.rewardDebt.toString() : 0
      }
    })

    return {poolInfo, userInfo}
  }

  async getL2LPInfo() {

    const tokenAddressList = Object.keys(this.tokenAddresses).reduce((acc, cur) => {
      if (cur !== 'xBOBA' &&
        cur !== 'OLO' &&
        cur !== 'WAGMIv0' &&
        cur !== 'WAGMIv1' &&
        cur !== 'WAGMIv2' &&
        cur !== 'WAGMIv2-Oolong' &&
        cur !== 'WAGMIv3' &&
        cur !== 'WAGMIv3-Oolong'
      ) {
        acc.push({
          L1: this.tokenAddresses[cur].L1.toLowerCase(),
          L2: this.tokenAddresses[cur].L2.toLowerCase()
        })
      }
      return acc
    }, [{
      L1: this.addresses.L1_ETH_Address,
      L2: this.addresses[`TK_L2${this.L1NativeTokenSymbol}`]
    }])

    const L2LPContract = new ethers.Contract(
      this.addresses.L2LPAddress,
      L2LPJson.abi,
      this.L2Provider
    )

    const poolInfo = {}
    const userInfo = {}

    const L2LPInfoPromise = [];

    const getL2LPInfoPromise = async (tokenAddress, tokenAddressL1) => {

      let tokenBalance
      let tokenSymbol
      let tokenName
      let decimals

      if (tokenAddress === this.addresses.L2_ETH_Address) {
        tokenBalance = await this.L2Provider.getBalance(this.addresses.L2LPAddress)
        tokenSymbol = this.network === NETWORK.ETHEREUM ? 'ETH' : 'BOBA'
        tokenName = this.network === NETWORK.ETHEREUM ? 'Ethereum' : 'BOBA Token'
        decimals = 18
      } else {
        tokenBalance = await this.L2_TEST_Contract.attach(tokenAddress).connect(this.L2Provider).balanceOf(this.addresses.L2LPAddress)
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
      return {tokenAddress, tokenBalance, tokenSymbol, tokenName, poolTokenInfo, userTokenInfo, decimals}
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
      if (!annualYieldEstimate) annualYieldEstimate = 0
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
        amount: Object.keys(token.userTokenInfo).length ? token.userTokenInfo.amount.toString() : 0,
        pendingReward: Object.keys(token.userTokenInfo).length ? token.userTokenInfo.pendingReward.toString() : 0,
        rewardDebt: Object.keys(token.userTokenInfo).length ? token.userTokenInfo.rewardDebt.toString() : 0
      }
    })

    return {poolInfo, userInfo}
  }

  /***********************************************/
  /*****            Add Liquidity            *****/

  /***********************************************/
  async addLiquidity(currency, value_Wei_String, L1orL2Pool) {

    let otherField = {}

    if (currency === this.addresses.L1_ETH_Address || currency === this.addresses.L2_ETH_Address) {
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
      if (currency !== this.addresses.L2_ETH_Address) {

        const tx1 = await this.BobaContract
          .populateTransaction
          .approve(
            this.addresses.L2LPAddress,
            utils.parseEther('1.0'),
            otherField
          )

        const approvalGas_BN = await this.provider.estimateGas(tx1)
        approvalCost_BN = approvalGas_BN.mul(gasPrice_BN)
        console.log("Approve cost in ETH:", utils.formatEther(approvalCost_BN))
      }

      if (this.networkGateway !== NETWORK.ETHEREUM) {
        otherField = {
          ...otherField,
          value: utils.parseEther('1.0')
        }
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
      const estimateGas = await (L1orL2Pool === 'L1LP'
          ? this.L1LPContract
          : this.L2LPContract
      ).estimateGas.withdrawLiquidity(
        value_Wei_String,
        currency,
        this.account,
        {from: this.account}
      )
      const blockGasLimit = (await this.provider.getBlock('latest')).gasLimit
      const TX = await (L1orL2Pool === 'L1LP'
          ? this.L1LPContract
          : this.L2LPContract
      )
        .connect(this.provider.getSigner())
        .withdrawLiquidity(
          value_Wei_String,
          currency,
          this.account,
          {gasLimit: estimateGas.mul(2).gt(blockGasLimit) ? blockGasLimit : estimateGas.mul(2)}
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
    try {
      updateSignatureStatus_depositLP(false)
      setFetchDepositTxBlock(false);

      let depositTX = await this.L1LPContract
        .connect(this.provider.getSigner())
        .clientDepositL1(
          value_Wei_String,
          currency,
          currency === this.addresses.L1_ETH_Address ? {value: value_Wei_String} : {}
        )

      setFetchDepositTxBlock(true);

      //at this point the tx has been submitted, and we are waiting...
      await depositTX.wait()
      updateSignatureStatus_depositLP(true)

      const opts = {
        fromBlock: -4000
      }
      const receipt = await this.watcher.waitForMessageReceipt(depositTX, opts)
      const txReceipt = receipt.transactionReceipt;
      console.log(' completed swap-on ! L2 tx hash:', txReceipt)
      return txReceipt
    } catch (error) {
      console.log("NS: depositL1LP error:", error)
      return error
    }
  }

  getTeleportationAddress(chainId) {
    if (!chainId) {
      chainId = this.chainId
    }
    const networkConfig = CHAIN_ID_LIST[chainId]
    if (!networkConfig) {
      throw new Error(`Unknown chainId to retrieve teleportation contract from: ${chainId}`)
    }
    if (networkConfig.networkType !== NETWORK_TYPE.TESTNET) {
      if (isDevBuild()) {
        console.log("DEV: Teleportation is only supported on testnet for now, chainId: ", chainId)
      }
      return {teleportationAddr: undefined, networkConfig}
    }
    const addresses = appService.fetchAddresses({networkType: networkConfig.networkType, network: networkConfig.chain})

    let teleportationAddr = addresses.Proxy__L2Teleportation
    if (networkConfig.layer === LAYER.L1) {
      teleportationAddr = addresses.Proxy__L1Teleportation
    }
    return {teleportationAddr, networkConfig};
  }

  getTeleportationContract(chainId) {
    const {teleportationAddr, networkConfig} = this.getTeleportationAddress(chainId)
    if (!teleportationAddr || !this.Teleportation) return;

    const rpc = getRpcUrl({networkType: networkConfig.networkType, network: networkConfig.chain, layer: networkConfig.layer})
    const provider = new ethers.providers.StaticJsonRpcProvider(rpc)

    return this.Teleportation
      .attach(teleportationAddr)
      .connect(provider);
  }

  async isTeleportationOfAssetSupported(layer, token, destChainId) {
    const teleportationAddr = (layer === Layer.L1 ? this.addresses.Proxy__L1Teleportation : this.addresses.Proxy__L2Teleportation)
    const contract = this.Teleportation
      .attach(teleportationAddr)
      .connect(this.provider.getSigner());
    return await contract.supportedTokens(token, destChainId)
  }

  async depositWithTeleporter(layer, currency, value_Wei_String, destChainId) {
    try {
      updateSignatureStatus_depositLP(false)
      setFetchDepositTxBlock(false);

      const teleportationAddr = (layer === Layer.L1 ? this.addresses.Proxy__L1Teleportation : this.addresses.Proxy__L2Teleportation)
      const msgVal = currency === this.addresses.L1_ETH_Address || currency === this.addresses.NETWORK_NATIVE ? {value: value_Wei_String} : {}
      const teleportationContract = this.Teleportation
        .attach(teleportationAddr)
        .connect(this.provider.getSigner())
      const tokenAddress = currency === this.addresses.NETWORK_NATIVE ? ethers.constants.AddressZero : currency



      const assetSupport = await teleportationContract.supportedTokens(tokenAddress, destChainId)
      if (!assetSupport?.supported) {
        console.error("Teleportation: Asset not supported for chainId", assetSupport, tokenAddress, destChainId)
        return new Error(`Teleportation: Asset ${tokenAddress} not supported for chainId ${destChainId}`)
      }

      let depositTX = await teleportationContract
        .teleportAsset(
          tokenAddress,
          value_Wei_String,
          destChainId,
          msgVal
        )

      setFetchDepositTxBlock(true);

      //at this point the tx has been submitted, and we are waiting...
      await depositTX.wait()
      updateSignatureStatus_depositLP(true)

      const opts = {
        fromBlock: -4000
      }
      const receipt = await this.watcher.waitForMessageReceipt(depositTX, opts)
      const txReceipt = receipt.transactionReceipt;
      console.log(' completed swap-on ! tx hash:', txReceipt)
      return txReceipt
    } catch (error) {
      console.log("Teleportation error:", error)
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
      console.log("payload:", updatedPayload)

      const time_start = new Date().getTime()
      console.log("TX start time:", time_start)

      let depositTX
      console.log("Depositing...")
      depositTX = await this.L1LPContract
        .connect(this.provider.getSigner()).clientDepositL1Batch(
          updatedPayload,
          ETHAmount !== 0 ? {value: ETHAmount} : {}
        )

      console.log("depositTX", depositTX)

      //at this point the tx has been submitted, and we are waiting...
      await depositTX.wait()

      const block = await this.L1Provider.getTransaction(depositTX.hash)
      console.log(' block:', block)

      updateSignatureStatus_depositLP(true)

      const opts = {
        fromBlock: -4000
      }
      const receipt = await this.watcher.waitForMessageReceipt(depositTX, opts)
      const txReceipt = receipt.transactionReceipt;
      console.log(' completed swap-on ! L2 tx hash:', txReceipt)

      const time_stop = new Date().getTime()
      console.log("TX finish time:", time_stop)

      return txReceipt

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
      this.networkConfig
    ).get('get.l2.pendingexits', {})

    const pendingFast = L1pending.data.filter(i => {
      return (i.fastRelay === 1) && //fast exit
        i.exitToken.toLowerCase() === tokenAddress.toLowerCase() //and, this specific token
    })

    let sum = pendingFast.reduce(function (prev, current) {
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
      tokenAddressLC === this.addresses.L2_ETH_Address ||
      tokenAddressLC === this.addresses.L1_ETH_Address
    ) {
      balance = await this.L1Provider.getBalance(this.addresses.L1LPAddress)
    } else {
      balance = await this.L1_TEST_Contract
        .attach(tokenAddress)
        .connect(this.L1Provider)
        .balanceOf(this.addresses.L1LPAddress)
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
      tokenAddressLC === this.addresses.L2_BOBA_Address ||
      tokenAddressLC === this.addresses.L1_ETH_Address
    ) {
      //We are dealing with ETH
      balance = await this.L2_ETH_Contract.connect(this.L2Provider).balanceOf(
        this.addresses.L2LPAddress
      )
    } else {
      balance = await this.L2_TEST_Contract.attach(tokenAddress).connect(this.L2Provider).balanceOf(
        this.addresses.L2LPAddress
      )
    }

    return balance.toString()
  }

  /***************************************/
  /*********** L1LP Liquidity ************/

  /***************************************/
  async L1LPLiquidity(tokenAddress) {

    const L1LPContractNS = new ethers.Contract(
      this.addresses.L1LPAddress,
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
      this.addresses.L2LPAddress,
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

    if (currencyAddress !== this.addresses.L2_ETH_Address) {

      const ERC20Contract = new ethers.Contract(
        currencyAddress,
        L2ERC20Json.abi, //any old abi will do...
        this.provider.getSigner()
      )

      const tx = await ERC20Contract
        .populateTransaction
        .approve(
          this.addresses.L2LPAddress,
          utils.parseEther('1.0')
        )

      const approvalGas_BN = await this.L2Provider.estimateGas({...tx, from: this.gasEstimateAccount})
      approvalCost_BN = approvalGas_BN.mul(gasPrice)
      console.log("Approve cost in ETH:", utils.formatEther(approvalCost_BN))
    }

    const L2BillingContract = new ethers.Contract(
      this.addresses.Proxy__BobaBillingContract,
      L2BillingContractJson.abi,
      this.L2Provider,
    )

    const approvalAmount = await L2BillingContract.exitFee()

    let value;
    if (this.networkGateway === NETWORK.ETHEREUM) {
      value = currencyAddress === this.addresses.L2_ETH_Address ? {value: '1'} : {};
    } else {
      value = currencyAddress === this.addresses.L2_ETH_Address ? {value: approvalAmount.add('1')} : {value: approvalAmount};
    }

    //in some cases zero not allowed
    const tx2 = await this.L2LPContract
      .connect(this.provider.getSigner())
      .populateTransaction
      .clientDepositL2(
        currencyAddress === this.addresses.L2_ETH_Address ? '1' : '0', //ETH does not allow zero
        currencyAddress,
        value
      )

    const depositGas_BN = await this.L2Provider.estimateGas({...tx2, from: this.gasEstimateAccount})

    let l1SecurityFee = BigNumber.from('0')
    if (this.networkType === NETWORK_TYPE.MAINNET) {
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

    if (currencyAddress !== this.addresses.L1_ETH_Address) {

      const ERC20Contract = new ethers.Contract(
        currencyAddress,
        L2ERC20Json.abi, //any old abi will do...
        this.provider.getSigner()
      )

      const tx = await ERC20Contract.populateTransaction.approve(
        this.addresses.L1LPAddress,
        utils.parseEther('1.0')
      )

      const approvalGas_BN = await this.L1Provider.estimateGas(tx)
      approvalCost_BN = approvalGas_BN.mul(gasPrice)
      console.log("Approve cost in ETH:", utils.formatEther(approvalCost_BN))
    }

    //in some cases zero not allowed
    const tx2 = await this.L1LPContract
      .connect(this.provider.getSigner()).populateTransaction.clientDepositL1(
        currencyAddress === this.addresses.L1_ETH_Address ? '1' : '0', //ETH does not allow zero
        currencyAddress,
        currencyAddress === this.addresses.L1_ETH_Address ? {value: '1'} : {}
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
      this.addresses.L1LPAddress,
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
        payload, {value: ETHValue, from: '0x5E7a06025892d8Eef0b5fa263fA0d4d2E5C3B549'}
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

    if (currencyAddress === this.addresses.L2_ETH_Address) {
      balance_BN = await this.L2Provider.getBalance(this.account)
    }

    const L2BillingContract = new ethers.Contract(
      this.addresses.Proxy__BobaBillingContract,
      L2BillingContractJson.abi,
      this.L2Provider,
    )
    let BobaApprovalAmount = await L2BillingContract.exitFee()

    const BobaAllowance = await this.checkAllowance(
      this.addresses.TK_L2BOBA,
      this.addresses.L2LPAddress,
    )

    try {
      // Approve BOBA first
      if (BobaAllowance.lt(BobaApprovalAmount)) {
        const approveStatus = await this.approveERC20(
          BobaApprovalAmount,
          this.addresses.TK_L2BOBA,
          this.addresses.L2LPAddress
        )
        if (!approveStatus) return false
      }

      // Approve other tokens
      if (currencyAddress !== this.addresses.L2_ETH_Address &&
        utils.getAddress(currencyAddress) !== utils.getAddress(this.addresses.TK_L2BOBA)
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
          this.addresses.L2LPAddress
        )
        console.log("Allowance:", utils.formatEther(allowance_BN))

        if (balance_BN.gt(allowance_BN)) {

          //Estimate gas
          const tx = await L2ERC20Contract.populateTransaction.approve(
            this.addresses.L2LPAddress,
            balance_BN
          )

          approvalGas_BN = await this.L2Provider.estimateGas(tx)
          approvalCost_BN = approvalGas_BN.mul(gasPrice)
          console.log("Cost to Approve (ETH):", utils.formatEther(approvalCost_BN))

          const approveStatus = await L2ERC20Contract.approve(
            this.addresses.L2LPAddress,
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
          currencyAddress === this.addresses.L2_ETH_Address ? {value: '1'} : {}
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

      if (currencyAddress === this.addresses.L2_ETH_Address) {
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
          currencyAddress === this.addresses.L2_ETH_Address ? {value: balance_BN.sub(depositCost_BN)} : {}
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
      const txReceipt = receipt.transactionReceipt;

      console.log(' completed Deposit! L1 tx hash:', txReceipt.transactionHash)

      const time_stop = new Date().getTime()
      console.log("TX finish time:", time_stop)

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

    console.log("depositL2LP currencyAddress", currencyAddress)

    const L2BillingContract = new ethers.Contract(
      this.addresses.Proxy__BobaBillingContract,
      L2BillingContractJson.abi,
      this.L2Provider,
    )
    let BobaApprovalAmount = await L2BillingContract.exitFee()

    const BobaAllowance = await this.checkAllowance(
      this.addresses.TK_L2BOBA,
      this.addresses.L2LPAddress,
    )

    try {

      if (this.networkGateway === NETWORK.ETHEREUM) {
        // Approve BOBA first only when the Boba is not native token.
        if (utils.getAddress(currencyAddress) === utils.getAddress(this.addresses.TK_L2BOBA)) {
          BobaApprovalAmount = BobaApprovalAmount.add(BigNumber.from(value_Wei_String))
        }
        if (BobaAllowance.lt(BobaApprovalAmount)) {
          const approveStatus = await this.approveERC20(
            BobaApprovalAmount,
            this.addresses.TK_L2BOBA,
            this.addresses.L2LPAddress
          )
          if (!approveStatus) return false
        }

      }

      // Approve other tokens
      if (currencyAddress !== this.addresses.L2_ETH_Address &&
        utils.getAddress(currencyAddress) !== utils.getAddress(this.addresses.TK_L2BOBA)
      ) {

        const L2ERC20Contract = new ethers.Contract(
          currencyAddress,
          L2ERC20Json.abi,
          this.provider.getSigner()
        )

        let allowance_BN = await L2ERC20Contract.allowance(
          this.account,
          this.addresses.L2LPAddress
        )

        let depositAmount_BN = BigNumber.from(value_Wei_String)

        if (depositAmount_BN.gt(allowance_BN)) {
          const approveStatus = await L2ERC20Contract.approve(
            this.addresses.L2LPAddress,
            value_Wei_String
          )
          await approveStatus.wait()
          if (!approveStatus) return false
        }
      }

      const time_start = new Date().getTime()
      console.log("TX start time:", time_start)

      let otherField;
      if (this.networkGateway === NETWORK.ETHEREUM) {
        otherField = currencyAddress === this.addresses.L2_ETH_Address ? {value: value_Wei_String} : {}
      } else {
        otherField = currencyAddress === this.addresses.L2_ETH_Address ? {value: BobaApprovalAmount.add(value_Wei_String)} : {value: BobaApprovalAmount}
      }

      const depositTX = await this.L2LPContract
        .connect(this.provider.getSigner()).clientDepositL2(
          value_Wei_String,
          currencyAddress,
          otherField,
        )

      //at this point the tx has been submitted, and we are waiting...
      await depositTX.wait()

      const block = await this.L2Provider.getTransaction(depositTX.hash)
      console.log(' block:', block)

      //closes the modal
      updateSignatureStatus_exitLP(true)

      return depositTX
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
    } catch (error) {
      return error
    }
  }

  /***********************************************/
  /*****         DAO Functions               *****/
  /***********************************************/

  // get DAO Balance
  async getDaoBalance() {

    if (!this.BobaContract) return

    if (!this.account) {
      console.log('NS: getDaoBalance() error - called but account === null')
      return
    }

    try {
      let balance = await this.BobaContract.balanceOf(this.account)
      return {balance: formatEther(balance)}
    } catch (error) {
      console.log('Error: getDaoBalance', error)
      return error
    }
  }

  async getDaoBalanceX() {

    if (!this.xBobaContract) return

    if (!this.account) {
      console.log('NS: getDaoBalanceX() error - called but account === null')
      return
    }

    try {
      let balance = await this.xBobaContract.balanceOf(this.account)
      return {balanceX: formatEther(balance)}
    } catch (error) {
      console.log('Error: getDaoBalanceX', error)
      return error
    }
  }

  // get DAO Votes
  async getDaoVotes() {

    if (!this.BobaContract) return

    if (!this.account) {
      console.log('NS: getDaoVotes() error - called but account === null')
      return
    }

    try {
      let votes = await this.BobaContract.getCurrentVotes(this.account)
      return {votes: formatEther(votes)}
    } catch (error) {
      console.log('NS: getDaoVotes error:', error)
      return error
    }
  }

  // get DAO Votes
  async getDaoVotesX() {

    if (!this.xBobaContract) return

    if (!this.account) {
      console.log('NS: getDaoVotesX() error - called but account === null')
      return
    }

    try {
      let votes = await this.xBobaContract.getCurrentVotes(this.account)
      return {votesX: formatEther(votes)}
    } catch (error) {
      console.log('NS: getDaoVotesX error:', error)
      return error
    }
  }

  //Transfer DAO Funds
  async transferDao({recipient, amount}) {

    if (this.L1orL2 !== 'L2') return
    if (!this.BobaContract) return

    if (!this.account) {
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
  async delegateVotes({recipient}) {

    if (this.L1orL2 !== 'L2') return
    if (!this.BobaContract) return

    if (!this.account) {
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
  async delegateVotesX({recipient}) {

    if (this.L1orL2 !== 'L2') return
    if (!this.xBobaContract) return

    if (!this.account) {
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

    if (!this.delegateContract) return

    try {
      const delegateCheck = await this.delegateContract.attach(this.addresses.GovernorBravoDelegator)
      const rawThreshold = await delegateCheck.proposalThreshold()
      return {proposalThreshold: formatEther(rawThreshold)}
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

    if (this.L1orL2 !== 'L2') return
    if (!this.delegateContract) return

    if (!this.account) {
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
    // FIXME: Ve DAO From here
    /*
      let tokenIds = payload.tokenIds
      // create proposal only on latest contracts.
      const delegateCheck = await this.delegateContract.attach(this.addresses.GovernorBravoDelegatorV2)

    */
    // FIXME: Ve DAO Till here

    const delegateCheck = await this.delegateContract.attach(this.addresses.GovernorBravoDelegator)

    if (payload.action === 'text-proposal') {
      address = ['0x000000000000000000000000000000000000dEaD']
      description = payload.text.slice(0, 252) //100+150+2
      callData = [
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      ]
    } else if (payload.action === 'change-lp1-fee') {
      signatures = ['configureFeeExits(uint256,uint256,uint256)']
      value1 = Number(payload.value[0])
      value2 = Number(payload.value[1])
      value3 = Number(payload.value[2])
      description = `Change L1 LP Bridge fee to ${value1}, ${value2}, and ${value3} integer percent`
      address = [this.addresses.L2LPAddress]
      callData = [ethers.utils.defaultAbiCoder.encode(
        ['uint256', 'uint256', 'uint256'],
        [value1, value2, value3]
      )]
    } else if (payload.action === 'change-lp2-fee') {
      address = [delegateCheck.address]
      signatures = ['configureFee(uint256,uint256,uint256)']
      value1 = Number(payload.value[0])
      value2 = Number(payload.value[1])
      value3 = Number(payload.value[2])
      description = `Change L2 LP Bridge fee to ${value1}, ${value2}, and ${value3} integer percent`
      address = [this.addresses.L2LPAddress]
      callData = [ethers.utils.defaultAbiCoder.encode(
        ['uint256', 'uint256', 'uint256'],
        [value1, value2, value3]
      )]
    } else if (payload.action === 'change-threshold') {
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
      console.log("NS: createProposal error:", error)
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

    const delegateCheckV1 = await this.delegateContract.attach(this.addresses.GovernorBravoDelegator)
    const delegateCheckV2 = await this.delegateContract.attach(this.addresses.GovernorBravoDelegatorV2)

    try {

      let proposalList = []
      /// @notice An event emitted when a new proposal is create
      // event ProposalCreated(uint id, address proposer, address[] targets, uint[] values, string[] signatures, bytes[] calldatas, uint startTimestamp, uint endTimestamp, string description);

      const descriptionList = await graphQLService.queryBridgeProposalCreated()
      const proposalGroup = groupBy(descriptionList.data.governorProposalCreateds, 'to');
      const delegatorList = [this.addresses.GovernorBravoDelegator, this.addresses.GovernorBravoDelegatorV2];

      for (let delegator of delegatorList) {
        let delegateCheck;
        if (delegator === this.addresses.GovernorBravoDelegator) {
          delegateCheck = delegateCheckV1;
        } else if (delegator === this.addresses.GovernorBravoDelegatorV2) {
          delegateCheck = delegateCheckV2;
        }
        const proposals = proposalGroup[delegator.toLowerCase()]
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

          let proposal = await delegateCheck.getActions(i + 2)

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
            startTimestamp: proposalRaw.startTimestamp,
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
          hasLiveProposal = [0, 1].includes(latestProposalState) /// pending & active proposal check.
        }
      }

      return {
        proposalList,
        hasLiveProposal
      }
    } catch (error) {
      console.log("NS: fetchProposalsVeDao error:", error)
      return error
    }
  }

  // to check wether the token has been already used for voting on proposal.
  async checkProposalVote(proposalId, tokenId) {
    if (!this.delegateContract) return

    try {
      const delegateCheck = await this.delegateContract.attach(this.addresses.GovernorBravoDelegatorV2)

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
  async castProposalVoteVeDao({id, userVote, tokenIds}) {

    if (!this.delegateContract) return

    if (!this.account) {
      console.log('NS: castProposalVote() error - called but account === null')
      return
    }

    try {
      const delegateCheck = await this.delegateContract
        .connect(this.provider.getSigner())
        .attach(this.addresses.GovernorBravoDelegatorV2)

      const res = await delegateCheck.castVote(id, userVote, tokenIds)

      return res;

    } catch (error) {
      console.log("NS: castProposalVote error:", error)
      return error
    }
  }

  async queueProposal(proposalID) {

    if (!this.delegateContract) return

    if (!this.account) {
      console.log('NS: queueProposal() error - called but account === null')
      return
    }

    try {
      const delegateCheck = await this.delegateContract
        .connect(this.provider.getSigner())
        .attach(this.addresses.GovernorBravoDelegator)
      let res = delegateCheck.queue(Number(proposalID))
      return res
    } catch (error) {
      console.log("NS: queueProposal error:", error)
      return error
    }

  }

  async executeProposal(proposalID) {

    if (!this.delegateContract) return

    if (!this.account) {
      console.log('NS: executeProposal() error - called but account === null')
      return
    }

    try {
      const delegateCheck = await this.delegateContract
        .connect(this.provider.getSigner())
        .attach(this.addresses.GovernorBravoDelegator)
      let res = delegateCheck.execute(Number(proposalID))
      return res
    } catch (error) {
      console.log("NS: executeProposal error:", error)
      return error
    }

  }

  /***********************************************/
  /*****       Fixed savings account         *****/

  /***********************************************/
  async addFS_Savings(value_Wei_String) {

    if (!this.account) {
      console.log('NS: withdrawFS_Savings() error - called but account === null')
      return
    }

    try {

      const FixedSavings = new ethers.Contract(
        this.addresses.BobaFixedSavings,
        L2SaveJson.abi,
        this.provider.getSigner()
      )

      let allowance_BN = await this.BobaContract
        .connect(this.provider.getSigner())
        .allowance(
          this.account,
          this.addresses.BobaFixedSavings
        )

      let depositAmount_BN = BigNumber.from(value_Wei_String)

      let approveAmount_BN = depositAmount_BN.add(BigNumber.from('1000000000000'))

      try {
        if (approveAmount_BN.gt(allowance_BN)) {
          console.log("Need to approve YES:", approveAmount_BN)
          const approveStatus = await this.BobaContract
            .connect(this.provider.getSigner())
            .approve(
              this.addresses.BobaFixedSavings,
              approveAmount_BN
            )
          await approveStatus.wait()
        } else {
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
          this.addresses.BobaFixedSavings
        )
      console.log("benchmarkAllowance_BN", allowance_BN.toString())

      // second, we need the approval cost
      const tx1 = await this.BobaContract
        .connect(this.provider.getSigner())
        .populateTransaction
        .approve(
          this.addresses.BobaFixedSavings,
          allowance_BN.toString(),
        )

      const approvalGas_BN = await this.provider.estimateGas(tx1)
      approvalCost_BN = approvalGas_BN.mul(gasPrice_BN)
      console.log("Approve cost in ETH:", utils.formatEther(approvalCost_BN))

      // third, we need the stake cost
      const FixedSavings = new ethers.Contract(
        this.addresses.BobaFixedSavings,
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

    if (!this.account) {
      return
    }

    try {
      const FixedSavings = new ethers.Contract(
        this.addresses.BobaFixedSavings,
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

    if (this.account === null) {
      return
    }

    try {
      const FixedSavings = new ethers.Contract(
        this.addresses.BobaFixedSavings,
        L2SaveJson.abi,
        this.L2Provider
      )
      await FixedSavings.l2Boba()
      let stakecount = await FixedSavings.personalStakeCount(this.account)
      return {stakecount: Number(stakecount)}
    } catch (error) {
      console.log('NS: getSaves error:', error)
      return error
    }
  }

  async estimateApprove() {

    const approvalAmount = utils.parseEther('10.0')
    let allowance_BN = null
    let approveStatus = null

    if (this.addresses.hasOwnProperty('BobaFixedSavings')) {
      allowance_BN = await this.BobaContract
        .connect(this.provider.getSigner())
        .allowance(
          this.account,
          this.addresses.BobaFixedSavings
        )
      console.log("Fixed Savings Allowance", allowance_BN.toString())

      approveStatus = await this.BobaContract
        .connect(this.provider.getSigner())
        .approve(
          this.addresses.BobaFixedSavings,
          approvalAmount
        )
      await approveStatus.wait()
      console.log("Fixed Savings Approval", approveStatus)
    }

    if (this.addresses.hasOwnProperty('DiscretionaryExitFee')) {
      allowance_BN = await this.BobaContract
        .connect(this.provider.getSigner())
        .allowance(
          this.account,
          this.addresses.DiscretionaryExitFee
        )
      console.log("DiscretionaryExitFee Allowance", allowance_BN.toString())

      approveStatus = await this.BobaContract
        .connect(this.provider.getSigner())
        .approve(
          this.addresses.DiscretionaryExitFee,
          approvalAmount
        )
      await approveStatus.wait()
      console.log("DiscretionaryExitFee Approval", approveStatus)
    }

    if (this.addresses.hasOwnProperty('L2LPAddress')) {
      allowance_BN = await this.BobaContract
        .connect(this.provider.getSigner())
        .allowance(
          this.account,
          this.addresses.L2LPAddress
        )
      console.log("L2LP", allowance_BN.toString())

      approveStatus = await this.BobaContract
        .connect(this.provider.getSigner())
        .approve(
          this.addresses.L2LPAddress,
          approvalAmount
        )
      await approveStatus.wait()
      console.log("L2LP", approveStatus)
    }

  }

  async getFS_Info() {

    if (this.account === null) {
      console.log('NS: getFS_Info() error - called but account === null')
      return
    }

    try {

      const FixedSavings = new ethers.Contract(
        this.addresses.BobaFixedSavings,
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
      return {stakeInfo}
    } catch (error) {
      console.log("NS: getFS_Info error:", error)
      return error
    }

  }

  /***********************************************/
  /*****            L1 Security Fee          *****/

  /***********************************************/
  async estimateL1SecurityFee(payload = this.payloadForL1SecurityFee) {
    const deepCopyPayload = {...payload}
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
  async estimateL2Fee(payload = this.payloadForL1SecurityFee) {
    try {
      const l2GasPrice = await this.L2Provider.getGasPrice()
      const l2GasEstimate = await this.L2Provider.estimateGas(payload)
      return l2GasPrice.mul(l2GasEstimate).toNumber()
    } catch {
      return 0
    }
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
          l2LPFeeRate,
          l2LPBalanceInWei: l2LPBalance,
          l2LPBalance: utils.formatUnits(BigNumber.from(l2LPBalance), filteredBalance.decimals),
          balanceInWEI: filteredBalance.balance,
          balance: utils.formatUnits(BigNumber.from(filteredBalance.balance.toString()), filteredBalance.decimals),
          decimals: filteredBalance.decimals,
          address: filteredBalance.address,
          LPRatio:
            Number(utils.formatUnits(BigNumber.from(l2LPBalance), filteredBalance.decimals)) > 0 ?
              (Number(utils.formatUnits(BigNumber.from(l2LPBalance), filteredBalance.decimals)) /
                Number(utils.formatUnits(BigNumber.from(l2Liquidity), filteredBalance.decimals))).toFixed(3) : 0
        }
      } else if (tokenName) {
        const l1TokenAddress = this.tokenAddresses[tokenName].L1
        const l2TokenAddress = this.tokenAddresses[tokenName].L2
        const [l2LPFeeRate, l2LPBalance, l2Liquidity] = await getInfo(l1TokenAddress, l2TokenAddress)
        const filteredBalance = layer1.filter(i => i.symbol === tokenName)[0]
        payload[tokenName] = {
          l2LPFeeRate,
          l2LPBalanceInWei: l2LPBalance,
          l2LPBalance: utils.formatUnits(BigNumber.from(l2LPBalance), filteredBalance.decimals),
          balanceInWEI: filteredBalance.balance,
          balance: utils.formatUnits(BigNumber.from(filteredBalance.balance.toString()), filteredBalance.decimals),
          decimals: filteredBalance.decimals,
          address: filteredBalance.address,
          LPRatio:
            Number(utils.formatUnits(BigNumber.from(l2LPBalance), filteredBalance.decimals)) > 0 ?
              (Number(utils.formatUnits(BigNumber.from(l2LPBalance), filteredBalance.decimals)) /
                Number(utils.formatUnits(BigNumber.from(l2Liquidity), filteredBalance.decimals))).toFixed(3) : 0
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
      this.addresses.Proxy__BobaBillingContract,
      L2BillingContractJson.abi,
      this.L2Provider,
    )
    return ethers.utils.formatEther(await L2BillingContract.exitFee())
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
        this.addresses.Ve_BOBA,
        veJson.abi,
        this.provider.getSigner()
      )

      let allowance_BN = await this.BobaContract
        .connect(this.provider.getSigner())
        .allowance(
          this.account,
          this.addresses.Ve_BOBA
        )

      let depositAmount_BN = BigNumber.from(value_Wei_String)

      let approveAmount_BN = depositAmount_BN.add(BigNumber.from('1000000000000'))

      try {
        if (approveAmount_BN.gt(allowance_BN)) {
          const approveStatus = await this.BobaContract
            .connect(this.provider.getSigner())
            .approve(
              this.addresses.Ve_BOBA,
              approveAmount_BN
            )
          const TX = await approveStatus.wait()
          console.log("approveStatus:", TX)
        } else {
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
    if (!this.account) {
      console.log('NS: withdrawLock() error - called but account === null')
      return
    }

    try {
      const ve = new ethers.Contract(
        this.addresses.Ve_BOBA, //check ve address is present
        veJson.abi,
        this.provider.getSigner()
      )

      const TX = await ve.withdraw(tokenId)
      await TX.wait()
      return TX
    } catch (error) {
      console.log("NS: Ve: withdrawLock error:", error)
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
    if (this.account === null) {
      console.log('NS: increaseLockAmount() error - called but account === null')
      return
    }
    try {
      const ve = new ethers.Contract(
        this.addresses.Ve_BOBA, //check ve address is present
        veJson.abi,
        this.provider.getSigner()
      )

      let allowance_BN = await this.BobaContract
        .connect(this.provider.getSigner())
        .allowance(
          this.account,
          this.addresses.Ve_BOBA
        )

      let depositAmount_BN = BigNumber.from(value_Wei_String)

      let approveAmount_BN = depositAmount_BN.add(BigNumber.from('1000000000000'))

      try {
        if (approveAmount_BN.gt(allowance_BN)) {
          const approveStatus = await this.BobaContract
            .connect(this.provider.getSigner())
            .approve(
              this.addresses.Ve_BOBA,
              approveAmount_BN
            )
          await approveStatus.wait()
        } else {
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
      console.log("NS: Ve: increaseLockAmount error:", error)
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

    if (this.account === null) {
      console.log('NS: increaseUnlockTime() error - called but account === null')
      return
    }

    try {
      const ve = new ethers.Contract(
        this.addresses.Ve_BOBA, //check ve address is present
        veJson.abi,
        this.provider.getSigner()
      )

      const TX = await ve.increase_unlock_time(tokenId, lock_duration)
      await TX.wait()
      return TX

    } catch (error) {
      console.log("NS: Ve: extendLockTime error:", error)
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
        this.addresses.Ve_BOBA, //check ve address is present
        veJson.abi,
        this.provider
      )

      const baseVoter = new ethers.Contract(
        this.addresses.BASE_V1_VOTER,
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
      console.log('NS: getAltL1DepositFee() error - called but account === null')
      return
    }
    try {
      const pResponse = this.supportedAltL1Chains.map(async (type) => {
        let L0_ETH_ENDPOINT = this.addresses.Layer_Zero_Endpoint;
        let ETH_L1_BOBA_ADDRESS = this.addresses.TK_L1BOBA;
        let L0_TARGET_CHAIN_ID = this.addresses.layerZeroTargetChainID;
        let ALT_L1_BOBA_ADDRESS = this.addresses[`Proxy__EthBridgeTo${type}`];
        let PROXY_ETH_L1_BRIDGE_ADDRESS_TO = this.addresses[`${type}_TK_BOBA`];

        // Layer zero doesn't support moonbase
        // return 0 for those bridges that haven't been implemented yet
        if (typeof ALT_L1_BOBA_ADDRESS === 'undefined' || typeof PROXY_ETH_L1_BRIDGE_ADDRESS_TO === 'undefined') {
          return {type, fee: '0'}
        }

        const Proxy__EthBridge = new ethers.Contract(
          PROXY_ETH_L1_BRIDGE_ADDRESS_TO,
          ETHL1BridgeJson.abi,
          this.provider.getSigner()
        );

        const ETHLayzerZeroEndpoint = new ethers.Contract(
          L0_ETH_ENDPOINT,
          LZEndpointMockJson.abi,
          this.provider.getSigner()
        );

        const payload = ethers.utils.defaultAbiCoder.encode(
          ["address", "address", "address", "address", "uint256", "bytes"],
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

        return {type, ...estimatedFee, fee: ethers.utils.formatEther(estimatedFee._nativeFee)}
      })
      const fees = await Promise.all(pResponse);
      let result = {};
      fees.forEach((fee) => result[fee.type] = fee);
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
      let L0_ETH_ENDPOINT = this.addresses.Layer_Zero_Endpoint;
      let L0_TARGET_CHAIN_ID = this.addresses.layerZeroTargetChainID;
      let ETH_L1_BOBA_ADDRESS = this.addresses.TK_L1BOBA;
      let PROXY_ETH_L1_BRIDGE_ADDRESS_TO = this.addresses[`Proxy__EthBridgeTo${type}`];
      let ALT_L1_BOBA_ADDRESS = this.addresses[`${type}_TK_BOBA`];
      /* proxy eth bridge contract */
      const Proxy__EthBridge = new ethers.Contract(
        PROXY_ETH_L1_BRIDGE_ADDRESS_TO,
        ETHL1BridgeJson.abi,
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

      // TODO: FIXME: Update this function to `withdraw` in case of other deployment than ETHEREUM.
      // INPUT STEP MULTICHAIN
      await Proxy__EthBridge.depositERC20(
        ETH_L1_BOBA_ADDRESS,
        ALT_L1_BOBA_ADDRESS,
        ethers.utils.parseEther(value),
        ethers.constants.AddressZero,
        "0x", // adapterParams
        "0x",
        {value: estimatedFee._nativeFee}
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
        this.addresses.BASE_V1_VOTER,
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
        this.addresses.BASE_V1_VOTER,
        voterJson.abi,
        this.provider.getSigner()
      )
      console.log('gaugeAddress', gaugeAddress)
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
        this.addresses.BASE_V1_VOTER,
        voterJson.abi,
        this.provider
      )
      // load and iterate over nft to find vote on pools.
      let {records} = await this.fetchLockRecords();
      // filter the ve nft records which has used.
      records = records.filter((token) => token.usedWeights > 0)

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
          const nft = records[j];
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

    const delegateCheck = await this.delegateContract.attach(this.addresses.GovernorBravoDelegator)

    try {
      let proposalList = []

      const proposalCounts = await delegateCheck.proposalCount()
      const totalProposals = await proposalCounts.toNumber()

      /// @notice An event emitted when a new proposal is created
      // event ProposalCreated(uint id, address proposer, address[] targets, uint[] values, string[] signatures, bytes[] calldatas, uint startTimestamp, uint endTimestamp, string description);

      let descriptionList = await graphQLService.queryBridgeProposalCreated()

      for (let i = 0; i < totalProposals; i++) {
        const proposalRaw = descriptionList.data.governorProposalCreateds[i]

        if (typeof (proposalRaw) === 'undefined') continue

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

        let proposal = await delegateCheck.getActions(i + 2)

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
      return {proposalList}
    } catch (error) {
      console.log("NS: fetchProposals error:", error)
      return error
    }
  }


  async castProposalVote({id, userVote}) {

    if (!this.delegateContract) return

    if (!this.account) {
      console.log('NS: castProposalVote() error - called but account === null')
      return
    }
    try {
      const delegateCheck = await this.delegateContract
        .connect(this.provider.getSigner())
        .attach(this.addresses.GovernorBravoDelegator)
      return delegateCheck.castVote(id, userVote)
    } catch (error) {
      console.log("NS: castProposalVote error:", error)
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
            parseResult.push({[key]: result[i]})
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
        return {methodIndex, result: {result: parseResult(result, outputs), err: null}}
      } else if (stateMutability === 'payable') {
        console.log({value}, ...parseInput)
        const tx = await contract[methodName](...parseInput, {value})
        return {methodIndex, result: {transactionHash: tx.hash, err: null}}
      } else {
        const tx = await contract[methodName](...parseInput)
        return {methodIndex, result: {transactionHash: tx.hash, err: null}}
      }
    } catch (err) {
      return {methodIndex, result: {err: JSON.stringify(err)}}
    }
  }

  // getting block number;

  async getLatestBlockNumber() {
    return await this.provider.getBlockNumber();
  }

  async getBlockTime(blockNumber) {
    return (await this.provider.getBlock(blockNumber)).timestamp;
  }

  async getBlockExplorerLinks() {
    if (this.networkConfig) {
      const l1Explorer = this.networkConfig.L1.blockExplorerUrl
      const l2Explorer = this.networkConfig.L2.blockExplorerUrl
      return [l1Explorer, l2Explorer]
    }
    return []
  }
}

const networkService = new NetworkService()
export default networkService
