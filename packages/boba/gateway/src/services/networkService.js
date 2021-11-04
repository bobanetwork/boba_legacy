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
import { Watcher } from '@eth-optimism/core-utils'
import { ethers, BigNumber, utils } from 'ethers'

import store from 'store'
import { orderBy } from 'lodash'
import BN from 'bn.js'

import { getToken } from 'actions/tokenAction'

import {
  addNFT,
  getNFTs,
  addNFTContract,
  getNFTContracts,
} from 'actions/nftAction'

import {
  updateSignatureStatus_exitLP,
  updateSignatureStatus_exitTRAD,
  updateSignatureStatus_depositLP,
  updateSignatureStatus_depositTRAD
} from 'actions/signAction'

import { WebWalletError } from 'services/errorService'

//Base contracts
import AddressManagerJson from '../deployment/artifacts-base/contracts/libraries/resolver/Lib_AddressManager.sol/Lib_AddressManager.json'
import L1StandardBridgeJson from '../deployment/artifacts-base/contracts/L1/messaging/L1StandardBridge.sol/L1StandardBridge.json'
import L2StandardBridgeJson from '../deployment/artifacts-base/contracts/L2/messaging/L2StandardBridge.sol/L2StandardBridge.json'

//OMGX LP contracts
import L1LPJson from '../deployment/artifacts-boba/contracts/LP/L1LiquidityPool.sol/L1LiquidityPool.json'
import L2LPJson from '../deployment/artifacts-boba/contracts/LP/L2LiquidityPool.sol/L2LiquidityPool.json'

//Standard ERC20 jsons
import L1ERC20Json from '../deployment/contracts/L1ERC20.json'
import L2ERC20Json from '../deployment/artifacts-base/contracts/standards/L2StandardERC20.sol/L2StandardERC20.json'

//special one-off location
import OMGJson from '../deployment/contracts/OMG.json'

//BOBA L2 Contracts
import L2ERC721Json    from '../deployment/artifacts-boba/contracts/ERC721Genesis.sol/ERC721Genesis.json'
import L2ERC721RegJson from '../deployment/artifacts-boba/contracts/ERC721Registry.sol/ERC721Registry.json'

// DAO
import Boba from "../deployment/artifacts-boba/contracts/standards/L2GovernanceERC20.sol/L2GovernanceERC20.json"
import GovernorBravoDelegate from "../deployment/contracts/GovernorBravoDelegate.json"
import GovernorBravoDelegator from "../deployment/contracts/GovernorBravoDelegator.json"

import { accDiv, accMul } from 'util/calculation'
import { getNftImageUrl } from 'util/nftImage'
import { getAllNetworks } from 'util/masterConfig'

import etherScanInstance from 'api/etherScanAxios'
import omgxWatcherAxiosInstance from 'api/omgxWatcherAxios'
import coinGeckoAxiosInstance from 'api/coinGeckoAxios'
import { sortRawTokens } from 'util/common'

require('dotenv').config()

const ERROR_ADDRESS = '0x0000000000000000000000000000000000000000'
const L1_ETH_Address = '0x0000000000000000000000000000000000000000'
const L2_ETH_Address = '0x4200000000000000000000000000000000000006'
const L2MessengerAddress = '0x4200000000000000000000000000000000000007'
const L2StandardBridgeAddress = '0x4200000000000000000000000000000000000010'

let allAddresses = {}
let allTokens = {}

class NetworkService {

  constructor() {

    this.L1Provider = null
    this.L2Provider = null

    this.provider = null
    this.environment = null

    // L1 or L2
    this.L1orL2 = null
    this.masterSystemConfig = null

    // Watcher
    this.watcher = null
    this.fastWatcher = null

    // addresses
    this.AddressManagerAddress = null
    this.AddressManager = null

    //this.ERC721Address = null
    //this.ERC721RegAddress = null

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
    this.L2GasLimit = 10000000

    // Dao
    this.BobaContract = null
    this.delegateContract = null
    this.delegatorContract = null

  }

  async enableBrowserWallet() {
    console.log('NS: enableBrowserWallet()')
    try {
      // connect to the wallet
      await window.ethereum.request({method: 'eth_requestAccounts'})
      this.provider = new ethers.providers.Web3Provider(window.ethereum)
      return true
    } catch (error) {
      return false
    }
  }

  bindProviderListeners() {
    window.ethereum.on('accountsChanged', () => {
      window.location.reload()
    })

    window.ethereum.on('chainChanged', () => {
      console.log('chainChanged')
      localStorage.setItem('changeChain', true)
      window.location.reload()
    })
  }

  // async mintAndSendNFT(receiverAddress, contractAddress, tokenURI) {

  //   try {

  //     let meta = Date.now().toString() + '#' + tokenURI + '#'

  //     const contract = new ethers.Contract(
  //       contractAddress,
  //       L2ERC721Json.abi,
  //       this.L2Provider
  //     )

  //     let nft = await contract.connect(
  //       this.provider.getSigner()
  //     ).mintNFT(
  //       receiverAddress,
  //       meta
  //     )

  //     await nft.wait()

  //     const registry = new ethers.Contract(
  //       this.ERC721RegAddress,
  //       L2ERC721RegJson.abi,
  //       this.L2Provider
  //     )

  //     //what types of NFTs does this address already own?
  //     const addresses = await registry.lookupAddress(
  //       receiverAddress
  //     )

  //     //console.log("the receiver's NFT contract addresses:", addresses)

  //     //the receiverAddress already knows about this contract
  //     const alreadyHaveAddresss = addresses.find((str) => str.toLowerCase() === contractAddress.toLowerCase())

  //     if (alreadyHaveAddresss) {
  //       //we are done - no need to double register addresss
  //       console.log('Done - no need to double register address')
  //     } else {
  //       //register address for the recipiant
  //       await registry.connect(
  //         this.provider.getSigner()
  //       ).registerAddress(
  //         receiverAddress,
  //         contractAddress
  //       )
  //       //console.log("Reg:",reg)
  //       console.log(`Contract registered in recipient's wallet`)
  //     }

  //     return true
  //   } catch (error) {
  //     console.log(error)
  //     return false
  //   }
  // }

  // async deployNFTContract(
  //     nftSymbol,
  //     nftName)
  // {

  //   try {

  //     console.log("Deploying NFT Contract")

  //     let Factory__L2ERC721 = new ContractFactory(
  //       L2ERC721Json.abi,
  //       L2ERC721Json.bytecode,
  //       this.provider.getSigner()
  //     )

  //     let contract = await Factory__L2ERC721.deploy(
  //       nftSymbol,
  //       nftName,
  //       BigNumber.from(String(0)), //starting index for the tokenIDs
  //       '0x0000000000000000000000000000000000000042',
  //       'simple',
  //       'boba_L2'
  //     )

  //     await contract.deployTransaction.wait()
  //     console.log('New NFT ERC721 contract deployed to:', contract.address)

  //     const registry = new ethers.Contract(
  //       this.ERC721RegAddress,
  //       L2ERC721RegJson.abi,
  //       this.L2Provider
  //     )

  //     //register address for the contract owner
  //     await registry.connect(
  //       this.provider.getSigner()
  //     ).registerAddress(
  //       this.account,
  //       contract.address
  //     )
  //     console.log(`New NFT ERC721 contract registered in Boba NFT registry`)

