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

const BobaRinkebyChain: Chain = {
  chainId: 28,
  chainName: 'Boba Rinkeby',
  isTestChain: true,
  isLocalChain: false,
  multicallAddress: '0xd22c83569AD94FfD16592B08A0468b779e9d4A59',
  multicall2Address: '0x449809032b8357608Df9f601b117b19115ea4285',
  getExplorerAddressLink: (address: string) => `https://blockexplorer.rinkeby.boba.network/address/${address}`,
  getExplorerTransactionLink: (transactionHash: string) => `https://blockexplorer.rinkeby.boba.network/tx/${transactionHash}`,
}


export const getChainConfig = () => isTestEnv()
  ? {
    readOnlyChainId: BobaRinkebyChain.chainId,
    readOnlyUrls: {[BobaRinkebyChain.chainId]: 'https://rinkeby.boba.network'},
    networks: [...DEFAULT_SUPPORTED_CHAINS, BobaRinkebyChain],
  }
  : {
    readOnlyChainId: BobaMainnetChain.chainId,
    readOnlyUrls: {[BobaMainnetChain.chainId]: 'https://mainnet.boba.network'},
    networks: [...DEFAULT_SUPPORTED_CHAINS, BobaMainnetChain],
  }
