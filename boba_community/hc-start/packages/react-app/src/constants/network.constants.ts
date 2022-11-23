import {Chain, DEFAULT_SUPPORTED_CHAINS} from "@usedapp/core";
import {isTestEnv} from "../utils/environment.utils";

const BobaMainnetChain: Chain = {
  chainId: 288,
  chainName: 'Boba Mainnet',
  isTestChain: false,
  isLocalChain: false,
  multicallAddress: '0xC5042a76652770d696Cc434026C971fd4DDD27b9',
  multicall2Address: '0xaD652645014b6d8Ef023d62aF144aAefA08CeCa5',
  getExplorerAddressLink: (address: string) => `https://blockexplorer.boba.network/address/${address}`,
  getExplorerTransactionLink: (transactionHash: string) => `https://blockexplorer.boba.network/tx/${transactionHash}`,
}

const BobaGoerliChain: Chain = {
  chainId: 2888,
  chainName: 'Boba Goerli',
  isTestChain: true,
  isLocalChain: false,
  multicallAddress: '0x2D7a14384f4BeB2EDc33Ca4B43ea8028d1155E05',
  multicall2Address: '0x3CA4f8c5730526aAE8F5e8F475af60EA2Ae6b9E0',
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
