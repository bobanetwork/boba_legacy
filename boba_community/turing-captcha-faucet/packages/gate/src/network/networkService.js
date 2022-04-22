import { ethers, BigNumber, utils } from 'ethers'
import axios from 'axios'

import {
    NODE_URL,
    CHAIN_ID,
    BOBA_FAUCET_CONTRACE_ADDRESS,
    BOBA_TOKEN_ADDRESS
} from '../utils/constant'

import BobaTokenJson from '../deployment/L2StandardERC20.json'
import BobaFaucetJson from '../deployment/BobaFaucet.json'

class NetworkService {
    constructor() {
        this.provider = new ethers.providers.JsonRpcProvider(NODE_URL)
        this.BobaToken = new ethers.Contract(
            BOBA_TOKEN_ADDRESS,
            BobaTokenJson.abi,
            new ethers.providers.JsonRpcProvider(NODE_URL)
        )

        this.account = null
        this.chainID = null
        this.networkName = null
    }

    async connectWallet() {
        try {
            await window.ethereum.request({method: 'eth_requestAccounts'})
            this.provider = new ethers.providers.Web3Provider(window.ethereum)
            this.account = await this.provider.getSigner().getAddress()
            const networkMM = await this.provider.getNetwork()
            this.chainID = networkMM.chainId
            this.networkName = networkMM.name

            console.log('NS: this.chainID from MM:', this.chainID)
            console.log('NS: this.networkName from MM:', this.networkName)
            console.log('NS: this.account from MM:', this.account)

            if (Number(this.chainID) === Number(CHAIN_ID)) {

                const balanceInWei = await this.BobaToken.balanceOf(this.account)
                const balance = ethers.utils.formatEther(balanceInWei)

                localStorage.setItem('wallectConnectionStatus', 'connected')

                this.bindProviderListeners()

                return {
                    error: null,
                    payload:{
                        account: this.account,
                        balanceInWei: balanceInWei.toString(),
                        balance,
                    }
                }
            } else {
                localStorage.removeItem('wallectConnectionStatus')
                this.switchChain()
                return { error: 'Please switch to Boba Rinkeby' }
            }
        } catch (error) {
            localStorage.removeItem('wallectConnectionStatus')
            console.log(error)
            return { error }
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

    async switchChain() {
        const chainParam = {
            chainId: '0x' + CHAIN_ID,
            chainName: 'BOBA Rinkeby',
            rpcUrls: [NODE_URL],
            blockExplorerUrls: ['https://blockexplorer.rinkeby.boba.network'],
        }

        try {
            await this.provider.send('wallet_switchEthereumChain', [{ chainId: ethers.utils.hexlify(CHAIN_ID) }])
            await this.connectWallet()
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

    async getNetworkInfo() {
        try {
            const blockNumber = await this.provider.getBlockNumber()
            const gasPriceInWei = await this.provider.getGasPrice()
            const gasPrice = ethers.utils.formatUnits(gasPriceInWei, 9)
            return { gasPrice, blockNumber }
        } catch (error) {
            console.log(error)
            return {}
        }
    }

    async getCAPTCHAImage() {
        try {
            const res = await axios.get('https://api-turing.boba.network/get.captcha')
            if (res.status === 201) {
                return res.data
            }
            return false
        } catch (error) {
            console.log(error)
            return false
        }
    }

    async verifyCAPTCHAImage(token, uuid, key) {
        try {
            console.log(BOBA_FAUCET_CONTRACE_ADDRESS, BobaFaucetJson.abi)
            const BobaFaucet = new ethers.Contract(
                BOBA_FAUCET_CONTRACE_ADDRESS,
                BobaFaucetJson.abi,
                this.provider.getSigner()
            )
            // Request Boba
            if (token === 1) {
                await BobaFaucet.estimateGas.getETHFaucet(uuid, key)
                const tx = await BobaFaucet.getBobaFaucet(uuid, key, {gasLimit: 300000})
                await tx.wait()
            }
            // Request ETH
            if (token === 2) {
                await BobaFaucet.estimateGas.getETHFaucet(uuid, key)
                const tx = await BobaFaucet.getETHFaucet(uuid, key, {gasLimit: 300000})
                await tx.wait()
            }
            return { error: false }
        } catch (error) {
            console.log(error)
            return { error }
        }
    }

}

const networkService = new NetworkService()
export default networkService