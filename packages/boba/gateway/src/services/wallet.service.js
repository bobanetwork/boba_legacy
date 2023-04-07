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

import { providers, utils } from "ethers"
import WalletConnectProvider from "@walletconnect/web3-provider"
import { rpcUrls } from 'util/network/network.util'
import store from 'store'

/*
  
*/
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
      this.provider = new providers.Web3Provider(window.ethereum, 'any')
      this.account = await this.provider.getSigner().getAddress()
      this.walletType = 'metamask'
      return true
    } catch (e) {
      console.log(`Error connecting wallet: ${e}`)
      return false
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
      console.log(`MetaMask chain changed to ${Number(chainId)}`)
      store.dispatch({ type: 'SETUP/CHAINIDCHANGED/SET', payload: Number(chainId) })
    })
  }

  async connectWalletConnect() {
    try {
      this.walletConnectProvider = new WalletConnectProvider({
        rpc: rpcUrls
      })
      await this.walletConnectProvider.enable()
      this.provider = new providers.Web3Provider(this.walletConnectProvider, 'any')
      this.account = await this.provider.getSigner().getAddress()
      this.walletType = 'walletconnect'
      return true
    } catch (e) {
      console.log(`Error connecting WalletConnect: ${e}`)
      return false
    }
  }

  async disconnectWalletConnect() {
    try {
      await this.walletConnectProvider.disconnect()
      return true
    } catch (e) {
      console.log(`Error disconnecting WalletConnect: ${e}`)
      return false
    }
  }

  async listenWalletConnect() {
    this.walletConnectProvider.on("accountsChanged", (accounts) => {
      if (utils.getAddress(this.account) !== utils.getAddress(accounts[0])) {
        window.location.reload()
      }
    });

    this.walletConnectProvider.on("chainChanged", (chainId) => {
      console.log(`WalletConnect chain changed to: ${chainId}`)
      store.dispatch({ type: 'SETUP/CHAINIDCHANGED/SET', payload: chainId })
    });
  }

  async switchChain(chainId, chainInfo) {
    const provider = this.walletType === 'metamask' ? window.ethereum : this.walletConnectProvider
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      })
      return true
    } catch (error) {
      if (error.code === 4902 || this.walletType === 'walletconnect') {
        try {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [chainInfo, this.account],
          })
          // After adding the chain, we need to call switchEthereumChain again to finish the process for WalletConnect
          if (this.walletType === 'walletconnect') {
            await provider.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId }],
            })
          }
          return true
        } catch (addError) {
          console.log(`Error adding chain: ${addError}`)
          return false
        }
      } else {
        console.log(`Error switching chain: ${error?.message}`)
        return false
      }
    }
  }

  async connectWallet(type) {
    if (type === 'metamask') {
      return await this.connectMetaMask()
    }
    if (type === 'walletconnect') {
      return await this.connectWalletConnect()
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
