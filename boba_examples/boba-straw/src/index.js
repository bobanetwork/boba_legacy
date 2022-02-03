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

  // get flags passed
  const args = process.argv.slice(2)
  let ethFlag = args.includes('eth') || args.includes('ETH')
  let bobaFlag = args.includes('boba') || args.includes('BOBA')
  let omgFlag = args.includes('omg') || args.includes('OMG')
  let wbtcFlag = args.includes('wbtc') || args.includes('WBTC')
  if (!(ethFlag || bobaFlag || omgFlag || wbtcFlag)) {
    ethFlag = bobaFlag = omgFlag = wbtcFlag = true
  }

  // TODO- move the four submissions to one function
  // ETH - USD pair
  if (ethFlag) {
    const ETHPrice = 2500.32

    const ETHUSDPairAdress = await addressManager.getAddress('BobaStraw_ETHUSD')
    const ETHUSDPair = new Contract(
      ETHUSDPairAdress,
      FluxAggregatorJson.abi,
      l2Wallet
    )

    const ETHUSDPairRoundID = await ETHUSDPair.latestRound()

    // Check eligibility for submission to next round
    const ETHUSDPairState = await ETHUSDPair.oracleRoundState(
      l2Wallet.address,
      ETHUSDPairRoundID.toNumber() + 1 // next round
    )
    console.log(`ETH - USD state: ${ETHUSDPairState}`)
    console.log(`Submission eligibility: ${ETHUSDPairState._eligibleToSubmit}`)

    /*
      For the sake of keeping this example easy to follow - the following part has been commented
      and the example assumes that only one oracle exists.
      Howver, This following portion is about the ways to verify and obtain the round and submissions for
      multiple oracle settings.
      Feel free to over look this section for now, and refer back for multiple oracle settings

      Ideally, in the case of multiple oracles, the oracle should query their
      eligibility to submit on the LATEST ROUND first, and not directly the next round

      If the oracle is not eligible for submissions on the round,
      obtain the next suggested round for the specific oracle.

      if (!ETHUSDPairState._eligibleToSubmit) {
        const SuggestedRound = await ETHUSDPair.oracleRoundState(
          l2Wallet.address,
          0
        )
        if (SuggestedRound._eligibleToSubmit) {
          console.log(`Suggested Round for Oracle: ${SuggestedRound._roundId}`)
          if (SuggestedRound._roundId == ETHUSDPairRoundID + 1) {
            // check if current round is supersedable and submit for the suggested round right away
          }
        } else {
          console.log(`The oracle might not have permissions to submit enabled`)
        }
      }
      */

    const submitETHUSDPairRoundTx = await ETHUSDPair.submit(
      ETHUSDPairRoundID.toNumber() + 1,
      utils.parseUnits(ETHPrice.toString(), 8)
    )
    await submitETHUSDPairRoundTx.wait()
    console.log(`Submitted ETH - USD: ${submitETHUSDPairRoundTx.hash}`)
  }

  // BOBA - USD pair
  if (bobaFlag) {
    const BOBAPrice = 1.6

    const BOBAUSDPairAdress = await addressManager.getAddress(
      'BobaStraw_BOBAUSD'
    )
    const BOBAUSDPair = new Contract(
      BOBAUSDPairAdress,
      FluxAggregatorJson.abi,
      l2Wallet
    )

    const BOBAUSDPairRoundID = await BOBAUSDPair.latestRound()

    const BOBAUSDPairState = await BOBAUSDPair.oracleRoundState(
      l2Wallet.address,
      BOBAUSDPairRoundID.toNumber() + 1
    )
    console.log(`BOBA - USD state: ${BOBAUSDPairState}`)

    const submitBOBAUSDPairRoundTx = await BOBAUSDPair.submit(
      BOBAUSDPairRoundID.toNumber() + 1,
      utils.parseUnits(BOBAPrice.toString(), 8)
    )
    await submitBOBAUSDPairRoundTx.wait()
    console.log(`Submitted BOBA - USD: ${submitBOBAUSDPairRoundTx.hash}`)
  }

  // OMG - USD pair
  if (omgFlag) {
    const OMGPrice = 4.73

    const OMGUSDPairAdress = await addressManager.getAddress('BobaStraw_OMGUSD')
    const OMGUSDPair = new Contract(
      OMGUSDPairAdress,
      FluxAggregatorJson.abi,
      l2Wallet
    )

    const OMGUSDPairRoundID = await OMGUSDPair.latestRound()

    const OMGUSDPairState = await OMGUSDPair.oracleRoundState(
      l2Wallet.address,
      OMGUSDPairRoundID.toNumber() + 1
    )
    console.log(`OMG - USD state: ${OMGUSDPairState}`)

    const submitOMGUSDPairRoundTx = await OMGUSDPair.submit(
      OMGUSDPairRoundID.toNumber() + 1,
      utils.parseUnits(OMGPrice.toString(), 8)
    )
    await submitOMGUSDPairRoundTx.wait()
    console.log(`Submitted OMG - USD: ${submitOMGUSDPairRoundTx.hash}`)
  }

  // WBTC - USD pair
  if (wbtcFlag) {
    const WBTCPrice = 36765.32

    const WBTCUSDPairAdress = await addressManager.getAddress('BobaStraw_WBTCUSD')
    const WBTCUSDPair = new Contract(
      WBTCUSDPairAdress,
      FluxAggregatorJson.abi,
      l2Wallet
    )

    const WBTCUSDPairRoundID = await WBTCUSDPair.latestRound()

    const WBTCUSDPairState = await WBTCUSDPair.oracleRoundState(
      l2Wallet.address,
      WBTCUSDPairRoundID.toNumber() + 1
    )
    console.log(`WBTC - USD state: ${WBTCUSDPairState}`)

    const submitWBTCUSDPairRoundTx = await WBTCUSDPair.submit(
      WBTCUSDPairRoundID.toNumber() + 1,
      utils.parseUnits(WBTCPrice.toString(), 8)
    )
    await submitWBTCUSDPairRoundTx.wait()
    console.log(`Submitted WBTC - USD: ${submitWBTCUSDPairRoundTx.hash}`)
  }

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
