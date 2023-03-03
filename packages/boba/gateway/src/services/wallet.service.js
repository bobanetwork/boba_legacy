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

class WalletService {
  constructor() {
    this.provider = null
    this.account = null
  }

  async connectWallet() {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      this.provider = new providers.Web3Provider(window.ethereum)
      this.account = await this.provider.getSigner().getAddress()
    } catch (e) {
      console.log(`Error connecting wallet: ${e}`)
    }
  }

  async disconnectWallet() {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts", params: [{ eth_accounts: {} }] })
      this.provider = null
      this.account = null
    } catch (e) {
      console.log(`Error disconnecting wallet: ${e}`)
    }
  }

  async switchChain(chainId, chainInfo) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      })
    } catch (error) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [chainInfo, this.account],
          })
        } catch (addError) {
          console.log(`Error adding chain: ${addError}`)
          throw new Error(addError.code)
        }
      } else {
        console.log(`Error switching chain: ${error}`)
        throw new Error(error.code)
      }
    }
  }
}

const walletService = new WalletService();

export default walletService;
