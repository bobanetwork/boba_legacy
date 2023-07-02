import { NETWORK, NETWORK_TYPE } from "util/network/network.util";
// testnet addresss
import addresses_Goerli from "@boba/register/addresses/addressesGoerli_0x6FF9c8FF8F0B6a0763a3030540c21aFC721A9148"
import addresses_BobaFuji from "@boba/register/addresses/addressBobaFuji_0xcE78de95b85212BC348452e91e0e74c17cf37c79"
import addresses_BobaBnbTestnet from "@boba/register/addresses/addressBobaBnbTestnet_0xAee1fb3f4353a9060aEC3943fE932b6Efe35CdAa"

// mainnet address
import addresses_Mainnet from "@boba/register/addresses/addressesMainnet_0x8376ac6C3f73a25Dd994E0b0669ca7ee0C02F089"
import addresses_BobaAvax from "@boba/register/addresses/addressBobaAvax_0x00220f8ce1c4be8436574e575fE38558d85e2E6b"
import addresses_BobaBnb from "@boba/register/addresses/addressBobaBnb_0xeb989B25597259cfa51Bd396cE1d4B085EC4c753"

// layerzero addresses.
import layerZeroTestnet from "@boba/register/addresses/layerZeroTestnet"
import layerZeroMainnet from "@boba/register/addresses/layerZeroMainnet"
import store from "store";

// predeployed contracts.

// const ERROR_ADDRESS = '0x0000000000000000000000000000000000000000'
const L1_ETH_Address = '0x0000000000000000000000000000000000000000'
const L2_BOBA_Address = '0x4200000000000000000000000000000000000006'
const L2MessengerAddress = '0x4200000000000000000000000000000000000007'
const L2StandardBridgeAddress = '0x4200000000000000000000000000000000000010'
// const L2GasOracle = '0x420000000000000000000000000000000000000F'
const L2_SECONDARYFEETOKEN_ADDRESS = '0x4200000000000000000000000000000000000023'

const ADDRESS_CONFIG = {
  [ NETWORK_TYPE.MAINNET ]: {
    [ NETWORK.ETHEREUM ]: {
      ...addresses_Mainnet,
      ...layerZeroMainnet.BOBA_Bridges.Mainnet,
      ...layerZeroMainnet.Layer_Zero_Protocol.Mainnet,
      layerZeroTargetChainID: layerZeroMainnet.Layer_Zero_Protocol.Mainnet.Layer_Zero_ChainId,
    },
    [ NETWORK.AVAX ]: {
      ...addresses_BobaAvax,
      ...layerZeroMainnet.BOBA_Bridges.Avalanche,
      ...layerZeroMainnet.Layer_Zero_Protocol.Avalanche,
      layerZeroTargetChainID: layerZeroMainnet.Layer_Zero_Protocol.Mainnet.Layer_Zero_ChainId,
    },
    [ NETWORK.BNB ]: {
      ...addresses_BobaBnb,
      ...layerZeroMainnet.BOBA_Bridges.BNB,
      ...layerZeroMainnet.Layer_Zero_Protocol.BNB,
      layerZeroTargetChainID: layerZeroMainnet.Layer_Zero_Protocol.Mainnet.Layer_Zero_ChainId,
    }
  },
  [ NETWORK_TYPE.TESTNET ]: {
    [ NETWORK.ETHEREUM ]: {
      ...addresses_Goerli,
      ...layerZeroTestnet.BOBA_Bridges.Testnet,
      ...layerZeroTestnet.Layer_Zero_Protocol.Testnet,
      layerZeroTargetChainID: layerZeroTestnet.Layer_Zero_Protocol.Testnet.Layer_Zero_ChainId,
    },
    [ NETWORK.AVAX ]: {
      ...addresses_BobaFuji,
      ...layerZeroTestnet.BOBA_Bridges.Avalanche,
      ...layerZeroTestnet.Layer_Zero_Protocol.Avalanche,
      layerZeroTargetChainID: layerZeroTestnet.Layer_Zero_Protocol.Avalanche.Layer_Zero_ChainId,
    },
    [ NETWORK.BNB ]: {
      ...addresses_BobaBnbTestnet,
      ...layerZeroTestnet.BOBA_Bridges.BNB,
      ...layerZeroTestnet.Layer_Zero_Protocol.BNB,
      layerZeroTargetChainID: layerZeroTestnet.Layer_Zero_Protocol.BNB.Layer_Zero_ChainId,
    }
  }
}

