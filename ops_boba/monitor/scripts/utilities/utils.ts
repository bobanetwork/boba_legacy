/* Imports: External */
import * as request from 'request-promise-native'
import {
    Contract,
    Wallet,
    providers,
    BigNumber,
    utils,
    constants,
} from 'ethers'
import {
    getContractInterface,
    predeploys,
} from '@eth-optimism/contracts'
import { remove0x } from '@eth-optimism/core-utils'
import {
    CrossChainMessenger,
    NumberLike,
    asL2Provider,
} from '@eth-optimism/sdk'
import { cleanEnv, str, num, bool, makeValidator } from 'envalid'
import dotenv from 'dotenv'
dotenv.config()

/* Imports: Internal */
import { OptimismEnv } from './env'

export const isLiveNetwork = () => {
    return process.env.IS_LIVE_NETWORK === 'true'
}

export const HARDHAT_CHAIN_ID = 31337
export const MOONBEAM_CHAIN_ID = 1281
export const DEFAULT_TEST_GAS_L1 = 330_000
export const DEFAULT_TEST_GAS_L2 = 1_300_000
export const ON_CHAIN_GAS_PRICE = 'onchain'
export const GWEI = BigNumber.from(1e9)
export const OVM_ETH_ADDRESS = predeploys.OVM_ETH

const gasPriceValidator = makeValidator((gasPrice) => {
    if (gasPrice === 'onchain') {
        return gasPrice
    }

    return num()._parse(gasPrice).toString()
})

const env = cleanEnv(process.env, {
    L1_GAS_PRICE: gasPriceValidator({
        default: '0',
    }),
    L1_URL: str({ default: 'http://localhost:9545' }),
    L1_POLLING_INTERVAL: num({ default: 10 }),

    L2_CHAINID: num({ default: 31338 }),
    L2_GAS_PRICE: gasPriceValidator({
        default: 'onchain',
    }),
    L2_URL: str({ default: 'http://localhost:8545' }),
    L2_POLLING_INTERVAL: num({ default: 10 }),
    L2_WALLET_MIN_BALANCE_ETH: num({
        default: 2,
    }),
    L2_WALLET_TOP_UP_AMOUNT_ETH: num({
        default: 3,
    }),



    PRIVATE_KEY: str({
        default:
            '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133',
    }),
    //0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199
    GAS_PRICE_ORACLE_PRIVATE_KEY: str({
        default:
            '0x96b8a38e12e1a31dee1eab2fffdf9d9990045f5b37e44d8cc27766ef294acf18',
    }),

    IS_LIVE_NETWORK: bool({ default: false }),

})

export const envConfig = env

export const L2_CHAINID = env.L2_CHAINID

console.log(`L1 Provider ${env.L1_URL}`)
export const l1Provider = new providers.JsonRpcProvider(env.L1_URL)
l1Provider.pollingInterval = env.L1_POLLING_INTERVAL

export const l2Provider = asL2Provider(
    new providers.JsonRpcProvider(env.L2_URL)
)
l2Provider.pollingInterval = env.L2_POLLING_INTERVAL

// The sequencer private key which is funded on L1
export const l1Wallet = new Wallet(env.PRIVATE_KEY, l1Provider)

// A random private key which should always be funded with deposits from L1 -> L2
// if it's using non-0 gas price
export const l2Wallet = l1Wallet.connect(l2Provider)

// The owner of the GasPriceOracle on L2
export const gasPriceOracleWallet = new Wallet(
    env.GAS_PRICE_ORACLE_PRIVATE_KEY,
    l2Provider
)

if (!process.env.BOBA_URL) {
    console.log(`!!You did not set process.env.BOBA_URL!!`)
    console.log(
        `Setting to default value of http://127.0.0.1:8080/boba-addr.json`
    )
} else {
    console.log(`process.env.BOBA_URL set to:`, process.env.BOBA_URL)
}

export const BOBA_URL =
    process.env.BOBA_URL || 'http://127.0.0.1:8080/boba-addr.json'

if (!process.env.BASE_URL) {
    console.log(`!!You did not set process.env.BASE_URL!!`)
    console.log(
        `Setting to default value of http://127.0.0.1:8080/addresses.json`
    )
} else {
    console.log(`process.env.BASE_URL set to:`, process.env.BASE_URL)
}

export const BASE_URL =
    process.env.BASE_URL || 'http://127.0.0.1:8080/addresses.json'

// Gets the bridge contract
export const getL1Bridge = async (wallet: Wallet, bridgeAddress: string) => {
    const l1BridgeInterface = getContractInterface('L1StandardBridge')
    const ProxyBridgeAddress = bridgeAddress

    if (
        !utils.isAddress(ProxyBridgeAddress) ||
        ProxyBridgeAddress === constants.AddressZero
    ) {
        throw new Error('Proxy__L1StandardBridge not found')
    }

    const L1StandardBridge = new Contract(
        ProxyBridgeAddress,
        l1BridgeInterface,
        wallet
    )
    return L1StandardBridge
}

export const getL2Bridge = async (wallet: Wallet, bridgeAddress: string) => {
    const l1BridgeInterface = getContractInterface('L2StandardBridge')

    if (
        !utils.isAddress(bridgeAddress) ||
        bridgeAddress === constants.AddressZero
    ) {
        throw new Error('L2StandardBridge not found')
    }

    const L2StandardBridge = new Contract(
        bridgeAddress,
        l1BridgeInterface,
        wallet
    )
    return L2StandardBridge
}

export const getOvmEth = (wallet: Wallet) => {
    const OVM_ETH = new Contract(
        OVM_ETH_ADDRESS,
        getContractInterface('OVM_ETH'),
        wallet
    )

    return OVM_ETH
}

export const fundUser = async (
    messenger: CrossChainMessenger,
    amount: NumberLike,
    recipient?: string
) => {
    console.log("DEPOSIT ETH");

    const mes = await messenger.depositETH(amount, {
        l2GasLimit: DEFAULT_TEST_GAS_L2,
        // overrides: {
        //   gasPrice: DEFAULT_TEST_GAS_L1,
        // },
    });

    console.log("WAIT FOR RECEIPT");

    await messenger.waitForMessageReceipt(
        mes
    )

    console.log("TRANSFER");

    if (recipient !== undefined) {
        const tx = await messenger.l2Signer.sendTransaction({
            to: recipient,
            value: amount,
        })
        await tx.wait()
    }
}


export const isHardhat = async () => {
    const chainId = await l1Wallet.getChainId()
    return chainId === HARDHAT_CHAIN_ID
}

export const isMoonbeam = async () => {
    const chainId = await l1Wallet.getChainId()
    return chainId === MOONBEAM_CHAIN_ID
}

export const die = (...args) => {
    console.log(...args)
    process.exit(1)
}

export const logStderr = (msg: string) => {
    process.stderr.write(`${msg}\n`)
}

export const getBASEDeployerAddresses = async () => {
    const options = {
        uri: BASE_URL,
    }
    const result = await request.get(options)
    return JSON.parse(result)
}

export const getBOBADeployerAddresses = async () => {
    const options = {
        uri: BOBA_URL,
    }
    const result = await request.get(options)
    return JSON.parse(result)
}