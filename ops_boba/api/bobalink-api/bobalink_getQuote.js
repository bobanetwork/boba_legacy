const ethers = require('ethers')
const YAML = require('yaml')
const fs = require('fs')

// Support local tests
require('dotenv').config()

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

const loadContract = (contractAddr) => {
  // Load env
  let env = process.env
  if (fs.existsSync('./env.yml')) {
    const file = fs.readFileSync('./env.yml', 'utf8')
    env = YAML.parse(file)
  }
  const L1_NODE_WEB3_URL = env.L1_NODE_WEB3_URL

  // load contract
  const provider = new ethers.providers.JsonRpcProvider(L1_NODE_WEB3_URL)
  const chainLinkContract = new ethers.Contract(
    contractAddr,
    [
      'function getRoundData(uint80) view returns (uint80 roundId,uint256 answer,uint256 startedAt,uint256 updatedAt,uint80 answeredInRound)',
      'function latestRound() view returns (uint80 roundId)',
    ],
    provider
  )

  return chainLinkContract
}

const generateBytes32 = (input) => {
  return ethers.utils
    .hexZeroPad(ethers.utils.hexlify(input), 32)
    .replace('0x', '')
}

const getResponse = (statusCode, result) => {
  return {
    headers,
    statusCode,
    result,
  }
}

const handle = async (event, callback) => {
  const body = JSON.parse(event.body)

  try {
    const paramsHexString = body.params[0]
    const args = ethers.utils.defaultAbiCoder.decode(
      ['uint256', 'address', 'uint256'],
      paramsHexString
    )
    const chainLinkContractAddr = args[1]
    const roundId = args[2]

    const chainLinkContract = loadContract(chainLinkContractAddr)

    const latestRound = await chainLinkContract.latestRound()
    const roundData = await chainLinkContract.getRoundData(roundId)
    const result = `0x${generateBytes32(32 * 3)}${generateBytes32(
      roundData.roundId
    )}${generateBytes32(roundData.answer)}${generateBytes32(latestRound)}`

    return callback(null, getResponse(200, result))
  } catch (err) {
    console.log(`bobalink err: ${err}`)
    return callback(null, getResponse(500, err))
  }
}

// Verify message and send to node if it's correct
module.exports.exportHandler = async (event, context, callback) => {
  return handle(event, callback)
}