const SUPPORTED_ASSETS = {
  [ NETWORK_TYPE.MAINNET ]: {
    [ NETWORK.ETHEREUM ]: {
      tokens: [
        'USDT', 'DAI', 'USDC', 'WBTC', 'REP', 'BAT', 'ZRX', 'SUSHI',
        'LINK', 'UNI', 'BOBA', 'xBOBA', 'OMG', 'FRAX', 'FXS', 'DODO',
        'UST', 'BUSD', 'BNB', 'FTM', 'MATIC', 'UMA', 'DOM', 'OLO',
        'WAGMIv0', 'WAGMIv1', 'WAGMIv2', 'WAGMIv2-Oolong', 'WAGMIv3', 'WAGMIv3-Oolong',
        'CGT'
      ],
      tokenAddresses: {
        WAGMIv0: {
          'L1': 'WAGMIv0',
          'L2': '0x8493C4d9Cd1a79be0523791E3331c78Abb3f9672'
        },
        WAGMIv1: {
          'L1': 'WAGMIv1',
          'L2': '0xCe055Ea4f29fFB8bf35E852522B96aB67Cbe8197'
        },
        WAGMIv2: {
          'L1': 'WAGMIv2',
          'L2': '0x76B5908ecd0ae3DB23011ae96b7C1f803D63136c'
        },
        'WAGMIv2-Oolong': {
          'L1': 'WAGMIv2-Oolong',
          'L2': '0x49a3e4a1284829160f95eE785a1A5FfE2DD5Eb1D'
        },
        'WAGMIv3': {
          'L1': 'WAGMIv3',
          'L2': '0xC6158B1989f89977bcc3150fC1F2eB2260F6cabE'
        },
        'WAGMIv3-Oolong': {
          'L1': 'WAGMIv3-Oolong',
          'L2': '0x70bf3c5B5d80C4Fece8Bde0fCe7ef38B688463d4'
        },
        OLO: {
          'L1': 'OLO',
          'L2': '0x5008F837883EA9a07271a1b5eB0658404F5a9610'
        },
        CGT: {
          'L1': '0xf56b164efd3cfc02ba739b719b6526a6fa1ca32a',
          'L2': '0xf56b164efd3cfc02ba739b719b6526a6fa1ca32a'
        }
      },
      altL1Chains: [ 'BNB', 'Avalanche' ]
    },
    [ NETWORK.AVAX ]: {
      tokenAddresses: {
        'EVO': { 'L1': '0x42006Ab57701251B580bDFc24778C43c9ff589A1', 'L2': '0xc8849f32138de93F6097199C5721a9EfD91ceE01' }
      },
      tokens: [ 'BOBA', 'AVAX', 'EVO', 'USDT.e', 'USDt', 'USDC.e', 'BUSD.e', 'BUSD', 'DAI.e' ],
      altL1Chains: [ 'Avalanche' ]
    },
    [ NETWORK.BNB ]: {
      tokenAddresses: {},
      tokens: [ 'BOBA', 'BNB', 'BUSD', 'USDC', 'USDT', 'SUSHI' ],
      altL1Chains: [ 'BNB' ]
    },
  },
  [ NETWORK_TYPE.TESTNET ]: {
    [ NETWORK.ETHEREUM ]: {
      tokenAddresses: {},
      tokens: [ 'BOBA', 'USDC', 'OMG', 'xBOBA' ],
      altL1Chains: [ 'BNB', 'Avalanche' ]
    },
    [ NETWORK.AVAX ]: {
      tokenAddresses: {},
      tokens: [ 'BOBA', 'AVAX' ],
      altL1Chains: [ 'Avalanche' ]
    },
    [ NETWORK.BNB ]: {
      tokenAddresses: {},
      tokens: [ 'BOBA', 'BNB', 'MMT' ],
      altL1Chains: [ 'BNB' ]
    }
  }
}

class AppService {



  /**
   * @fetchAddresses
   *
   * NOTE:
   * Pre Deployeed contracts add address manually
   *
   * - L2StandardBridgeAddress
   * - L2MessengerAddress
   * - L2_ETH_Address
   * - L1_ETH_Address
   *
  */


  fetchAddresses({
    networkType,
    network
  }) {
    let addresses = ADDRESS_CONFIG[ networkType ][ network ] || {};

    return {
      ...addresses,
      L1LPAddress: addresses.Proxy__L1LiquidityPool,
      L2LPAddress: addresses.Proxy__L2LiquidityPool,
      L2StandardBridgeAddress,
      L2MessengerAddress,
      L2_ETH_Address: L2_BOBA_Address,
      L2_BOBA_Address,
      L1_ETH_Address
    };

  }

  /**
   * @fetchSupportedTokens
   *  - get the supported tokens base on network and network type.
   *
   * will return {supported tokens and token address}
   *
  */

  fetchSupportedAssets({
    networkType,
    network
  }) {
    return SUPPORTED_ASSETS[ networkType ][ network ] || {};
  }

  /**
   * @setupInitState
   *   setup initial state of token reducer
   *
  */

  setupInitState({
    l1Token,
    l1TokenName
  }) {

    store.dispatch({
      type: 'TOKEN/GET/SUCCESS',
      payload: {
        currency: L1_ETH_Address,
        addressL1: L1_ETH_Address,
        addressL2: L2_SECONDARYFEETOKEN_ADDRESS,
        symbolL1: l1Token,
        symbolL2: l1Token,
        decimals: 18,
        name: l1TokenName,
        redalert: false,
      }
    });
  }

};

const appService = new AppService();

export default appService;
