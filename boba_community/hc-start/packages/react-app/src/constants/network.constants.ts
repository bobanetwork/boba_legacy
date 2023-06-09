import {Chain, DEFAULT_SUPPORTED_CHAINS} from "@usedapp/core";
import {isTestEnv} from "../utils/environment.utils";

const BobaMainnetChain: Chain = {
  chainId: 288,
  chainName: 'Boba Mainnet',
  isTestChain: false,
  isLocalChain: false,
  multicallAddress: '0xC5042a76652770d696Cc434026C971fd4DDD27b9',
  multicall2Address: '0xaD652645014b6d8Ef023d62aF144aAefA08CeCa5',
  getExplorerAddressLink: (address: string) => `https://bobascan.com/address/${address}`,
  getExplorerTransactionLink: (transactionHash: string) => `https://bobascan.com/tx/${transactionHash}`,
}

const BobaGoerliChain: Chain = {
  chainId: 2888,
  chainName: 'Boba Goerli',
  isTestChain: true,
  isLocalChain: false,
  multicallAddress: '0x2576d6AB4B0A4e6CdCD939d5893330f7d0088245',
  multicall2Address: '0x20F00ff289595614386A7E70738b80bCBEeAbFE6',
  getExplorerAddressLink: (address: string) => `https://testnet.bobascan.com/address/${address}`,
  getExplorerTransactionLink: (transactionHash: string) => `https://testnet.bobascan.com/tx/${transactionHash}`,
}


export const getChainConfig = () => isTestEnv()
  ? {
    readOnlyChainId: BobaGoerliChain.chainId,
    readOnlyUrls: {[BobaGoerliChain.chainId]: 'https://goerli.boba.network'},
    networks: [...DEFAULT_SUPPORTED_CHAINS, BobaGoerliChain],
  }
  : {
    readOnlyChainId: BobaMainnetChain.chainId,
    readOnlyUrls: {[BobaMainnetChain.chainId]: 'https://mainnet.boba.network'},
    networks: [...DEFAULT_SUPPORTED_CHAINS, BobaMainnetChain],
  }
