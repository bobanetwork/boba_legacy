import { getContractInterface, predeploys } from '@bobanetwork/core_contracts'
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
  OVM_ETH: predeploys.OVM_ETH,
  OVM_GasPriceOracle: predeploys.OVM_GasPriceOracle,
  OVM_SequencerFeeVault: predeploys.OVM_SequencerFeeVault,
  WETH: predeploys.WETH9,
}

/**
 * We've changed some contract names in this SDK to be a bit nicer. Here we remap these nicer names
 * back to the original contract names so we can look them up.
 */
const NAME_REMAPPING = {
  AddressManager: 'Lib_AddressManager',
  OVM_L1BlockNumber: 'iOVM_L1BlockNumber',
  WETH: 'WETH9',
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
      L1MultiMessageRelayerFast: '0x2d6134Ac3e480fBDD263B7163d333dCA285f9622',
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
      L1MultiMessageRelayerFast: '0x94BC5F5330B9EF9f520551cDB6bD8FC707760Af6',
    },
    l2: DEFAULT_L2_CONTRACT_ADDRESSES,
  },
  // Goerli
  5: {
    l1: {
      AddressManager: '0x6FF9c8FF8F0B6a0763a3030540c21aFC721A9148',
      L1CrossDomainMessenger: '0xA6fA0867F39f3A3af7433C8A43f23bf26Efd1a48',
      L1CrossDomainMessengerFast: '0x8b5A2d6aE932e8224B15c2C87dc8A972301c1B5d',
      L1StandardBridge: '0xDBD71249Fe60c9f9bF581b3594734E295EAfA9b2',
      StateCommitmentChain: '0x7Bb4cfa36F9F3880e18a46B74bBb9B334F6600F3',
      CanonicalTransactionChain: '0x8B0eF5250b5d6EfA877eAc15BBdfbD3C8069242F',
      BondManager: '0xF84979ADeb8D2Dd25f54cF8cBbB05C08eC188e11',
      L1MultiMessageRelayer: '0xebE42F5cEA2184F6b416bFFAB0744b11281AE95b',
      L1MultiMessageRelayerFast: '0xf3b489cCC93A9B74F17113E323E4Db2b1FdE2Cb8',
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
      StateCommitmentChain: '0x5E41Eaac5319CDf336c51969E2F164A686138B28',
      CanonicalTransactionChain: '0xa8bD51a7F46321587921A33fa3c752b426c74754',
      BondManager: '0x6c55306656E8b74F93653A753DE539c2F6ca18Db',
      L1MultiMessageRelayer: '0x4c1bcfe4F0b1a57d3c578a8ED3dBEBCa29339c85',
      L1MultiMessageRelayerFast: '0x874a7Ea9722b96924e186f0263866FA90a7C777b',
    },
    l2: DEFAULT_L2_CONTRACT_ADDRESSES,
  },
  // Moonbeam
  1284: {
    l1: {
      AddressManager: '0x564c10A60af35a07f0EA8Be3106a4D81014b21a0',
      L1CrossDomainMessenger: '0x4765f8b50Bbe049045bBA1270dc7A8CDF17165cF',
      L1CrossDomainMessengerFast: '0x17d02C3e6cB69225d83d0bADEb0fC09aE735CA3b',
      L1StandardBridge: '0xAf5297f68D48cd2DE37Ee5cbaC0647fbA4132985',
      StateCommitmentChain: '0xAD379B1518f50Fc737536D2Ec2c13E4640e228A8',
      CanonicalTransactionChain: '0x99C970105cf6EE2e22b563CB86bCA42D05ac7A95',
      BondManager: '0xcfe333e0e48EC71f1399a76001cf39E0c6A51dA5',
      L1MultiMessageRelayer: '0x3664bC9BA25D0d3911c39d8ae1734b0B5A3495C1',
      L1MultiMessageRelayerFast: '0xE2EE964E39720f78Cd75BC146Ed078D301981759',
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
  // Fantom mainnet
  250: {
    l1: {
      AddressManager: '0x4e7325bcf09e091Bb8119258B885D4ef687B7386',
      L1CrossDomainMessenger: '0x64Fca36c52628e40de8684C4C3B5EdB22Fd2eFd9',
      L1CrossDomainMessengerFast: '0xC0597ED18446254E4dd0CA5D80eb07D3f2E462cF',
      L1StandardBridge: '0xb7629EF94B991865940E8A840Aa7d68fa88c3Fe8',
      StateCommitmentChain: '0xF764C4f8D2982432239A110Cf6B08e95631cE564',
      CanonicalTransactionChain: '0x6001C473E020D3562Ea436B61aE4d2e91e7078cE',
      BondManager: '0xCcA5a1CB9fAD5F2A5b88D95440dA7c83EC031Cb1',
      L1MultiMessageRelayer: '0xD8DcA5fC53a83Cf06ec744a7226C23951a353A0f',
      L1MultiMessageRelayerFast: '0xE7beDcedF3E3054aF891DddeF61775A23a16CB90',
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
  // Avalanche Mainnet
  43114: {
    l1: {
      AddressManager: '0x00220f8ce1c4be8436574e575fE38558d85e2E6b',
      L1CrossDomainMessenger: '0x0fc742332ae6D447d6619D93985Aa288B81CBb0C',
      L1CrossDomainMessengerFast: '0x5b6714b7926e6D7e34154C9AC945B489978fA7E7',
      L1StandardBridge: '0xf188F1e92B2c78956D2859b84684BFD17103e22c',
      StateCommitmentChain: '0x1ef85D873Cf451C8B9a45DbE40b478E991F51210',
      CanonicalTransactionChain: '0x1A19A4ce2b3B0A974Df717b6F88c881a69F315e3',
      BondManager: '0x26c319B7B2cF823365414d082698C8ac90cbBA63',
      L1MultiMessageRelayer: '0x87e062dE99Ed71aF9b22dDA63e1b6D43333798f8',
      L1MultiMessageRelayerFast: '0xf9821061774b9693359F582b007A5F1C39d75Ae3',
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
  // BNB testnet
  97: {
    l1: {
      AddressManager: '0xAee1fb3f4353a9060aEC3943fE932b6Efe35CdAa',
      L1CrossDomainMessenger: '0x53aD38aE4a63Fe33a86E011F7AF4d3fDe3daD145',
      L1CrossDomainMessengerFast: '0xbbD6a271abcC44f6dE284E6051Da76b4fB57458C',
      L1StandardBridge: '0xBf0939120b4F5E3196b9E12cAC291e03dD058e9a',
      StateCommitmentChain: '0x37FB8bB9EA100CA9a0DE822c9923643ef48Cb8EE',
      CanonicalTransactionChain: '0x65f291CDfB05bd1D639DF6268F98594fdacDeCa6',
      BondManager: '0x6737867ddd04272a79E7207a008f213e336b00e1',
      L1MultiMessageRelayer: '0x5e593AeB2Dbd855D79167831f091B4d959FbB2D1',
      L1MultiMessageRelayerFast: '0x0F01394F5fc19bA1B9F669bA79b76c9EaAe37987',
    },
    l2: DEFAULT_L2_CONTRACT_ADDRESSES,
  },
  // BNB mainnet
  56: {
    l1: {
      AddressManager: '0xeb989B25597259cfa51Bd396cE1d4B085EC4c753',
      L1CrossDomainMessenger: '0x31338a7D5d123E18a9a71447136B54B6D28241ae',
      L1CrossDomainMessengerFast: '0xBe349cABeA97bB933f8C2594634Deb858167f83c',
      L1StandardBridge: '0x1E0f7f4b2656b14C161f1caDF3076C02908F9ACC',
      StateCommitmentChain: '0xeF85fA550e6EC5486121313C895EDe1005e2397f',
      CanonicalTransactionChain: '0xA0E38a8FE293E9e95c6A4a882F396F1c80e9e2e4',
      BondManager: '0xEB6652A4eb6e0d003Fbb3DD76Ae72694175191cd',
      L1MultiMessageRelayer: '0x1E633Dcd0d3D349126983D58988051F7c62c543D',
      L1MultiMessageRelayerFast: '0x2dB5717B37Af9A1D9a28829Ea977B4aE4aEE2AED',
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
  43114: {
    Standard: {
      Adapter: StandardBridgeAdapter,
      l1Bridge: '0xf188F1e92B2c78956D2859b84684BFD17103e22c',
      l2Bridge: predeploys.L2StandardBridge,
    },
    ETH: {
      Adapter: ETHBridgeAdapter,
      l1Bridge: '0xf188F1e92B2c78956D2859b84684BFD17103e22c',
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
  97: {
    Standard: {
      Adapter: StandardBridgeAdapter,
      l1Bridge: '0xBf0939120b4F5E3196b9E12cAC291e03dD058e9a',
      l2Bridge: predeploys.L2StandardBridge,
    },
    ETH: {
      Adapter: ETHBridgeAdapter,
      l1Bridge: '0xBf0939120b4F5E3196b9E12cAC291e03dD058e9a',
      l2Bridge: predeploys.L2StandardBridge,
    },
  },
  1284: {
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
  56: {
    Standard: {
      Adapter: StandardBridgeAdapter,
      l1Bridge: '0x1E0f7f4b2656b14C161f1caDF3076C02908F9ACC',
      l2Bridge: predeploys.L2StandardBridge,
    },
    ETH: {
      Adapter: ETHBridgeAdapter,
      l1Bridge: '0x1E0f7f4b2656b14C161f1caDF3076C02908F9ACC',
      l2Bridge: predeploys.L2StandardBridge,
    },
  },
  250: {
    Standard: {
      Adapter: StandardBridgeAdapter,
      l1Bridge: '0xb7629EF94B991865940E8A840Aa7d68fa88c3Fe8',
      l2Bridge: predeploys.L2StandardBridge,
    },
    ETH: {
      Adapter: ETHBridgeAdapter,
      l1Bridge: '0xb7629EF94B991865940E8A840Aa7d68fa88c3Fe8',
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
