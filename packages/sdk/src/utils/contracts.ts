import { getContractInterface, predeploys } from '@eth-optimism/contracts'
import { ethers, Contract } from 'ethers'

import { toAddress } from './coercion'
import { DeepPartial } from './type-utils'
import {
  OEContracts,
  OEL1Contracts,
  OEL2Contracts,
  OEContractsLike,
  OEL2ContractsLike,
  AddressLike,
  BridgeAdapters,
  BridgeAdapterData,
  ICrossChainMessenger,
} from '../interfaces'
import {
  StandardBridgeAdapter,
  ETHBridgeAdapter,
  DAIBridgeAdapter,
} from '../adapters'

/**
 * Full list of default L2 contract addresses.
 */
export const DEFAULT_L2_CONTRACT_ADDRESSES: OEL2ContractsLike = {
  L2CrossDomainMessenger: predeploys.L2CrossDomainMessenger,
  L2StandardBridge: predeploys.L2StandardBridge,
  OVM_L1BlockNumber: predeploys.OVM_L1BlockNumber,
  OVM_L2ToL1MessagePasser: predeploys.OVM_L2ToL1MessagePasser,
  OVM_DeployerWhitelist: predeploys.OVM_DeployerWhitelist,
  L2_BOBA: predeploys.L2_BOBA,
  OVM_GasPriceOracle: predeploys.OVM_GasPriceOracle,
  OVM_SequencerFeeVault: predeploys.OVM_SequencerFeeVault,
  L2_L1NativeToken: predeploys.L2_L1NativeToken,
}

/**
 * We've changed some contract names in this SDK to be a bit nicer. Here we remap these nicer names
 * back to the original contract names so we can look them up.
 */
const NAME_REMAPPING = {
  AddressManager: 'Lib_AddressManager',
  OVM_L1BlockNumber: 'iOVM_L1BlockNumber',
}

/**
 * Mapping of L1 chain IDs to the appropriate contract addresses for the OE deployments to the
 * given network. Simplifies the process of getting the correct contract addresses for a given
 * contract name.
 */
