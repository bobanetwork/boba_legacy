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

import { providers } from "ethers"
import WalletConnectProvider from "@walletconnect/web3-provider"
import { rpcUrls } from 'util/network/network.util'
import store from 'store'

class WalletService {
  constructor() {
    this.provider = null
    this.account = null

    this.walletConnectProvider = null
    this.walletType = null
  }

  async connectMetaMask() {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      this.provider = new providers.Web3Provider(window.ethereum)
      this.account = await this.provider.getSigner().getAddress()
      this.walletType = 'metamask'
    } catch (e) {
      console.log(`Error connecting wallet: ${e}`)
    }
  }

  async disconnectMetaMask() {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts", params: [{ eth_accounts: {} }] })
      return true
    } catch (e) {
      console.log(`Error disconnecting wallet: ${e}`)
      return false
    }
  }

  async listenMetaMask() {
    window.ethereum.on('accountsChanged', () => {
      window.location.reload()
    })
    window.ethereum.on('chainChanged', (chainId) => {
      const chainChangedInit = JSON.parse(localStorage.getItem('chainChangedInit'))
      // do not reload window in the special case where the user
      // changed chains AND conncted at the same time
      // otherwise the user gets confused about why they are going through
      // two window reloads
      if(chainChangedInit) {
        localStorage.setItem('chainChangedInit', false)
      } else {
        localStorage.setItem('chainChangedFromMM', true)
      }
      store.dispatch({ type: 'SETUP/CHAINIDCHANGED/SET' })
    })
  }

  async connectWalletConnect() {
    this.walletConnectProvider = new WalletConnectProvider({
      rpc: rpcUrls
    })
    await this.walletConnectProvider.enable()
    this.provider = new providers.Web3Provider(this.walletConnectProvider)
    this.account = await this.provider.getSigner().getAddress()
    this.walletType = 'walletconnect'
  }

  async disconnectWalletConnect() {
    try {
      await this.walletConnectProvider.disconnect()
      return true
    } catch (e) {
      console.log(`Error disconnecting wallet: ${e}`)
      return false
    }
  }

  async listenWalletConnect() {
    this.walletConnectProvider.on("accountsChanged", (accounts) => {
      if (this.account !== accounts[0]) {
        window.location.reload()
      }
      // console.log(`walletConnectProvider accountsChanged: ${accounts}`)
    });

    this.walletConnectProvider.on("chainChanged", (chainId) => {
      const chainChangedInit = JSON.parse(localStorage.getItem('chainChangedInit'))
      // do not reload window in the special case where the user
      // changed chains AND conncted at the same time
      // otherwise the user gets confused about why they are going through
      // two window reloads
      if(chainChangedInit) {
        localStorage.setItem('chainChangedInit', false)
      } else {
        localStorage.setItem('chainChangedFromMM', true)
      }
      store.dispatch({ type: 'SETUP/CHAINIDCHANGED/SET' })
    });
  }

  async switchChain(chainId, chainInfo) {
    const provider = this.walletType === 'metamask' ? window.ethereum : this.walletConnectProvider
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      })
      const chainIdChanged = await provider.request({ method: 'eth_chainId' })
      // walletconnect does not return error code 4902 if the chain is not exist
      // so we need to add the code of adding chain.
      if (this.walletType === 'walletconnect' && chainIdChanged !== chainId) {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [chainInfo, this.account],
        })
      }
      await this.connectWallet(this.walletType)
      return true
    } catch (error) {
      if (error.code === 4902) {
        try {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [chainInfo, this.account],
          })
          await this.connectWallet(this.walletType)
          return true
        } catch (addError) {
          console.log(`Error adding chain: ${addError}`)
          return false
        }
      } else {
        console.log(`Error switching chain: ${JSON.stringify(error)}`)
        return false
      }
    }
  }

  async connectWallet(type) {
    if (type === 'metamask') {
      await this.connectMetaMask()
    }
    if (type === 'walletconnect') {
      await this.connectWalletConnect()
    }
  }

  async disconnectWallet() {
    let result = false
    if (this.walletType === 'metamask') {
      result = await this.disconnectMetaMask()
    }
    if (this.walletType === 'walletconnect') {
      result = await this.disconnectWalletConnect()
    }
    this.resetValues()
    return result
  }

  bindProviderListeners() {
    if (this.walletType === 'metamask') {
      this.listenMetaMask()
    }
    if (this.walletType === 'walletconnect') {
      this.listenWalletConnect()
    }
  }

  resetValues() {
    this.walletConnectProvider = null
    this.provider = null
    this.account = null
    this.walletType = null
    store.dispatch({ type: 'SETUP/CHAINIDCHANGED/RESET' })
  }
}

const walletService = new WalletService();

export default walletService;
