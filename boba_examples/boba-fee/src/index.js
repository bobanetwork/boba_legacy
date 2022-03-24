const { Contract, providers, Wallet, utils } = require('ethers')
require('dotenv').config()

const main = async () => {
  const env = process.env
  const L1_NODE_WEB3_URL = env.L1_NODE_WEB3_URL
  const L2_NODE_WEB3_URL = env.L2_NODE_WEB3_URL
  const ADDRESS_MANAGER_ADDRESS = env.ADDRESS_MANAGER_ADDRESS
  const PRIV_KEY = env.PRIV_KEY

  const FEE_TOKEN = env.FEE_TOKEN

  // provider
  const l1Provider = new providers.JsonRpcProvider(L1_NODE_WEB3_URL)
  const l2Provider = new providers.JsonRpcProvider(L2_NODE_WEB3_URL)
  const l1Wallet = new Wallet(PRIV_KEY).connect(l1Provider)
  const l2Wallet = new Wallet(PRIV_KEY).connect(l2Provider)

  // load contract
  const addressManagerInterface = new utils.Interface([
    'function getAddress(string _name) view returns (address address)',
  ])
  const addressManager = new Contract(
    ADDRESS_MANAGER_ADDRESS,
    addressManagerInterface,
    l1Wallet
  )

  // get address
  const BobaGasPriceOracleAddress = await addressManager.getAddress(
    'Boba_GasPriceOracle'
  )

  const BobaGasPriceOracleInterface = new utils.Interface([
    'function useBobaAsFeeToken()',
    'function useETHAsFeeToken()',
    'function bobaFeeTokenUsers(address) view returns (bool)',
  ])
  const Boba_GasPriceOracle = new Contract(
    BobaGasPriceOracleAddress,
    BobaGasPriceOracleInterface,
    l2Wallet
  )

  if (typeof FEE_TOKEN === 'undefined') {
    console.error(`FEE_TOKEN: ${FEE_TOKEN} is not supported`)
    return null
  }

  if (FEE_TOKEN.toLocaleUpperCase() === 'ETH') {
    // use eth as fee token
    const setEthAsFeeTokenTx = await Boba_GasPriceOracle.useETHAsFeeToken()
    await setEthAsFeeTokenTx.wait()

    // verify it
    const isBobaAsFeeToken = await Boba_GasPriceOracle.bobaFeeTokenUsers(
      l2Wallet.address
    )
    console.log(`isEthAsFeeToken: ${!isBobaAsFeeToken}`)
  } else if (FEE_TOKEN.toLocaleUpperCase() === 'BOBA') {
    // use boba as fee token
    const setBobaAsFeeTokenTx = await Boba_GasPriceOracle.useBobaAsFeeToken()
    await setBobaAsFeeTokenTx.wait()

    // verify it
    const isBobaAsFeeToken = await Boba_GasPriceOracle.bobaFeeTokenUsers(
      l2Wallet.address
    )
    console.log(`isBobaAsFeeToken: ${isBobaAsFeeToken}`)
  } else {
    console.error(`FEE_TOKEN: ${FEE_TOKEN} is not supported`)
  }
}

try {
  main()
} catch (error) {
  console.log(error)
}
