const ethers = require('ethers')
const YAML = require('yaml')
const fs = require('fs')

// Load env
const file = fs.readFileSync('./env.yml', 'utf8')
const env = YAML.parse(file)
const L2_NODE_WEB3_URL = env.L2_NODE_WEB3_TESTNET_URL === undefined ? env.L2_NODE_WEB3_URL : env.L2_NODE_WEB3_TESTNET_URL
const PRIVATE_KEY = env.PRIVATE_KEY_FAUCET
const BOBA_AUTHENTICATEDFAUCET_ADDRESS = env.BOBA_AUTHENTICATEDFAUCET_TESTNET_ADDRESS

// Get provider and wallet
const l2Provider = new ethers.providers.JsonRpcProvider(L2_NODE_WEB3_URL)
const l2Wallet = new ethers.Wallet(PRIVATE_KEY).connect(l2Provider)

// ABI
const TwitterAuthenticatedFaucetInterface = new ethers.utils.Interface([
  'function sendFundsMeta(address,string,bytes32,bytes)',
])

// Load contracts
const Boba_AuthenticatedFaucet = new ethers.Contract(
  BOBA_AUTHENTICATEDFAUCET_ADDRESS,
  TwitterAuthenticatedFaucetInterface,
  l2Wallet
)

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Strict-Transport-Security': 'max-age=63072000; includeSubdomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'same-origin',
  'Permissions-Policy': '*',
}

// Verify message and send to node if it's correct
module.exports.mainnetHandler = async (event, context, callback) => {
  const body = JSON.parse(event.body)

  const { hashedMsg, signature, tweetId, walletAddress } = body
  // Send transaction to node
  try {
    console.log("SendFundsMeta: ", walletAddress, tweetId, hashedMsg, signature, L2_NODE_WEB3_URL)

    await Boba_AuthenticatedFaucet.estimateGas.sendFundsMeta(
      walletAddress,
      tweetId,
      hashedMsg,
      signature
    )

    const execTx = await Boba_AuthenticatedFaucet.sendFundsMeta(
      walletAddress,
      tweetId,
      hashedMsg,
      signature
    )
    await execTx.wait();

  } catch (err) {
    console.error(err)
    return callback(null, {
      headers,
      statusCode: 400,
      body: JSON.stringify({ status: 'failure', error: err }),
    })
  }

  return callback(null, {
    headers,
    statusCode: 201,
    body: JSON.stringify({ status: 'success' }),
  })
}

// Return error message
module.exports.rinkebyHandler = async (event, context, callback) => {
  const body = JSON.parse(event.body)

  const { hashedMsg, signature, tweetId, walletAddress } = body
  // Send transaction to node
  try {
    console.log("SendFundsMeta: ", walletAddress, tweetId, hashedMsg, signature)

    await Boba_AuthenticatedFaucet.estimateGas.sendFundsMeta(
      walletAddress,
      tweetId,
      hashedMsg,
      signature
    )

    const execTx = await Boba_AuthenticatedFaucet.sendFundsMeta(
      walletAddress,
      tweetId,
      hashedMsg,
      signature
    )
    await execTx.wait();

  } catch (err) {
    console.error(err)
    return callback(null, {
      headers,
      statusCode: 400,
      body: JSON.stringify({ status: 'failure', error: err }),
    })
  }

  return callback(null, {
    headers,
    statusCode: 201,
    body: JSON.stringify({ status: 'success' }),
  })
}