  //     //addNFTContract({address: contract.address})
  //     //this will get picked up automatically from the blockchain

  //     return true
  //   } catch (error) {
  //     console.log(error)
  //     return false
  //   }

  // }

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

  getAllAddresses() {
     return allAddresses
  }

  async initializeAccounts( masterSystemConfig ) {

    console.log('NS: initializeAccounts() for', masterSystemConfig)

    try {

      //at this point, the wallet should be connected
      this.account = await this.provider.getSigner().getAddress()
      console.log('this.account', this.account)

      const network = await this.provider.getNetwork()

      this.chainID = network.chainId
      this.networkName = network.name

      this.masterSystemConfig = masterSystemConfig

      console.log('NS: network:', network)
      console.log('NS: masterConfig:', this.masterSystemConfig)
      console.log('NS: this.chainID:', this.chainID)
      console.log('NS: this.networkName:', this.networkName)

      // defines the set of possible networks along with chainId for L1 and L2
      const nw = getAllNetworks()
      const L1ChainId = nw[masterSystemConfig]['L1']['chainId']
      const L2ChainId = nw[masterSystemConfig]['L2']['chainId']

      //there are numerous possible chains we could be on
      //either local, rinkeby etc
      //also, either L1 or L2

      //at this point, we only know whether we want to be on local or rinkeby etc
      if (masterSystemConfig === 'local' && network.chainId === L2ChainId) {
        //ok, that's reasonable
        //local deployment, L2
        this.L1orL2 = 'L2'
      } else if (masterSystemConfig === 'local' && network.chainId === L1ChainId) {
        //ok, that's reasonable
        //local deployment, L1
        this.L1orL2 = 'L1'
      } else if (masterSystemConfig === 'rinkeby' && network.chainId === L1ChainId) {
        //ok, that's reasonable
        //rinkeby, L1
        this.L1orL2 = 'L1'
      } else if (masterSystemConfig === 'rinkeby' && network.chainId === L2ChainId) {
        //ok, that's reasonable
        //rinkeby, L2
        this.L1orL2 = 'L2'
      } else if (masterSystemConfig === 'rinkeby_integration' && network.chainId === L1ChainId) {
        //ok, that's reasonable
        //rinkeby, L1
        this.L1orL2 = 'L1'
      } else if (masterSystemConfig === 'rinkeby_integration' && network.chainId === L2ChainId) {
        //ok, that's reasonable
        //rinkeby, L2
        this.L1orL2 = 'L2'
      } else if (masterSystemConfig === 'mainnet' && network.chainId === L1ChainId) {
        //ok, that's reasonable
        //rinkeby, L2
        this.L1orL2 = 'L1'
      } else if (masterSystemConfig === 'mainnet' && network.chainId === L2ChainId) {
        //ok, that's reasonable
        //rinkeby, L2
        this.L1orL2 = 'L2'
      } else {
        console.log("ERROR: masterSystemConfig does not match actual network.chainId")
        this.bindProviderListeners()
        return 'wrongnetwork'
      }

      this.L1Provider = new ethers.providers.StaticJsonRpcProvider(
        nw[masterSystemConfig]['L1']['rpcUrl']
      )
      this.L2Provider = new ethers.providers.StaticJsonRpcProvider(
        nw[masterSystemConfig]['L2']['rpcUrl']
      )

      this.AddressManagerAddress = nw[masterSystemConfig].addressManager
      console.log("AddressManager address:",this.AddressManagerAddress)

      this.AddressManager = new ethers.Contract(
        this.AddressManagerAddress,
        AddressManagerJson.abi,
        this.L1Provider
      )
      console.log("AddressManager Contract:",this.AddressManager)

      if (!(await this.getAddress('Proxy__L1CrossDomainMessenger', 'L1MessengerAddress'))) return
      if (!(await this.getAddress('L2CrossDomainMessenger', 'L2MessengerAddress'))) return
      if (!(await this.getAddress('Proxy__L1CrossDomainMessengerFast', 'L1FastMessengerAddress'))) return
      if (!(await this.getAddress('Proxy__L1StandardBridge', 'L1StandardBridgeAddress'))) return

      //L2StandardBridgeAddress is a predeploy, so add by hand....
      allAddresses = {
        ...allAddresses,
        'L2StandardBridgeAddress': L2StandardBridgeAddress
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
        this.provider.getSigner()
      )
      console.log("L1StandardBridgeContract:", this.L1StandardBridgeContract.address)

      const supportedTokens = [ 'USDT', 'DAI', 'USDC', 'WBTC',
                                'REP',  'BAT', 'ZRX',  'SUSHI',
                                'LINK', 'UNI', 'BOBA', 'OMG',
                                'FRAX', 'FXS', 'DODO', 'UST',
                                'BUSD', 'BNB', 'FTM',  'MATIC'
                              ]

      await Promise.all(supportedTokens.map(async (key) => {

        const L1a = await this.AddressManager.getAddress('TK_L1'+key)
        const L2a = await this.AddressManager.getAddress('TK_L2'+key)

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

      if (!(await this.getAddress('Proxy__L1LiquidityPool', 'L1LPAddress'))) return
      if (!(await this.getAddress('Proxy__L2LiquidityPool', 'L2LPAddress'))) return

      if(allAddresses.L2StandardBridgeAddress !== null) {
        this.L2StandardBridgeContract = new ethers.Contract(
          allAddresses.L2StandardBridgeAddress,
          L2StandardBridgeJson.abi,
          this.provider.getSigner()
        )
      }
      console.log("L2StandardBridgeContract:", this.L2StandardBridgeContract.address)

      this.L2_ETH_Contract = new ethers.Contract(
        allAddresses.L2_ETH_Address,
        L2ERC20Json.abi,
        this.provider.getSigner()
      )
      //console.log("L2_ETH_Contract:", this.L2_ETH_Contract.address)

      /*The test token*/
      this.L1_TEST_Contract = new ethers.Contract(
        allTokens.BOBA.L1, //this will get changed anyway when the contract is used
        L1ERC20Json.abi,
        this.provider.getSigner()
      )
      //console.log('L1_TEST_Contract:', this.L1_TEST_Contract)

      this.L2_TEST_Contract = new ethers.Contract(
        allTokens.BOBA.L2, //this will get changed anyway when the contract is used
        L2ERC20Json.abi,
        this.provider.getSigner()
      )
      //console.log('L2_TEST_Contract:', this.L2_TEST_Contract)

      /*The OMG token*/
      //We need this seperately because OMG is not ERC20 compliant
      this.L1_OMG_Contract = new ethers.Contract(
        allTokens.OMG.L1,
        OMGJson,
        this.provider.getSigner()
      )
      console.log('L1_OMG_Contract:', this.L1_OMG_Contract)

      // Liquidity pools
      console.log('Setting up contract for L1LP at:',allAddresses.L1LPAddress)
      this.L1LPContract = new ethers.Contract(
        allAddresses.L1LPAddress,
        L1LPJson.abi,
        this.provider.getSigner()
      )

      console.log('Setting up contract for L2LP at:',allAddresses.L2LPAddress)
      this.L2LPContract = new ethers.Contract(
        allAddresses.L2LPAddress,
        L2LPJson.abi,
        this.provider.getSigner()
      )

      // if (!(await this.getAddress('L2ERC721', 'L2ERC721Address'))) return
      // if (!(await this.getAddress('L2ERC721Reg', 'L2ERC721RegAddress'))) return

      // this.ERC721Contract = new ethers.Contract(
      //   allAddresses.L2ERC721Address,
      //   L2ERC721Json.abi,
      //   this.L2Provider
      // )

      // this.ERC721Contract = new ethers.Contract(
      //   allAddresses.L2ERC721RegAddress,
      //   L2ERC721RegJson.abi,
      //   this.L2Provider
      // )

      this.watcher = new Watcher({
        l1: {
          provider: this.L1Provider,
          messengerAddress: allAddresses.L1MessengerAddress,
        },
        l2: {
          provider: this.L2Provider,
          messengerAddress: allAddresses.L2MessengerAddress,
        },
      })

      this.fastWatcher = new Watcher({
        l1: {
          provider: this.L1Provider,
          messengerAddress: allAddresses.L1FastMessengerAddress,
        },
        l2: {
          provider: this.L2Provider,
          messengerAddress: allAddresses.L2MessengerAddress,
        },
      })

      //console.log('Setting up BOBA for the DAO:',allTokens.BOBA.L2)

      // this.BobaContract = new ethers.Contract(
      //   allTokens.BOBA.L2,
      //   Boba.abi,
      //   this.provider.getSigner()
      // )

      //DAO related
      if( masterSystemConfig === 'local' ) {

        if (!(await this.getAddress('GovernorBravoDelegate', 'GovernorBravoDelegate'))) return
        if (!(await this.getAddress('GovernorBravoDelegator', 'GovernorBravoDelegator'))) return

        this.delegateContract = new ethers.Contract(
          allAddresses.GovernorBravoDelegate,
          GovernorBravoDelegate.abi,
          this.provider.getSigner()
        )

        this.delegatorContract = new ethers.Contract(
          allAddresses.GovernorBravoDelegator,
          GovernorBravoDelegator.abi,
          this.provider.getSigner()
        )
      }

      this.bindProviderListeners()

      return 'enabled'
    } catch (error) {
      console.log(error)
      return false
    }
  }

  async addL2Network() {

    console.log("MetaMask: Adding network to MetaMask")

    const nw = getAllNetworks()
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

  /* Yes, this almost complete duplicates async switchChain( layer )
  but that's safest for now */
  async correctChain( targetLayer ) {

    const nw = getAllNetworks()
    const masterConfig = store.getState().setup.masterConfig

    let blockExplorerUrls = null

    //local does not have a blockexplorer
    if( masterConfig !== 'local') {
      blockExplorerUrls = [nw[masterConfig].L2.blockExplorer.slice(0, -1)]
    }

    //the chainParams are only needed for the L2's
    const chainParam = {
      chainId: '0x' + nw[masterConfig].L2.chainId.toString(16),
      chainName: nw[masterConfig].L2.name,
      rpcUrls: [nw[masterConfig].L2.rpcUrl],
      blockExplorerUrls
    }

    const targetIDHex = nw[masterConfig][targetLayer].chainIdHex

    this.provider = new ethers.providers.Web3Provider(window.ethereum)

    try {
      await this.provider.send('wallet_switchEthereumChain', [{ chainId: targetIDHex }])
    } catch (error) {
      // 4902 = the chain has not been added to MetaMask.
      if (error.code === 4902) {
        try {
          await this.provider.send('wallet_addEthereumChain', [chainParam, this.account])
        } catch (addError) {
          console.log("MetaMask - Error adding new RPC: ", addError)
        }
      } else { //some other error code
        console.log("MetaMask - Switch Error: ", error.code)
      }
    }
  }

  async switchChain( layer ) {

    if(this.L1orL2 === layer) {
      console.log("Nothing to do - You are already on ",layer)
      return
    }

    this.correctChain( layer )

  }

  async getTransactions() {

    // NOT SUPPORTED on LOCAL
    if (this.masterSystemConfig === 'local') return

    console.log("Getting transactions...")

    let txL1 = []
    let txL1pending = []
    let txL2 = []

    //console.log("trying")

    const responseL1 = await etherScanInstance(
      this.masterSystemConfig,
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
        //console.log("txL1",txL1)
        //return transactions.result
      }
    }

    const responseL2 = await omgxWatcherAxiosInstance(
      this.masterSystemConfig
    ).post('get.l2.transactions', {
      address: this.account,
      fromRange:  0,
      toRange: 1000,
    })

    console.log("responseL2",responseL2)

    if (responseL2.status === 201) {
      //add the chain: 'L2' field
      txL2 = responseL2.data.map(v => ({...v, chain: 'L2'}))
    }

    const responseL1pending = await omgxWatcherAxiosInstance(
      this.masterSystemConfig
    ).post('get.l1.transactions', {
      address: this.account,
      fromRange:  0,
      toRange: 1000,
    })

    console.log("responseL1pending",responseL1pending)

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

  // /* Where possible, annotate the transactions
  // based on contract addresses */
  // async parseTransaction( transactions ) {

  //   // NOT SUPPORTED on LOCAL
  //   if (this.masterSystemConfig === 'local') return

  //   var annotatedTX = transactions.map(item => {

  //     let to = item.to

  //     if ( to === null || to === '') {
  //       return item
  //     }

  //     to = to.toLowerCase()

  //     if (to === allAddresses.L2LPAddress.toLowerCase()) {
  //       //console.log("L2->L1 Swap Off")
  //       return Object.assign({}, item, { typeTX: 'Fast Bridge to L1' })
  //     }

  //     if (to === allAddresses.L1LPAddress.toLowerCase()) {
  //       //console.log("L1->L2 Swap On")
  //       return Object.assign({}, item, { typeTX: 'Fast Bridge to L2' })
  //     }

  //     if (to === allAddresses.L1StandardBridgeAddress.toLowerCase()) {
  //       //console.log("L1->L2 Traditional Deposit")
  //       return Object.assign({}, item, { typeTX: 'Classic Bridge to L2' })
  //     }

  //     if (to === allAddresses.L2StandardBridgeAddress.toLowerCase()) {
  //       //console.log("L2 Standard Bridge")
  //       return Object.assign({}, item, { typeTX: 'Classic Bridge to L1' })
  //     }

  //     if (to === allTokens.BOBA.L1.toLowerCase()) {
  //       //console.log("L1 ERC20 Amount Approval")
  //       return Object.assign({}, item, { typeTX: 'L1 ERC20 Amount Approval' })
  //     }

  //     if (to === allTokens.BOBA.L2.toLowerCase()) {
  //       return Object.assign({}, item, { typeTX: 'L2 Standard Token' })
  //     }

  //     if (to === allAddresses.L2_ETH_Address.toLowerCase()) {
  //       //console.log("L2 ETH Message")
  //       return Object.assign({}, item, { typeTX: 'L2 ETH Ops (such as a L2->L2 Transfer)' })
  //     }

  //     if (item.crossDomainMessage) {
  //       if(to === allAddresses.L2LPAddress.toLowerCase()) {
  //         return Object.assign({}, item, { typeTX: 'FAST EXIT via L2LP' })
  //       }
  //       else if (to === allTokens.BOBA.L2.toLowerCase()) {
  //         return Object.assign({}, item, { typeTX: 'xDomain (Standard Token)' })
  //       }
  //       else if (to === allAddresses.L2_ETH_Address.toLowerCase()) {
  //         //console.log("Found EXIT: L2_ETH_Address")
  //         return Object.assign({}, item, { typeTX: 'EXIT ETH' })
  //       }
  //     }

  //     return Object.assign({}, item, { typeTX: 'Approval/Other (' + to + ')' })

  //   }) //map

  //   return annotatedTX

  // }

  async getExits() {

    console.log("getExits()")

    // NOT SUPPORTED on LOCAL
    if (this.masterSystemConfig === 'local') return

    const response = await omgxWatcherAxiosInstance(
      this.masterSystemConfig
    ).post('get.l2.transactions', {
      address: this.account,
      fromRange:  0,
      toRange: 1000,
    })

    if (response.status === 201) {
      const transactions = response.data
      console.log(transactions)
      const filteredTransactions = transactions.filter(
        (i) => i.exitL2 && i.crossDomainMessage
      )
      return { exited: filteredTransactions }
    }

  }

  //goal is to find your NFTs and NFT contracts based on local cache and registry data
  async fetchNFTs() {

    return //still need to deploy ERC721 contracts on mainnet

    console.log("scanning for NFTs...")

    if(allAddresses.L2ERC721RegAddress === null) return

    console.log("scanning for NFTs...", allAddresses.L2ERC721RegAddress)

    //the current list of contracts we know about
    //based in part on the cache and anything we recently generated in this session
    //console.log("NFTContracts 1:",await getNFTContracts())

    let NFTContracts = Object.entries(await getNFTContracts())
    //console.log("Step 1 - NFTContracts:",NFTContracts)

    //list of NFT contract addresses we know about, locally
    const localCache = NFTContracts.map(item => {
      return item[0].toLowerCase()
    })

    //console.log("Step 2 - localCache addresses:",localCache)

    //the Boba NFT registry
    const registry = new ethers.Contract(
      allAddresses.L2ERC721RegAddress,
      L2ERC721RegJson.abi,
      this.L2Provider
    )

    //This account's NFT contract addresses in that registry
    const addresses = await registry.lookupAddress(this.account)
    //console.log("Step 3 - Blockchain NFT wallet addresses:", addresses)

    //make sure we have all the contracts relevant to this user
    for(let i = 0; i < addresses.length; i++) {
      const address = addresses[i]
      var inCache = (localCache.indexOf(address.toLowerCase()) > -1)
      if(!inCache) {
        console.log("Found a new NFT contract - adding:",address)
        //Add to local NFT contracts structure
        const contract = new ethers.Contract(
          address,
          L2ERC721Json.abi,
          this.L2Provider
        )

        //always the same, no need to have in the loop
        let nftName = await contract.name()
        let nftSymbol = await contract.symbol()
        let owner = await contract.owner()

        const newContract = {
          name: nftName,
          symbol: nftSymbol,
          owner: owner.toLowerCase(),
          address,
        }

        console.log("newContract just added:",newContract)

        await addNFTContract( newContract )
      }
    }

    //How many NFTs do you have right now?
    let numberOfNFTS = 0

    NFTContracts = Object.entries(await getNFTContracts())

    for(let i = 0; i < NFTContracts.length; i++) {

      let contract = new ethers.Contract(
        NFTContracts[i][1].address,
        L2ERC721Json.abi,
        this.L2Provider
      )

      //how many NFTs of this flavor do I own?
      const balance = await contract.connect(
        this.L2Provider
      ).balanceOf(this.account)

      numberOfNFTS = numberOfNFTS + Number(balance.toString())

    }

    //let's see if we already know about them
    const myNFTS = getNFTs()
    const numberOfStoredNFTS = Object.keys(myNFTS).length

    if (numberOfNFTS !== numberOfStoredNFTS) {

      console.log('NFT change - need to add one or more NFTs')

      for(let i = 0; i < NFTContracts.length; i++) {

        const address = NFTContracts[i][1].address

        const contract = new ethers.Contract(
          address,
          L2ERC721Json.abi,
          this.L2Provider
        )

        console.log("NFT contracts:",contract)

        const balance = await contract.connect(
          this.L2Provider
        ).balanceOf(this.account)

        console.log("balance:",balance)

        //always the same, no need to have in the loop
        let nftName = await contract.name()
        let nftSymbol = await contract.symbol()

        //can have more than 1 per contract
        for (let i = 0; i < Number(balance.toString()); i++) {

          console.log("looking up first NFT:",i)

          //Goal here is to get all the tokenIDs, e.g. 3, 7, and 98,
          //based on knowing the user's balance - e.g. three NFTs
          const tokenIndex = BigNumber.from(i)

          const tokenID = await contract.tokenOfOwnerByIndex(
            this.account,
            tokenIndex
          )

          const nftMeta = await contract.tokenURI(tokenID)

          console.log("nftMeta:",nftMeta)

          const UUID = address.substring(1, 6) + '_' + tokenID.toString() + '_' + this.account.substring(1, 6)
          const { url , attributes = []} = await getNftImageUrl(nftMeta !== '' ? nftMeta : `https://boredapeyachtclub.com/api/mutants/121`)

          let NFT = {
            UUID,
            tokenID,
            name: nftName,
            symbol: nftSymbol,
            address,
            url,
            attributes
          }

          await addNFT( NFT )

        }
      }
    }
  }

  async addTokenList() {
    // Add the token to our master list, if we do not have it yet
    // if the token is already in the list, then this function does nothing
    // but if a new token shows up, then it will get added
    if(allTokens === null) return

    Object.keys(allTokens).forEach((token, i) => {
      //console.log("allTokens[token].L1:",allTokens[token].L1)
      getToken(allTokens[token].L1)
    })
  }

  async getL2FeeBalance() {
    try {
      const layer2Balance = await this.L2Provider.getBalance(this.account)
      return utils.formatEther(layer2Balance)
    } catch (error) {
      throw new WebWalletError({
        originalError: error,
        reportToSentry: false,
        reportToUi: false,
      })
    }
  }

  async getBalances() {

    try {
      // Always check ETH
      const layer1Balance = await this.L1Provider.getBalance(this.account)
      const layer2Balance = await this.L2Provider.getBalance(this.account)

      const layer1Balances = [
        {
          address: allAddresses.L1_ETH_Address,
          addressL2: allAddresses.L2_ETH_Address,
          currency: allAddresses.L1_ETH_Address,
          symbol: 'ETH',
          decimals: 18,
          balance: new BN(layer1Balance.toString()),
        },
      ]

      const layer2Balances = [
        {
          address: allAddresses.L2_ETH_Address,
          addressL1: allAddresses.L1_ETH_Address,
          currency: allAddresses.L1_ETH_Address,
          symbol: 'ETH',
          decimals: 18,
          balance: new BN(layer2Balance.toString()),
        },
      ]

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
        getBalancePromise.push(getERC20Balance(token, token.addressL1, "L1", this.L1Provider))
        getBalancePromise.push(getERC20Balance(token, token.addressL2, "L2", this.L2Provider))
      })

      const tokenBalances = await Promise.all(getBalancePromise)

      tokenBalances.forEach((token) => {
        if (token.layer === 'L1' && token.balance.gt(new BN(0))) {
          layer1Balances.push(token)
        } else if (token.layer === 'L2' && token.balance.gt(new BN(0))){
          layer2Balances.push(token)
        }
      })

      return {
        layer1: orderBy(layer1Balances, (i) => i.currency),
        layer2: orderBy(layer2Balances, (i) => i.currency),
      }
    } catch (error) {
      throw new WebWalletError({
        originalError: error,
        reportToSentry: false,
        reportToUi: false,
      })
    }
  }

  handleMetaMaskError = (errorCode) => {
    switch (errorCode) {
      case 4001:
        return 'Transaction was rejected by user: signature denied'
      default:
        return null
    }
  }

  //Move ETH from L1 to L2 using the standard deposit system
  depositETHL2 = async (value_Wei_String) => {

    console.log("this.L1StandardBridgeContract:",this.L1StandardBridgeContract)

    updateSignatureStatus_depositTRAD(false)

    try {

      const time_start = new Date().getTime()
      console.log("TX start time:", time_start)

      const depositTx = await this.L1StandardBridgeContract.depositETH(
        this.L2GasLimit,
        utils.formatBytes32String(new Date().getTime().toString()),
        {
          value: value_Wei_String
        }
      )

      //at this point the tx has been submitted, and we are waiting...
      await depositTx.wait()

      const block = await this.L1Provider.getTransaction(depositTx.hash)
      console.log(' block:', block)

      //closes the Deposit modal
      updateSignatureStatus_depositTRAD(true)

      const [msgHash] = await this.watcher.getMessageHashesFromL1Tx(
        depositTx.hash
      )
      console.log(' got L1->L2 message hash', msgHash)

      const receipt = await this.watcher.getL2TransactionReceipt(
        msgHash
      )
      console.log(' completed Deposit! L2 tx hash:', receipt.transactionHash)

      const time_stop = new Date().getTime()
      console.log("TX finish time:", time_stop)

      const data = {
        "key": process.env.REACT_APP_SPEED_CHECK,
        "hash": depositTx.hash,
        "l1Tol2": false, //since we are going L2->L1
        "startTime": time_start,
        "endTime": time_stop,
        "block": block.blockNumber,
        "cdmHash": receipt.transactionHash,
        "cdmBlock": receipt.blockNumber
      }

      console.log("Speed checker data payload:", data)

      const speed = await omgxWatcherAxiosInstance(
        this.masterSystemConfig
      ).post('send.crossdomainmessage', data)

      console.log("Speed checker:", speed)

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

      if(currency === allAddresses.L2_ETH_Address) {
        //we are sending ETH

        let wei = BigNumber.from(value_Wei_String)

        tx = await this.provider.send('eth_sendTransaction',
          [
            {
              from: this.account,
              to: address,
              value: ethers.utils.hexlify(wei)
            }
          ]
        )

      } else {
        //any ERC20 json will do....
        tx = await this.L2_TEST_Contract.attach(currency).transfer(
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
      return allowance //.toString()
    } catch (error) {
      console.log("NS: checkAllowance error:", error)
      throw new WebWalletError({
        originalError: error,
        customErrorMessage: 'Could not check ERC20 allowance.',
        reportToSentry: false,
        reportToUi: true,
      })
    }
  }

  /*Used when people want to fast exit - they have to deposit funds into the L2LP*/
  async approveERC20_L2LP(
    value_Wei_String,
    currencyAddress
  ) {

    try {

      console.log("approveERC20_L2LP")

      //we could use any L2 ERC contract here - just getting generic parts of the abi
      //but we know we alaways have the TEST contract, so will use that
      const L2ERC20Contract = this.L2_TEST_Contract.attach(currencyAddress)

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
          console.log("Current OMG Token allowance too small - need to reset to 0")
          const approveOMG = await ERC20Contract.approve(
            approveContractAddress,
            ethers.utils.parseEther("0")
          )
          await approveOMG.wait()
          console.log("OMG Token allowance set to 0:",approveOMG)
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
        console.log("ERC 20 L1 BRIDGE ops approved:",approveStatus)
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
        console.log("Current OMG Token allowance too small - need to reset to 0")
        const approveOMG = await ERC20Contract.approve(
          approveContractAddress,
          ethers.utils.parseEther("0")
        )
        await approveOMG.wait()
        console.log("OMG Token allowance set to 0:",approveOMG)
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
        console.log("ERC 20 L1 SWAP ops approved:",approveStatus)
      }

      return true
    } catch (error) {
      console.log("NS: approveERC20 error:", error)
      return false
    }
  }

  //Used to move ERC20 Tokens from L1 to L2
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
        console.log("Current OMG Token allowance too small - need to reset to 0")
        const approveOMG = await L1_TEST_Contract.approve(
          allAddresses.L1StandardBridgeAddress,
          ethers.utils.parseEther("0")
        )
        await approveOMG.wait()
        console.log("OMG Token allowance set to 0:",approveOMG)
      }

      //recheck the allowance
      allowance_BN = await L1_TEST_Contract.allowance(
        this.account,
        allAddresses.L1StandardBridgeAddress
      )

      const allowed = allowance_BN.gte(BigNumber.from(value_Wei_String))

      if(!allowed) {
        //and now, the normal allowance transaction
        const approveStatus = await L1_TEST_Contract.approve(
          allAddresses.L1StandardBridgeAddress,
          value_Wei_String
        )
        await approveStatus.wait()
        console.log("ERC 20 L1 ops approved:",approveStatus)
      }

      const time_start = new Date().getTime()
      console.log("TX start time:", time_start)

      const depositTx = await this.L1StandardBridgeContract.depositERC20(
        currency,
        currencyL2,
        value_Wei_String,
        this.L2GasLimit,
        utils.formatBytes32String(new Date().getTime().toString())
      )

      console.log("depositTxStatus:",depositTx)

      //at this point the tx has been submitted, and we are waiting...
      await depositTx.wait()

      const block = await this.L1Provider.getTransaction(depositTx.hash)
      console.log(' block:', block)

      //closes the Deposit modal
      updateSignatureStatus_depositTRAD(true)

      const [msgHash] = await this.watcher.getMessageHashesFromL1Tx(
        depositTx.hash
      )
      console.log(' got L1->L2 message hash', msgHash)

      const receipt = await this.watcher.getL2TransactionReceipt(
        msgHash
      )
      console.log(' completed Deposit! L2 tx hash:', receipt.transactionHash)

      const time_stop = new Date().getTime()
      console.log("TX finish time:", time_stop)

      const data = {
        "key": process.env.REACT_APP_SPEED_CHECK,
        "hash": depositTx.hash,
        "l1Tol2": true,
        "startTime": time_start,
        "endTime": time_stop,
        "block": block.blockNumber,
        "cdmHash": receipt.transactionHash,
        "cdmBlock": receipt.blockNumber
      }

      console.log("Speed checker data payload:", data)

      const speed = await omgxWatcherAxiosInstance(
        this.masterSystemConfig
      ).post('send.crossdomainmessage', data)

      console.log("Speed checker:", speed)

      this.getBalances()

      return receipt
    } catch (error) {
      throw new WebWalletError({
        originalError: error,
        customErrorMessage:
          'Could not deposit ERC20. Please check to make sure you have enough in your wallet to cover both the amount you want to deposit and the associated gas fees.',
        reportToSentry: false,
        reportToUi: true,
      })
    }
  }