export const CONTRACT_ADDRESSES: {
  [l1ChainId: number]: OEContractsLike
} = {
  // Mainnet
  1: {
    l1: {
      AddressManager: '0x8376ac6C3f73a25Dd994E0b0669ca7ee0C02F089',
      L1CrossDomainMessenger: '0x6D4528d192dB72E282265D6092F4B872f9Dff69e',
      L1CrossDomainMessengerFast: '0xD05b8fD53614e1569cAC01c6D8d41416d0a7257E',
      L1StandardBridge: '0xdc1664458d2f0B6090bEa60A8793A4E66c2F1c00',
      StateCommitmentChain: '0xdE7355C971A5B733fe2133753Abd7e5441d441Ec',
      CanonicalTransactionChain: '0xfBd2541e316948B259264c02f370eD088E04c3Db',
      BondManager: '0x60660e6CDEb423cf847dD11De4C473130D65b627',
      L1MultiMessageRelayer: '0x5fD2CF99586B9D92f56CbaD0A3Ea4DF256A0070B',
      L1MultiMessageRelayerFast: '0x5fD2CF99586B9D92f56CbaD0A3Ea4DF256A0070B',
    },
    l2: DEFAULT_L2_CONTRACT_ADDRESSES,
  },
  // Rinkeby
  4: {
    l1: {
      AddressManager: '0x93A96D6A5beb1F661cf052722A1424CDDA3e9418',
      L1CrossDomainMessenger: '0xF10EEfC14eB5b7885Ea9F7A631a21c7a82cf5D76',
      L1CrossDomainMessengerFast: '0xe2a82CE9671A283190DD5E3f077027979F2c039E',
      L1StandardBridge: '0xDe085C82536A06b40D20654c2AbA342F2abD7077',
      StateCommitmentChain: '0x39e52546e091A28831414949B1601449be03b307',
      CanonicalTransactionChain: '0x321Bf0Df8F02FE665a7f7CcE31684A6dadB014b0',
      BondManager: '0xAF41D3399A91C43E8f2d70d9b47741b10CFA4Fc4',
      L1MultiMessageRelayer: '0x5C6263BCAa00C7f5988E148dB3CA178e1262E69f',
      L1MultiMessageRelayerFast: '0x5C6263BCAa00C7f5988E148dB3CA178e1262E69f',
    },
    l2: DEFAULT_L2_CONTRACT_ADDRESSES,
  },
  // Goerli
  5: {
    l1: {
      AddressManager: '0x2F7E3cAC91b5148d336BbffB224B4dC79F09f01D',
      L1CrossDomainMessenger: '0xEcC89b9EDD804850C4F343A278Be902be11AaF42',
      L1CrossDomainMessengerFast: '0x0000000000000000000000000000000000000000',
      L1StandardBridge: '0x73298186A143a54c20ae98EEE5a025bD5979De02',
      StateCommitmentChain: '0x1afcA918eff169eE20fF8AB6Be75f3E872eE1C1A',
      CanonicalTransactionChain: '0x2ebA8c4EfDB39A8Cd8f9eD65c50ec079f7CEBD81',
      BondManager: '0xE5AE60bD6F8DEe4D0c2BC9268e23B92F1cacC58F',
      L1MultiMessageRelayer: '0x0000000000000000000000000000000000000000',
      L1MultiMessageRelayerFast: '0x0000000000000000000000000000000000000000',
    },
    l2: DEFAULT_L2_CONTRACT_ADDRESSES,
  },
  // Kovan
  42: {
    l1: {
      AddressManager: '0x100Dd3b414Df5BbA2B542864fF94aF8024aFdf3a',
      L1CrossDomainMessenger: '0x4361d0F75A0186C05f971c566dC6bEa5957483fD',
      L1CrossDomainMessengerFast: '0x0000000000000000000000000000000000000000',
      L1StandardBridge: '0x22F24361D548e5FaAfb36d1437839f080363982B',
      StateCommitmentChain: '0xD7754711773489F31A0602635f3F167826ce53C5',
      CanonicalTransactionChain: '0xf7B88A133202d41Fe5E2Ab22e6309a1A4D50AF74',
      BondManager: '0xc5a603d273E28185c18Ba4d26A0024B2d2F42740',
      L1MultiMessageRelayer: '0x0000000000000000000000000000000000000000',
      L1MultiMessageRelayerFast: '0x0000000000000000000000000000000000000000',
    },
    l2: DEFAULT_L2_CONTRACT_ADDRESSES,
  },
  // Hardhat local
  31337: {
    l1: {
      AddressManager: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      L1CrossDomainMessenger: '0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f', // this is the Proxy__L1CrossDomainMessenger
      L1CrossDomainMessengerFast: '0x4EE6eCAD1c2Dae9f525404De8555724e3c35d07B', // this is the Proxy__L1CrossDomainMessengerFast
      L1StandardBridge: '0x09635F643e140090A9A8Dcd712eD6285858ceBef',
      StateCommitmentChain: '0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE',
      CanonicalTransactionChain: '0x0B306BF915C4d645ff596e518fAf3F9669b97016',
      BondManager: '0x3Aa5ebB10DC797CAC828524e59A333d0A371443c',
      L1MultiMessageRelayer: '0x9E545E3C0baAB3E08CdfD552C960A1050f373042',
      L1MultiMessageRelayerFast: '0xeF31027350Be2c7439C1b0BE022d49421488b72C',
    },
    l2: DEFAULT_L2_CONTRACT_ADDRESSES,
  },
  // Moonbeam local
  1281: {
    l1: {
      AddressManager: '0xc01Ee7f10EA4aF4673cFff62710E1D7792aBa8f3',
      L1CrossDomainMessenger: '0xab7785d56697E65c2683c8121Aac93D3A028Ba95',
      L1CrossDomainMessengerFast: '0xB942FA2273C7Bce69833e891BDdFd7212d2dA415',
      L1StandardBridge: '0x78D714e1b47Bb86FE15788B917C9CC7B77975529',
      StateCommitmentChain: '0x294c664f6D63bd1521231a2EeFC26d805ce00a08',
      CanonicalTransactionChain: '0x598efcBD0B5b4Fd0142bEAae1a38f6Bd4d8a218d',
      BondManager: '0xEC69d4f48f4f1740976968FAb9828d645Ad1d77f',
      L1MultiMessageRelayer: '0xad856F238CBeafd064b80D12EadAea3981fB21B5',
      L1MultiMessageRelayerFast: '0xAdD0E4aD78B01048027154c7a432a1cB6711178f',
    },
    l2: DEFAULT_L2_CONTRACT_ADDRESSES,
  },
  // MoonBase
  1287: {
    l1: {
      AddressManager: '0xF8d0bF3a1411AC973A606f90B2d1ee0840e5979B',
      L1CrossDomainMessenger: '0x76DB375075F1d5Dcd1D70Fc07F69a5c7b40ab877',
      L1CrossDomainMessengerFast: '0xAE8885D3b7937af9480cd7301925a88Dfb0cE9f6',
      L1StandardBridge: '0xEcca5FEd8154420403549f5d8F123fcE69fae806',
      StateCommitmentChain: '0x7Af512914Ab422f9D38aC5eEfc94fa5106FA74C2',
      CanonicalTransactionChain: '0x9986e1251e60E443c464641029262F5ee76fD448',
      BondManager: '0x6c55306656E8b74F93653A753DE539c2F6ca18Db',
      L1MultiMessageRelayer: '0x4c1bcfe4F0b1a57d3c578a8ED3dBEBCa29339c85',
      L1MultiMessageRelayerFast: '0x874a7Ea9722b96924e186f0263866FA90a7C777b',
    },
    l2: DEFAULT_L2_CONTRACT_ADDRESSES,
  },
  // Fantom local
  4003: {
    l1: {
      AddressManager: '0xf536cAF1a894E09945E649FCE3032E8E03ECb9A0',
      L1CrossDomainMessenger: '0x03466593AE8Bc085F384bC4EB91d5035F5a7936C',
      L1CrossDomainMessengerFast: '0xC93DD6833E6A29004FcC84C757cCf0d5551aBFe1',
      L1StandardBridge: '0xAEa06C2B29edfac53a0538A9843D018348845Ebf',
      StateCommitmentChain: '0xC98Dd1b152d9e4cf2A6384a78d4FFE8D50E86C6c',
      CanonicalTransactionChain: '0xFfB9dF984DC95ab53c561d818b708135612b087f',
      BondManager: '0xE9BC1f638d05edF64Bf3e23A08ff3e2B0fb8b7F7',
      L1MultiMessageRelayer: '0x9257aE2144eF338Da70D6884c98BD8CB90Da639E',
      L1MultiMessageRelayerFast: '0xB6D431Bb85298030eA27a0E3769bEa5ed1F9fF53',
    },
    l2: DEFAULT_L2_CONTRACT_ADDRESSES,
  },
  // Fantom testnet
  4002: {
    l1: {
      AddressManager: '0x12ad9f501149D3FDd703cC10c567F416B7F0af8b',
      L1CrossDomainMessenger: '0xEecAD665ca933eeA4a9a2db600E538c1391930d1',
      L1CrossDomainMessengerFast: '0xE5781E5E9CbC67E91DF93eD01E922De30125e491',
      L1StandardBridge: '0x86FC7AeFcd69983A8d82eAB1E0EaFD38bB42fd3f',
      StateCommitmentChain: '0x352d964E9aD016f122dc78Afa5164417907E0FaF',
      CanonicalTransactionChain: '0xE66Bd40BBeC97397758E22858331752f0ecBE02e',
      BondManager: '0xa97a909D967B150E27AB58ca6d0cb40B39200Be1',
      L1MultiMessageRelayer: '0xD7Cbc979C909d864c38670AcccD57209F7B556e3',
      L1MultiMessageRelayerFast: '0x9Af237336C29dCbA346764af8e8E1F0ba83D1eE5',
    },
    l2: DEFAULT_L2_CONTRACT_ADDRESSES,
  },
  // Avalanche local
  43112: {
    l1: {
      AddressManager: '0x52C84043CD9c865236f11d9Fc9F56aa003c1f922',
      L1CrossDomainMessenger: '0xDFBb4b49DfAe39720f68f8297ADb2368FeffaDdb',
      L1CrossDomainMessengerFast: '0xD054149e4345Cc00cc2f2465C02a864f60d6bd46',
      L1StandardBridge: '0x4475A8FBeF5Cf4a92a484B6f5602A91F3abC72D8',
      StateCommitmentChain: '0xF5f1f185cF359dC48469e410Aeb6983cD4DC5812',
      CanonicalTransactionChain: '0xa1E47689f396fED7d18D797d9D31D727d2c0d483',
      BondManager: '0x97C0FE6aB595cbFD50ad3860DA5B2017d8B35c2E',
      L1MultiMessageRelayer: '0xEC1bf080BDFBbBa102603Cc1C55aFd215C694a2b',
      L1MultiMessageRelayerFast: '0x1AA001Cd20F35F3F4EF1A945053CeE4Acc24aDb4',
    },
    l2: DEFAULT_L2_CONTRACT_ADDRESSES,
  },
  // Avalanche testnet
  43113: {
    l1: {
      AddressManager: '0xcE78de95b85212BC348452e91e0e74c17cf37c79',
      L1CrossDomainMessenger: '0x68c19B7FbAe4F8034cf6316b2045ba6aB6978F6b',
      L1CrossDomainMessengerFast: '0xBc5249095c890F58C0b75795bd21667eFd123F5F',
      L1StandardBridge: '0x07B606934b5B5D6A9E1f8b78A0B26215FF58Ad56',
      StateCommitmentChain: '0x57B9C47F2Ae857005238096486C5B107447dE221',
      CanonicalTransactionChain: '0xA36D21C0125b5Dc52d95ED8FF1eF7188d4666EAE',
      BondManager: '0x067cD503bd734a779830dafF0Db582B6a347c3df',
      L1MultiMessageRelayer: '0x74546A4c6D5543Be7e8447159c47BAe7f5431C49',
      L1MultiMessageRelayerFast: '0x5e6B412b4fA8373a17aD85B269fA5c354ea57e63',
    },
    l2: DEFAULT_L2_CONTRACT_ADDRESSES,
  },
  // BNB local
  99: {
    l1: {
      AddressManager: '0xC194E4CFa59D2DfC520217dA22E23DF8D4658a37',
      L1CrossDomainMessenger: '0x8b8656D5d37C3DC620B80817972E0d9a5267761b',
      L1CrossDomainMessengerFast: '0x07B43F437c3A13eeb17EF2beBea046e61502151f',
      L1StandardBridge: '0x285766B642eAA86b8052817c827E4472cDb3dd18',
      StateCommitmentChain: '0x57a243B34F9232515Fa9FD8D4c2daFd611cF1BCA',
      CanonicalTransactionChain: '0x3717E342Bc746c01244fb40e47521945091238ce',
      BondManager: '0xcF8dDe2accE564024B4b92ef7db81B0e6698F07f',
      L1MultiMessageRelayer: '0x90f502229E1fAa70cCf900B2D14595a5C55B3bE8',
      L1MultiMessageRelayerFast: '0x64160054BdD6e53915C221cBBfAAbaf1f80c7f20',
    },
    l2: DEFAULT_L2_CONTRACT_ADDRESSES,
  },
}

