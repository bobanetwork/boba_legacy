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
      this.provider = null
      this.account = null
      this.walletType = null
    } catch (e) {
      console.log(`Error disconnecting wallet: ${e}`)
    }
  }

  async listenMetaMask() {
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

  async connectWalletConnect() {
    console.log(rpcUrls)
    this.walletConnectProvider = new WalletConnectProvider({
      rpc: rpcUrls
    })
    await this.walletConnectProvider.enable();
    this.provider = new providers.Web3Provider(this.walletConnectProvider)
    this.account = await this.provider.getSigner().getAddress()
    this.walletType = 'walletconnect'
  }

  async listenWalletConnect() {
    this.walletConnectProvider.on("accountsChanged", (accounts) => {
      window.location.reload()
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
        window.location.reload()
      }
    });

    this.walletConnectProvider.on("disconnect", (code, reason) => {
      console.log("WalletConnect disconnect: ", code, reason)
      window.location.reload()
    });
  }

  async switchChain(chainId, chainInfo) {
    const provider = this.walletType === 'metamask' ? window.ethereum : this.walletConnectProvider
    try {
      if (this.walletType === 'walletconnect') {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [chainInfo, this.account],
        })
      }
      // walletconnect does not return error code 4902 if the chain is not exist
      // so we need to add the code of adding chain.
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      })
    } catch (error) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [chainInfo, this.account],
      })
      if (error.code === 4902) {
        try {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [chainInfo, this.account],
          })
          provider.on('chainChanged', this.handleChangeChainOnce)
        } catch (addError) {
          console.log(`Error adding chain: ${addError}`)
          throw new Error(addError.code)
        }
      } else {
        console.log(`Error switching chain: ${JSON.stringify(error)}`)
        throw new Error(error.code)
      }
    }
  }
  
  bindProviderListeners() {
    if (this.walletType === 'metamask') {
      this.listenMetaMask()
    }
    if (this.walletType === 'walletconnect') {
      this.listenWalletConnect()
    }
  }

  handleChangeChainOnce(chainID_hex_string) {

    localStorage.setItem('chainChangedInit', true)

    localStorage.setItem('newChain', Number(chainID_hex_string))
    // and remove the listner
    window.ethereum.removeListener('chainChanged', this.handleChangeChainOnce)
  }
}

const walletService = new WalletService();

export default walletService;