  //Standard 7 day exit from BOBA
  async exitBOBA(currencyAddress, value_Wei_String) {

    updateSignatureStatus_exitTRAD(false)

    //now coming in as a value_Wei_String
    const value = BigNumber.from(value_Wei_String)

    const allowance = await this.checkAllowance(
      currencyAddress,
      allAddresses.L2StandardBridgeAddress
    )

    //no need to approve L2 ETH
    if( currencyAddress !== allAddresses.L2_ETH_Address && allowance.lt(value) ) {
      const res = await this.approveERC20(
        value_Wei_String,
        currencyAddress,
        this.L2StandardBridgeAddress
      )
      if (!res) return false
    }

    const tx = await this.L2StandardBridgeContract.withdraw(
      currencyAddress,
      value_Wei_String,
      this.L1GasLimit,
      utils.formatBytes32String(new Date().getTime().toString())
    )

    //everything submitted... waiting
    await tx.wait()

    //can close window now
    updateSignatureStatus_exitTRAD(true)

    const [L2ToL1msgHash] = await this.watcher.getMessageHashesFromL2Tx(tx.hash)
    console.log(' got L2->L1 message hash', L2ToL1msgHash)

    return tx
  }

  /***********************************************/
  /*****                  Fee                *****/
  /***** Fees are reported as integers,      *****/
  /***** where every int represents 0.1%     *****/
  /***********************************************/