/**
 * Mapping of L1 chain IDs to the list of custom bridge addresses for each chain.
 */
export const BRIDGE_ADAPTER_DATA: {
  [l1ChainId: number]: BridgeAdapterData
} = {
  // TODO: Maybe we can pull these automatically from the token list?
  // Alternatively, check against the token list in CI.
  1: {
    Standard: {
      Adapter: StandardBridgeAdapter,
      l1Bridge: CONTRACT_ADDRESSES[1].l1.L1StandardBridge,
      l2Bridge: predeploys.L2StandardBridge,
    },
    ETH: {
      Adapter: ETHBridgeAdapter,
      l1Bridge: CONTRACT_ADDRESSES[1].l1.L1StandardBridge,
      l2Bridge: predeploys.L2StandardBridge,
    },
    BitBTC: {
      Adapter: StandardBridgeAdapter,
      l1Bridge: '0xaBA2c5F108F7E820C049D5Af70B16ac266c8f128',
      l2Bridge: '0x158F513096923fF2d3aab2BcF4478536de6725e2',
    },
    DAI: {
      Adapter: DAIBridgeAdapter,
      l1Bridge: '0x10E6593CDda8c58a1d0f14C5164B376352a55f2F',
      l2Bridge: '0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65',
    },
  },
  4: {
    // Rinkeby
    Standard: {
      Adapter: StandardBridgeAdapter,
      l1Bridge: CONTRACT_ADDRESSES[4].l1.L1StandardBridge,
      l2Bridge: predeploys.L2StandardBridge,
    },
    ETH: {
      Adapter: ETHBridgeAdapter,
      l1Bridge: CONTRACT_ADDRESSES[4].l1.L1StandardBridge,
      l2Bridge: predeploys.L2StandardBridge,
    },
  },
  5: {
    Standard: {
      Adapter: StandardBridgeAdapter,
      l1Bridge: CONTRACT_ADDRESSES[5].l1.L1StandardBridge,
      l2Bridge: predeploys.L2StandardBridge,
    },
    ETH: {
      Adapter: ETHBridgeAdapter,
      l1Bridge: CONTRACT_ADDRESSES[5].l1.L1StandardBridge,
      l2Bridge: predeploys.L2StandardBridge,
    },
  },
  42: {
    Standard: {
      Adapter: StandardBridgeAdapter,
      l1Bridge: CONTRACT_ADDRESSES[42].l1.L1StandardBridge,
      l2Bridge: predeploys.L2StandardBridge,
    },
    ETH: {
      Adapter: ETHBridgeAdapter,
      l1Bridge: CONTRACT_ADDRESSES[42].l1.L1StandardBridge,
      l2Bridge: predeploys.L2StandardBridge,
    },
    BitBTC: {
      Adapter: StandardBridgeAdapter,
      l1Bridge: '0x0b651A42F32069d62d5ECf4f2a7e5Bd3E9438746',
      l2Bridge: '0x0CFb46528a7002a7D8877a5F7a69b9AaF1A9058e',
    },
    USX: {
      Adapter: StandardBridgeAdapter,
      l1Bridge: '0x40E862341b2416345F02c41Ac70df08525150dC7',
      l2Bridge: '0xB4d37826b14Cd3CB7257A2A5094507d701fe715f',
    },
    DAI: {
      Adapter: DAIBridgeAdapter,
      l1Bridge: '0xb415e822C4983ecD6B1c1596e8a5f976cf6CD9e3',
      l2Bridge: '0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65',
    },
  },
  31337: {
    Standard: {
      Adapter: StandardBridgeAdapter,
      l1Bridge: CONTRACT_ADDRESSES[31337].l1.L1StandardBridge,
      l2Bridge: predeploys.L2StandardBridge,
    },
    ETH: {
      Adapter: ETHBridgeAdapter,
      l1Bridge: CONTRACT_ADDRESSES[31337].l1.L1StandardBridge,
      l2Bridge: predeploys.L2StandardBridge,
    },
  },
  1281: {
    Standard: {
      Adapter: StandardBridgeAdapter,
      l1Bridge: '0x78D714e1b47Bb86FE15788B917C9CC7B77975529',
      l2Bridge: predeploys.L2StandardBridge,
    },
    ETH: {
      Adapter: ETHBridgeAdapter,
      l1Bridge: '0x78D714e1b47Bb86FE15788B917C9CC7B77975529',
      l2Bridge: predeploys.L2StandardBridge,
    },
  },
  1287: {
    Standard: {
      Adapter: StandardBridgeAdapter,
      l1Bridge: '0xEcca5FEd8154420403549f5d8F123fcE69fae806',
      l2Bridge: predeploys.L2StandardBridge,
    },
    ETH: {
      Adapter: ETHBridgeAdapter,
      l1Bridge: '0xEcca5FEd8154420403549f5d8F123fcE69fae806',
      l2Bridge: predeploys.L2StandardBridge,
    },
  },
  4003: {
    Standard: {
      Adapter: StandardBridgeAdapter,
      l1Bridge: '0xAEa06C2B29edfac53a0538A9843D018348845Ebf',
      l2Bridge: predeploys.L2StandardBridge,
    },
    ETH: {
      Adapter: ETHBridgeAdapter,
      l1Bridge: '0xAEa06C2B29edfac53a0538A9843D018348845Ebf',
      l2Bridge: predeploys.L2StandardBridge,
    },
  },
  4002: {
    Standard: {
      Adapter: StandardBridgeAdapter,
      l1Bridge: '0x86FC7AeFcd69983A8d82eAB1E0EaFD38bB42fd3f',
      l2Bridge: predeploys.L2StandardBridge,
    },
    ETH: {
      Adapter: ETHBridgeAdapter,
      l1Bridge: '0x86FC7AeFcd69983A8d82eAB1E0EaFD38bB42fd3f',
      l2Bridge: predeploys.L2StandardBridge,
    },
  },
  43112: {
    Standard: {
      Adapter: StandardBridgeAdapter,
      l1Bridge: '0x4475A8FBeF5Cf4a92a484B6f5602A91F3abC72D8',
      l2Bridge: predeploys.L2StandardBridge,
    },
    ETH: {
      Adapter: ETHBridgeAdapter,
      l1Bridge: '0x4475A8FBeF5Cf4a92a484B6f5602A91F3abC72D8',
      l2Bridge: predeploys.L2StandardBridge,
    },
  },
  43113: {
    Standard: {
      Adapter: StandardBridgeAdapter,
      l1Bridge: '0x07B606934b5B5D6A9E1f8b78A0B26215FF58Ad56',
      l2Bridge: predeploys.L2StandardBridge,
    },
    ETH: {
      Adapter: ETHBridgeAdapter,
      l1Bridge: '0x07B606934b5B5D6A9E1f8b78A0B26215FF58Ad56',
      l2Bridge: predeploys.L2StandardBridge,
    },
  },
  99: {
    Standard: {
      Adapter: StandardBridgeAdapter,
      l1Bridge: '0x285766B642eAA86b8052817c827E4472cDb3dd18',
      l2Bridge: predeploys.L2StandardBridge,
    },
    ETH: {
      Adapter: ETHBridgeAdapter,
      l1Bridge: '0x285766B642eAA86b8052817c827E4472cDb3dd18',
      l2Bridge: predeploys.L2StandardBridge,
    },
  },
}

