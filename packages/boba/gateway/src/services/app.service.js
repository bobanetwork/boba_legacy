import { NETWORK, NETWORK_TYPE } from "util/network/network.util";
// testnet addresss
import addresses_Goerli from "@boba/register/addresses/addressesGoerli_0x6FF9c8FF8F0B6a0763a3030540c21aFC721A9148"
import addresses_BobaBase from "@boba/register/addresses/addressesBobaBase_0xF8d0bF3a1411AC973A606f90B2d1ee0840e5979B"
import addresses_BobaOperaTestnet from "@boba/register/addresses/addressesBobaOperaTestnet_0x12ad9f501149D3FDd703cC10c567F416B7F0af8b"
import addresses_BobaFuji from "@boba/register/addresses/addressBobaFuji_0xcE78de95b85212BC348452e91e0e74c17cf37c79"
import addresses_BobaBnbTestnet from "@boba/register/addresses/addressBobaBnbTestnet_0xAee1fb3f4353a9060aEC3943fE932b6Efe35CdAa"

// mainnet address
import addresses_Mainnet from "@boba/register/addresses/addressesMainnet_0x8376ac6C3f73a25Dd994E0b0669ca7ee0C02F089"
import addresses_BobaBeam from "@boba/register/addresses/addressBobaBeam_0x564c10A60af35a07f0EA8Be3106a4D81014b21a0"
import addresses_BobaAvax from "@boba/register/addresses/addressBobaAvax_0x00220f8ce1c4be8436574e575fE38558d85e2E6b"
import addresses_BobaBnb from "@boba/register/addresses/addressBobaBnb_0xeb989B25597259cfa51Bd396cE1d4B085EC4c753"
import addresses_BobaOpera from "@boba/register/addresses/addressBobaOpera_0x4e7325bcf09e091Bb8119258B885D4ef687B7386"

// layerzero addresses.
import layerZeroTestnet from "@boba/register/addresses/layerZeroTestnet"
import layerZeroMainnet from "@boba/register/addresses/layerZeroMainnet"

// predeployed contracts.

const ERROR_ADDRESS = '0x0000000000000000000000000000000000000000'
const L1_ETH_Address = '0x0000000000000000000000000000000000000000'
const L2_BOBA_Address = '0x4200000000000000000000000000000000000006'
const L2MessengerAddress = '0x4200000000000000000000000000000000000007'
const L2StandardBridgeAddress = '0x4200000000000000000000000000000000000010'
const L2GasOracle = '0x420000000000000000000000000000000000000F'
const L2_SecondaryFeeToken_Address = '0x4200000000000000000000000000000000000023'


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
      ...layerZeroMainnet.BOBA_Bridges.Mainnet,
      ...layerZeroMainnet.Layer_Zero_Protocol.Avalanche,
      layerZeroTargetChainID: layerZeroMainnet.Layer_Zero_Protocol.Mainnet.Layer_Zero_ChainId,
    },
    [ NETWORK.MOONBEAM ]: {
      ...addresses_BobaBeam,
      ...layerZeroMainnet.BOBA_Bridges.Mainnet,
      ...layerZeroMainnet.Layer_Zero_Protocol.Moonbeam,
      layerZeroTargetChainID: layerZeroMainnet.Layer_Zero_Protocol.Mainnet.Layer_Zero_ChainId,
    },
    [ NETWORK.BNB ]: {
      ...addresses_BobaBnb,
      ...layerZeroMainnet.BOBA_Bridges.Mainnet,
      ...layerZeroMainnet.Layer_Zero_Protocol.BNB,
      layerZeroTargetChainID: layerZeroMainnet.Layer_Zero_Protocol.Mainnet.Layer_Zero_ChainId,
    },
    [ NETWORK.FANTOM ]: addresses_BobaOpera,
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
      ...layerZeroTestnet.BOBA_Bridges.Testnet,
      ...layerZeroTestnet.Layer_Zero_Protocol.Avalanche,
      layerZeroTargetChainID: layerZeroTestnet.Layer_Zero_Protocol.Avalanche.Layer_Zero_ChainId,
    },
    [ NETWORK.FANTOM ]: {
      ...addresses_BobaOperaTestnet,
      ...layerZeroTestnet.BOBA_Bridges.Testnet,
      ...layerZeroTestnet.Layer_Zero_Protocol.Fantom,
      layerZeroTargetChainID: layerZeroTestnet.Layer_Zero_Protocol.Fantom.Layer_Zero_ChainId,
    },
    [ NETWORK.BNB ]: {
      ...addresses_BobaBnbTestnet,
      ...layerZeroTestnet.BOBA_Bridges.Testnet,
      ...layerZeroTestnet.Layer_Zero_Protocol.Fantom,
      layerZeroTargetChainID: layerZeroTestnet.Layer_Zero_Protocol.Fantom.Layer_Zero_ChainId,
    },
    [ NETWORK.MOONBEAM ]: addresses_BobaBase,
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

};

const appService = new AppService();

export default appService;