  async getL1TotalFeeRate() {
    const L1LPContract = new ethers.Contract(
      allAddresses.L1LPAddress,
      L1LPJson.abi,
      this.L1Provider
    )
    const [userRewardFeeRate, ownerRewardFeeRate] = await Promise.all([
      L1LPContract.userRewardFeeRate(),
      L1LPContract.ownerRewardFeeRate()
    ])
    const feeRate = Number(userRewardFeeRate) + Number(ownerRewardFeeRate)

    return (feeRate / 10).toFixed(1)
  }

  // Total exit fee
  async getTotalFeeRate() {
    const L2LPContract = new ethers.Contract(
      allAddresses.L2LPAddress,
      L2LPJson.abi,
      this.L2Provider
    )
    const [userRewardFeeRate, ownerRewardFeeRate] = await Promise.all([
      L2LPContract.userRewardFeeRate(),
      L2LPContract.ownerRewardFeeRate()
    ])
    //console.log("Fee URFR:",userRewardFeeRate.toString())
    //console.log("Fee ORFR:",ownerRewardFeeRate.toString())
    const feeRate = Number(userRewardFeeRate) + Number(ownerRewardFeeRate)
    //console.log("FeeRate:",feeRate)
    return (feeRate / 10).toFixed(1)
  }

  async getUserRewardFeeRate() {
    const L2LPContract = new ethers.Contract(
      allAddresses.L2LPAddress,
      L2LPJson.abi,
      this.L2Provider
    )
    const feeRate = await L2LPContract.userRewardFeeRate()
    return (feeRate / 10).toFixed(1)
  }