// TODO: PR is big enough as-is, will add support for SNX in another PR
// MAINNET
// l1: {
//   SNX: '0xCd9D4988C0AE61887B075bA77f08cbFAd2b65068',
// },
// l2: {
//   SNX: '0x3f87Ff1de58128eF8FCb4c807eFD776E1aC72E51',
// },
// KOVAN
// l1: {
//   SNX: '0xD134Db47DDF5A6feB245452af17cCAf92ee53D3c',
// },
// l2: {
//   SNX: '0x5C3f51CEd0C2F6157e2be67c029264D6C44bfe42',
// },

/**
 * Returns an ethers.Contract object for the given name, connected to the appropriate address for
 * the given L1 chain ID. Users can also provide a custom address to connect the contract to
 * instead. If the chain ID is not known then the user MUST provide a custom address or this
 * function will throw an error.
 *
 * @param contractName Name of the contract to connect to.
 * @param l1ChainId Chain ID for the L1 network where the OE contracts are deployed.
 * @param opts Additional options for connecting to the contract.
 * @param opts.address Custom address to connect to the contract.
 * @param opts.signerOrProvider Signer or provider to connect to the contract.
 * @returns An ethers.Contract object connected to the appropriate address and interface.
 */
export const getOEContract = (
  contractName: keyof OEL1Contracts | keyof OEL2Contracts,
  l1ChainId: number,
  opts: {
    address?: AddressLike
    signerOrProvider?: ethers.Signer | ethers.providers.Provider
  } = {}
): Contract => {
  const addresses = CONTRACT_ADDRESSES[l1ChainId]
  // console.log("getOEContract: looking for:",contractName)
  if (addresses === undefined && opts.address === undefined) {
    throw new Error(
      `cannot get contract ${contractName} for unknown L1 chain ID ${l1ChainId}, you must provide an address`
    )
  }

  return new Contract(
    toAddress(
      opts.address || addresses.l1[contractName] || addresses.l2[contractName]
    ),
    getContractInterface(NAME_REMAPPING[contractName] || contractName),
    opts.signerOrProvider
  )
}

