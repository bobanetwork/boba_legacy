const { Contract, providers, Wallet, utils } = require('ethers')
const { getContractFactory } = require('@eth-optimism/contracts')
require('dotenv').config()

const FluxAggregatorJson = require('../build/FluxAggregator.json')

const main = async () => {
  const env = process.env
  const L1_NODE_WEB3_URL = env.L1_NODE_WEB3_URL
  const L2_NODE_WEB3_URL = env.L2_NODE_WEB3_URL
  const ADDRESS_MANAGER_ADDRESS = env.ADDRESS_MANAGER_ADDRESS
  const PRIV_KEY = env.PRIV_KEY

  // provider
  const l1Provider = new providers.JsonRpcProvider(L1_NODE_WEB3_URL)
  const l2Provider = new providers.JsonRpcProvider(L2_NODE_WEB3_URL)
  const l1Wallet = new Wallet(PRIV_KEY).connect(l1Provider)
  const l2Wallet = new Wallet(PRIV_KEY).connect(l2Provider)

  // load contract
  const addressManager = getContractFactory('Lib_AddressManager')
    .connect(l1Wallet)
    .attach(ADDRESS_MANAGER_ADDRESS)

  // ETH - USD pair
  const ETHPrice = 2500.32

  const ETHUSDPairAdress = await addressManager.getAddress('BobaStraw_ETHUSD')
  const ETHUSDPair = new Contract(
    ETHUSDPairAdress,
    FluxAggregatorJson.abi,
    l2Wallet
  )

  const ETHUSDPairRoundID = await ETHUSDPair.latestRound()

  const ETHUSDPairState = await ETHUSDPair.oracleRoundState(
    ETHUSDPairAdress,
    ETHUSDPairRoundID
  )
  console.log(`ETH - USD state: ${ETHUSDPairState}`)

  const submitETHUSDPairRoundTx = await ETHUSDPair.submit(
    ETHUSDPairRoundID.toNumber() + 1,
    utils.parseUnits(ETHPrice.toString(), 8)
  )
  await submitETHUSDPairRoundTx.wait()
  console.log(`Submitted ETH - USD: ${submitETHUSDPairRoundTx.hash}`)

  // // BOBA - USD pair
  const BOBAPrice = 1.6

  const BOBAUSDPairAdress = await addressManager.getAddress('BobaStraw_BOBAUSD')
  const BOBAUSDPair = new Contract(
    BOBAUSDPairAdress,
    FluxAggregatorJson.abi,
    l2Wallet
  )

  const BOBAUSDPairRoundID = await BOBAUSDPair.latestRound()

  const BOBAUSDPairState = await BOBAUSDPair.oracleRoundState(
    BOBAUSDPairAdress,
    BOBAUSDPairRoundID
  )
  console.log(`BOBA - USD state: ${BOBAUSDPairState}`)

  const submitBOBAUSDPairRoundTx = await BOBAUSDPair.submit(
    BOBAUSDPairRoundID.toNumber() + 1,
    utils.parseUnits(BOBAPrice.toString(), 8)
  )
  await submitBOBAUSDPairRoundTx.wait()
  console.log(`Submitted BOBA - USD: ${submitBOBAUSDPairRoundTx.hash}`)

  // Withdraw balance
  // const balance = await ETHUSDPair.withdrawablePayment(l2Wallet.address)
  // const withdrawTx = await ETHUSDPair.withdrawablePayment(
  //   l2Wallet.address,
  //   l2Wallet.address,
  //   balance
  // )
  // await withdrawTx.wait()
}

try {
  main()
} catch (error) {
  console.log(error)
}