  /*****************************************************/
  /***** Pool, User Info, to populate the Farm tab *****/
  /*****************************************************/
  async getL1LPInfo() {

    let tokenAddressList = Object.keys(allTokens).reduce((acc, cur) => {
      acc.push(allTokens[cur].L1.toLowerCase())
      return acc
    }, [allAddresses.L1_ETH_Address])

    const L1LPContract = new ethers.Contract(
      allAddresses.L1LPAddress,
      L1LPJson.abi,
      this.L1Provider
    )

    const poolInfo = {}
    const userInfo = {}

    const L1LPInfoPromise = []

    const getL1LPInfoPromise = async(tokenAddress) => {

      let tokenBalance
      let tokenSymbol
      let tokenName
      let decimals

      if (tokenAddress === allAddresses.L1_ETH_Address) {
        console.log("Getting eth balance:", tokenAddress)
        //getting eth balance
        tokenBalance = await this.L1Provider.getBalance(allAddresses.L1LPAddress)
        tokenSymbol = 'ETH'
        tokenName = 'Ethereum'
        decimals = 18
      } else {
        //getting eth balance
        console.log("Getting balance for:", tokenAddress)
        tokenBalance = await this.L1_TEST_Contract.attach(tokenAddress).connect(this.L1Provider).balanceOf(allAddresses.L1LPAddress)
        tokenSymbol = await this.L1_TEST_Contract.attach(tokenAddress).connect(this.L1Provider).symbol()
        tokenName = await this.L1_TEST_Contract.attach(tokenAddress).connect(this.L1Provider).name()
        decimals = await this.L1_TEST_Contract.attach(tokenAddress).connect(this.L1Provider).decimals()
      }

      const poolTokenInfo = await L1LPContract.poolInfo(tokenAddress)
      const userTokenInfo = await L1LPContract.userInfo(tokenAddress, this.account)
      //console.log(tokenAddress, tokenBalance, tokenSymbol, tokenName, poolTokenInfo, userTokenInfo, decimals)
      return { tokenAddress, tokenBalance, tokenSymbol, tokenName, poolTokenInfo, userTokenInfo, decimals }
    }

    tokenAddressList.forEach((tokenAddress) => L1LPInfoPromise.push(getL1LPInfoPromise(tokenAddress)))

    const L1LPInfo = await Promise.all(L1LPInfoPromise)

    sortRawTokens(L1LPInfo).forEach((token) => {
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
        APR:
          Number(token.poolTokenInfo.userDepositAmount.toString()) === 0
            ? 0
            : accMul(
                accDiv(
                  accDiv(
                    token.poolTokenInfo.accUserReward,
                    token.poolTokenInfo.userDepositAmount
                  ),
                  accDiv(
                    new Date().getTime() -
                      Number(token.poolTokenInfo.startTime) * 1000,
                    365 * 24 * 60 * 60 * 1000
                  )
                ),
                100
              ), // ( accUserReward - userDepositAmount ) / timeDuration
        tokenBalance: token.tokenBalance.toString()
      }
      userInfo[token.tokenAddress] = {
        l1TokenAddress: token.tokenAddress.toLowerCase(),
        amount: token.userTokenInfo.amount.toString(),
        pendingReward: token.userTokenInfo.pendingReward.toString(),
        rewardDebt: token.userTokenInfo.rewardDebt.toString()
      }
    })
    return { poolInfo, userInfo }
  }

  async getL2LPInfo() {

    const tokenAddressList = Object.keys(allTokens).reduce((acc, cur) => {
      acc.push({
        L1: allTokens[cur].L1.toLowerCase(),
        L2: allTokens[cur].L2.toLowerCase()
      });
      return acc;
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
      console.log("tokenAddress",tokenAddress)
      console.log("poolTokenInfo",poolTokenInfo)
      const userTokenInfo = await L2LPContract.userInfo(tokenAddress, this.account)
      return { tokenAddress, tokenBalance, tokenSymbol, tokenName, poolTokenInfo, userTokenInfo, decimals}
    }

    tokenAddressList.forEach(({L1, L2}) => L2LPInfoPromise.push(getL2LPInfoPromise(L2, L1)))

    const L2LPInfo = await Promise.all(L2LPInfoPromise)

    sortRawTokens(L2LPInfo).forEach((token) => {
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
        APR:
          Number(token.poolTokenInfo.userDepositAmount.toString()) === 0
            ? 0
            : accMul(
                accDiv(
                  accDiv(
                    token.poolTokenInfo.accUserReward,
                    token.poolTokenInfo.userDepositAmount
                  ),
                  accDiv(
                    new Date().getTime() -
                      Number(token.poolTokenInfo.startTime) * 1000,
                    365 * 24 * 60 * 60 * 1000
                  )
                ),
                100
              ), // ( accUserReward - userDepositAmount ) / timeDuration
        tokenBalance: token.tokenBalance.toString()
      }
      userInfo[token.tokenAddress.toLowerCase()] = {
        l2TokenAddress: token.tokenAddress.toLowerCase(),
        amount: token.userTokenInfo.amount.toString(),
        pendingReward: token.userTokenInfo.pendingReward.toString(),
        rewardDebt: token.userTokenInfo.rewardDebt.toString()
      }
    })

    return { poolInfo, userInfo }
  }

  /***********************************************/
  /*****            Add Liquidity            *****/
  /***********************************************/
  async addLiquidity(currency, value_Wei_String, L1orL2Pool) {

    //console.log("currency",currency)
    //console.log("value_Wei_String",value_Wei_String)
    //console.log("L1orL2Pool",L1orL2Pool)

    let otherField = {}

    if( currency === allAddresses.L1_ETH_Address || currency === allAddresses.L2_ETH_Address ) {
      //console.log("Yes we have ETH")
      otherField = { value: value_Wei_String }
    }

    try {
      // Deposit
      const addLiquidityTX = await (L1orL2Pool === 'L1LP'
        ? this.L1LPContract
        : this.L2LPContract
      ).addLiquidity(
        value_Wei_String,
        currency,
        otherField
      )
      await addLiquidityTX.wait()
      return true
    } catch (err) {
      console.log(err)
      return false
    }
  }

  /***********************************************/
  /*****           Get Reward L1             *****/
  /***********************************************/
  async getRewardL1(currencyL1Address, value_Wei_String) {

    try {
      const withdrawRewardTX = await this.L1LPContract.withdrawReward(
        value_Wei_String,
        currencyL1Address,
        this.account
      )
      await withdrawRewardTX.wait()
      return withdrawRewardTX
    } catch (err) {
      return err
    }
  }

  /***********************************************/
  /*****           Get Reward L2             *****/
  /***********************************************/
  async getRewardL2(currencyL2Address, value_Wei_String) {

    try {
      const withdrawRewardTX = await this.L2LPContract.withdrawReward(
        value_Wei_String,
        currencyL2Address,
        this.account
      )
      await withdrawRewardTX.wait()
      return withdrawRewardTX
    } catch (err) {
      return err
    }
  }

  /***********************************************/
  /*****          Withdraw Liquidity         *****/
  /***********************************************/
  async withdrawLiquidity(currency, value_Wei_String, L1orL2Pool) {

    try {
      const withdrawLiquidityTX = await (L1orL2Pool === 'L1LP'
        ? this.L1LPContract
        : this.L2LPContract
      ).withdrawLiquidity(
        value_Wei_String,
        currency,
        this.account
      )
      await withdrawLiquidityTX.wait()
      return withdrawLiquidityTX
    } catch (err) {
      return err
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

    const depositTX = await this.L1LPContract.clientDepositL1(
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

    // Waiting the response from L2
    const [msgHash] = await this.watcher.getMessageHashesFromL1Tx(
      depositTX.hash
    )
    console.log(' got L1->L2 message hash', msgHash)

    const receipt = await this.watcher.getL2TransactionReceipt(msgHash)
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
      this.masterSystemConfig
    ).post('send.crossdomainmessage', data)

    console.log("Speed checker:", speed)

    return receipt
  }

  /***************************************/
  /************ L1LP Pool size ***********/
  /***************************************/
  async L1LPBalance(tokenAddress) {

    let balance
    let tokenAddressLC = tokenAddress.toLowerCase()

    if (
      tokenAddressLC === allAddresses.L2_ETH_Address ||
      tokenAddressLC === allAddresses.L1_ETH_Address
    ) {
      balance = await this.L1Provider.getBalance(allAddresses.L1LPAddress)
    } else {
      balance = await this.L1_TEST_Contract.attach(tokenAddress).connect(this.L1Provider).balanceOf(
        allAddresses.L1LPAddress
      )
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
    } catch (err) {
      return err
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
    } catch (err) {
      return err
    }
    
  }

  /* Estimate cost of Fast Bridge to L1 */
  async getFastExitCost(currencyAddress) {

    let approvalCost_BN = BigNumber.from('0')

    const gasPrice = await this.L2Provider.getGasPrice()
    console.log("Fast exit gas price", gasPrice.toString())

    if( currencyAddress !== allAddresses.L2_ETH_Address ) {

      const L2ERC20Contract = new ethers.Contract(
        currencyAddress,
        L2ERC20Json.abi,
        this.provider.getSigner()
      )

      const tx = await L2ERC20Contract.populateTransaction.approve(
        allAddresses.L2LPAddress,
        utils.parseEther('1.0')
      )

      const approvalGas_BN = await this.L2Provider.estimateGas(tx)
      approvalCost_BN = approvalGas_BN.mul(gasPrice)
      console.log("Approve cost in ETH:", utils.formatEther(approvalCost_BN))
    }

    //in soem cases zero not allowed
    const tx2 = await this.L2LPContract.populateTransaction.clientDepositL2(
      currencyAddress === allAddresses.L2_ETH_Address ? '1' : '0', //ETH does not allow zero
      currencyAddress,
      currencyAddress === allAddresses.L2_ETH_Address ? { value : '1'} : {}
    )

    const depositGas_BN = await this.L2Provider.estimateGas(tx2)
    console.log("Fast exit gas", depositGas_BN.toString())

    const depositCost_BN = depositGas_BN.mul(gasPrice)
    console.log("Fast exit cost (ETH)", utils.formatEther(depositCost_BN))

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

    //console.log("Address:",currencyAddress)
    if( currencyAddress !== allAddresses.L2_ETH_Address ) {

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

    const tx2 = await this.L2LPContract.populateTransaction.clientDepositL2(
      balance_BN,
      currencyAddress,
      currencyAddress === allAddresses.L2_ETH_Address ? { value : balance_BN } : {}
    )
    //console.log("tx2",tx2)

    let depositGas_BN = await this.L2Provider.estimateGas(tx2)

    //returns 94082, which is too low?
    //add 40...
    //BUG BUG BUG - this should not be needed
    depositGas_BN = depositGas_BN.add('40')

    console.log("Deposit gas", depositGas_BN.toString())
    let depositCost_BN = depositGas_BN.mul(gasPrice)
    console.log("Deposit gas cost (ETH)", utils.formatEther(depositCost_BN))

    if(currencyAddress === allAddresses.L2_ETH_Address) {
      //if fee token, need to consider cost to exit
      balance_BN = balance_BN.sub(depositCost_BN)
    }

    const ccBal = await this.L2Provider.getBalance(this.account)

    console.log("Balance:", utils.formatEther(ccBal))
    console.log("Cost to exit:", utils.formatEther(depositCost_BN))
    console.log("Amount to exit:", utils.formatEther(balance_BN))
    console.log("Should be zero:", ccBal.sub(balance_BN.add(depositCost_BN)).toString())

    const time_start = new Date().getTime()
    console.log("TX start time:", time_start)

    const depositTX = await this.L2LPContract.clientDepositL2(
      balance_BN,
      currencyAddress,
      currencyAddress === allAddresses.L2_ETH_Address ? { value : balance_BN } : {}
    )

    //at this point the tx has been submitted, and we are waiting...
    await depositTX.wait()

    const block = await this.L2Provider.getTransaction(depositTX.hash)
    console.log(' block:', block)

    //closes the modal
    updateSignatureStatus_exitLP(true)

    // Waiting for the response from L1
    const [msgHash] = await this.fastWatcher.getMessageHashesFromL2Tx(
      depositTX.hash
    )
    console.log(' got L2->L1 message hash', msgHash)

    const receipt = await this.fastWatcher.getL1TransactionReceipt(
      msgHash
    )
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
      this.masterSystemConfig
    ).post('send.crossdomainmessage', data)

    console.log("Speed checker:", speed)

    return receipt
  }

  /**************************************************************/
  /***** SWAP OFF from BOBA by depositing funds to the L2LP *****/
  /**************************************************************/
  async depositL2LP(currencyAddress, value_Wei_String) {

    updateSignatureStatus_exitLP(false)

    console.log("depositL2LP currencyAddress",currencyAddress)

    if( currencyAddress !== allAddresses.L2_ETH_Address ) {

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

    const depositTX = await this.L2LPContract.clientDepositL2(
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

    // Waiting for the response from L1
    const [msgHash] = await this.fastWatcher.getMessageHashesFromL2Tx(
      depositTX.hash
    )
    console.log(' got L2->L1 message hash', msgHash)

    const receipt = await this.fastWatcher.getL1TransactionReceipt(
      msgHash
    )
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
      this.masterSystemConfig
    ).post('send.crossdomainmessage', data)

    console.log("Speed checker:", speed)

    return receipt
  }

  async fetchLookUpPrice(params) {
    try {
       // fetching only the prices compare to usd.
       const res = await coinGeckoAxiosInstance.get(
         `simple/price?ids=${params.join()}&vs_currencies=usd`
       )
       return res.data;
    } catch(error) {
      return error
    }
  }

  /***********************************************/
  /*****         DAO Functions               *****/
  /***********************************************/

  // get DAO Balance
  async getDaoBalance() {

    if( this.masterSystemConfig === 'mainnet' ) return
    if( this.masterSystemConfig === 'rinkeby' ) return

    if( this.L1orL2 !== 'L2' ) return
    if( this.BobaContract === null ) return

    try {
      console.log('Checking DAO balance')
      console.log('this.BobaContract',this.BobaContract)
      console.log('this.BobaContract',this.account)
      let balance = await this.BobaContract.balanceOf(this.account)
      console.log('balance',balance)
      return { balance: formatEther(balance) }
    } catch (error) {
      console.log('Error: DAO Balance', error)
      return error
    }
  }

  // get DAO Votes
  async getDaoVotes() {

    if( this.masterSystemConfig === 'mainnet' ) return
    if( this.masterSystemConfig === 'rinkeby' ) return

    if( this.L1orL2 !== 'L2' ) return
    if( this.BobaContract === null ) return

    try {
      let votes = await this.BobaContract.getCurrentVotes(this.account)
      return { votes: formatEther(votes) }
    } catch (error) {
      console.log('Error: DAO Votes', error)
      return error
    }
  }

  //Transfer DAO Funds
  async transferDao({ recipient, amount }) {
    try {
      const tx = await this.BobaContract.transfer(recipient, parseEther(amount.toString()))
      await tx.wait()
      return tx
    } catch (error) {
      return error
    }
  }

  //Delegate DAO Authority
  async delegateVotes({ recipient }) {
    try {
      const tx = await this.BobaContract.delegate(recipient)
      await tx.wait()
      return tx
    } catch (error) {
      return error
    }
  }

  // Proposal Create Threshold
  async getProposalThreshold() {

    if( this.masterSystemConfig === 'mainnet' ) return
    if( this.masterSystemConfig === 'rinkeby' ) return

    if( this.L1orL2 !== 'L2' ) return
    if( this.delegateContract === null ) return

    try {
      // get the threshold proposal only in case of L2
      if(this.L1orL2 === 'L2') {
        const delegateCheck = await this.delegateContract.attach(allAddresses.GovernorBravoDelegator)
        let rawThreshold = await delegateCheck.proposalThreshold()
        return { threshold: formatEther(rawThreshold) }
      }
      else {
        return { threshold: 0 }
      }
    } catch (error) {
      return error
    }
  }

  //Create Proposal
  async createProposal(payload) {

    let signatures = '' //text ? [''] : ['_setProposalThreshold(uint256)'] // the function that will carry out the proposal
    let value = 0
    let description = ''

    if( payload.action === 'text-proposal' ) {
      signatures = ['']
      value = 0
      description = payload.text
    } else if ( payload.action === 'change-lp-fee' ) {
      signatures = ['_setLPfee(uint256)']
      value = ethers.utils.parseEther(payload.value)
      description = `# Changing LP Bridge fee to ${payload.value} integer percent`
    } else if ( payload.action === 'change-threshold' ) {
      signatures = ['_setProposalThreshold(uint256)']
      value = ethers.utils.parseEther(payload.value)
      description = `# Changing Proposal Threshold to ${payload.value} Boba`
    }

    if( this.delegateContract === null ) return

    try {
      const delegateCheck = await this.delegateContract.attach(allAddresses.GovernorBravoDelegator)

      let address = [delegateCheck.address]
      let values = [0]
      //let signatures = text ? [''] : ['_setProposalThreshold(uint256)'] // the function that will carry out the proposal
      //let voting = text ? 0 : ethers.utils.parseEther(votingThreshold)
      let callData = [ethers.utils.defaultAbiCoder.encode( // the parameter for the above function
        ['uint256'],
        [value]
      )]
      //let description = text ? text : `# Changing Proposal Threshold to ${votingThreshold} Boba`;

      let res = await delegateCheck.propose(
        address,
        values,
        signatures,
        callData,
        description
      )
      return res
    } catch (error) {
      console.log("Error:",error)
      return error
    }
  }

  //Fetch DAO Proposals
  async fetchProposals() {

    if( this.masterSystemConfig === 'mainnet' ) return
    if( this.masterSystemConfig === 'rinkeby' ) return

    if( this.L1orL2 !== 'L2' ) return
    if( this.delegateContract === null ) return

    const delegateCheck = await this.delegateContract.attach(allAddresses.GovernorBravoDelegator)

    try {
      let proposalList = [];
      const proposalCounts = await delegateCheck.proposalCount()
      const totalProposals = await proposalCounts.toNumber() - 1 //it's always off by one??

      const filter = delegateCheck.filters.ProposalCreated(
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      )

      const descriptionList = await delegateCheck.queryFilter(filter)

      for (let i = 0; i < totalProposals; i++) {

        let proposalID = descriptionList[i].args[0]

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
        let endBlock = proposalData.endBlock.toString()

        let proposal = await delegateCheck.getActions(i+2)

        const { hasVoted } = await delegateCheck.getReceipt(proposalID, this.account)//delegateCheck.address)

        let description = descriptionList[i].args[8].toString()

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
           endBlock,
           hasVoted
        })

      }
      return { proposalList }
    } catch (error) {
      console.log(error)
      return error
    }
  }

  //Cast vote for proposal
  async castProposalVote({id, userVote}) {

    if( this.delegateContract === null ) return

    try {
      const delegateCheck = await this.delegateContract.attach(allAddresses.GovernorBravoDelegator)
      let res = delegateCheck.castVote(id, userVote)
      return res
    } catch(error) {
      console.log('Error: cast vote', error)
      return error
    }
  }

}

const networkService = new NetworkService()
export default networkService