/**
 * Automatically connects to all contract addresses, both L1 and L2, for the given L1 chain ID. The
 * user can provide custom contract address overrides for L1 or L2 contracts. If the given chain ID
 * is not known then the user MUST provide custom contract addresses for ALL L1 contracts or this
 * function will throw an error.
 *
 * @param l1ChainId Chain ID for the L1 network where the OE contracts are deployed.
 * @param opts Additional options for connecting to the contracts.
 * @param opts.l1SignerOrProvider: Signer or provider to connect to the L1 contracts.
 * @param opts.l2SignerOrProvider: Signer or provider to connect to the L2 contracts.
 * @param opts.overrides Custom contract address overrides for L1 or L2 contracts.
 * @returns An object containing ethers.Contract objects connected to the appropriate addresses on
 * both L1 and L2.
 */
export const getAllOEContracts = (
  l1ChainId: number,
  opts: {
    l1SignerOrProvider?: ethers.Signer | ethers.providers.Provider
    l2SignerOrProvider?: ethers.Signer | ethers.providers.Provider
    overrides?: DeepPartial<OEContractsLike>
  } = {}
): OEContracts => {
  const addresses = CONTRACT_ADDRESSES[l1ChainId] || {
    l1: {
      AddressManager: undefined,
      L1CrossDomainMessenger: undefined,
      L1CrossDomainMessengerFast: undefined,
      L1StandardBridge: undefined,
      StateCommitmentChain: undefined,
      CanonicalTransactionChain: undefined,
      BondManager: undefined,
      L1MultiMessageRelayer: undefined,
      L1MultiMessageRelayerFast: undefined,
    },
    l2: DEFAULT_L2_CONTRACT_ADDRESSES,
  }

  // Attach all L1 contracts.
  const l1Contracts: OEL1Contracts = {} as any
  for (const [contractName, contractAddress] of Object.entries(addresses.l1)) {
    l1Contracts[contractName] = getOEContract(contractName as any, l1ChainId, {
      address: opts.overrides?.l1?.[contractName] || contractAddress,
      signerOrProvider: opts.l1SignerOrProvider,
    })
  }

  // Attach all L2 contracts.
  const l2Contracts: OEL2Contracts = {} as any
  for (const [contractName, contractAddress] of Object.entries(addresses.l2)) {
    l2Contracts[contractName] = getOEContract(contractName as any, l1ChainId, {
      address: opts.overrides?.l2?.[contractName] || contractAddress,
      signerOrProvider: opts.l2SignerOrProvider,
    })
  }

  return {
    l1: l1Contracts,
    l2: l2Contracts,
  }
}

/**
 * Gets a series of bridge adapters for the given L1 chain ID.
 *
 * @param l1ChainId L1 chain ID for the L1 network where the custom bridges are deployed.
 * @param messenger Cross chain messenger to connect to the bridge adapters
 * @param opts Additional options for connecting to the custom bridges.
 * @param opts.overrides Custom bridge adapters.
 * @returns An object containing all bridge adapters
 */
export const getBridgeAdapters = (
  l1ChainId: number,
  messenger: ICrossChainMessenger,
  opts?: {
    overrides?: BridgeAdapterData
  }
): BridgeAdapters => {
  const adapters: BridgeAdapters = {}
  for (const [bridgeName, bridgeData] of Object.entries({
    ...(BRIDGE_ADAPTER_DATA[l1ChainId] || {}),
    ...(opts?.overrides || {}),
  })) {
    adapters[bridgeName] = new bridgeData.Adapter({
      messenger,
      l1Bridge: bridgeData.l1Bridge,
      l2Bridge: bridgeData.l2Bridge,
    })
  }

  return adapters
}
