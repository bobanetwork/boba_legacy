const { ethers } = require('ethers');
const redis = require('redis');
const dotenv = require('dotenv');
dotenv.config();

const IS_LOCAL = process.env.IS_LOCAL === 'True';
if (IS_LOCAL) {
  // also load in subfolder
  dotenv.config({path: './api/.env'})
}

// Local private key (public anyway)
const PK_KEY = IS_LOCAL ? '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' : process.env.PK_KEY;
const RPC_URL = IS_LOCAL ? 'http://localhost:8545' : process.env.RPC_URL;

const REDIS_URL = process.env.REDIS_URL;
const REDIS_PORT = process.env.REDIS_PORT;

const FAUCET_ABI = [{
  inputs: [
    { internalType: 'bytes32', name: '_uuid', type: 'bytes32' },
    { internalType: 'string', name: '_key', type: 'string' },
    { internalType: 'address', name: '_to', type: 'address' }
  ],
  name: 'getFaucet',
  outputs: [],
  stateMutability: 'nonpayable',
  type: 'function'
}];

const CONTRACT_FAUCET_ADDR = process.env.CONTRACT_FAUCET_ADDR || null;

exports.handler = async function hc_sendMetaTx(event, context) {
  const body = JSON.parse(event.body);

  const redisClient = redis.createClient({ host: REDIS_URL, port: REDIS_PORT });
  redisClient.on('error', err => console.error("Redis error: ", err))
  await redisClient.connect()

  if (!body.to) {
    return await return_payload(redisClient, { error: 'Address not defined' });
  }

  if (!ethers.utils.isAddress(body.to)) {
    return await return_payload(redisClient, { error: 'Address invalid' });
  }

  if (!body.sig) {
    const nonce_to_sign = await issue_nonce(redisClient, body.to);
    return await return_payload(redisClient, { nonce: nonce_to_sign });
  }

  if (!CONTRACT_FAUCET_ADDR && !body.faucetAddr) {
    return await return_payload(redisClient, { error: 'No faucet address provided' });
  } else if (CONTRACT_FAUCET_ADDR && body.faucetAddr) {
    return await return_payload(redisClient, { error: 'Faucet address already configured' });
  }

  const w3 = new ethers.providers.JsonRpcProvider(RPC_URL);

  if (!body.uuid || !body.key) {
    return await return_payload(redisClient, { error: 'Captcha results not provided' });
  }

  if (!(await verify_sig(redisClient, w3, body.to, body.sig))) {
    return await return_payload(redisClient, { error: 'Invalid signature' });
  }

  if (!PK_KEY) {
    return await return_payload(redisClient, {error: 'Please contact support (1)'})
  }
  const wallet = new ethers.Wallet(PK_KEY, w3);
  const faucetAddr = CONTRACT_FAUCET_ADDR ?? body.faucetAddr;
  const faucetContract = new ethers.Contract(faucetAddr, FAUCET_ABI, wallet);

  try {
    await faucetContract.estimateGas.getFaucet(body.uuid, body.key, body.to);
    const tx = await faucetContract.getFaucet(body.uuid, body.key, body.to);
    const receipt = await tx.wait()

    return await return_payload(redisClient, {
      txHash: receipt.transactionHash,
      message: receipt.status === 0 ? 'Transaction has failed' : 'Funds issued'
    });
  } catch (err) {
    const errorMsg = err?.reason ?? err
    return await return_payload(redisClient, {
      error: errorMsg
    })
  }
}

async function return_payload(redisClient, payload) {
  try {await redisClient.disconnect()} catch (err) {
    console.warn('Could not disconnect from Redis: ', err)
  }

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Strict-Transport-Security': 'max-age=63072000; includeSubdomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'same-origin',
      'Permissions-Policy': '*'
    },
    body: JSON.stringify({ result: payload })
  };
}

async function verify_sig(redisClient, w3, address, sig) {
  const nonce = await redisClient.get(address);
  await redisClient.del(address) // remove nonce from db, instant expiration
  if (!nonce || sig.length !== 132) {
    return false;
  }
  const recoveredAddr = ethers.utils.verifyMessage(nonce, sig);
  return recoveredAddr === address;
}

async function issue_nonce(redisClient, address) {
  let nonceToSign = ethers.utils.base58.encode(ethers.utils.randomBytes(16));
  if (nonceToSign.length !== 22) {
    nonceToSign = ethers.utils.base58.encode(ethers.utils.randomBytes(20)).substring(0, 22)
  }
  await redisClient.set(address, nonceToSign, 'EX', 600);
  return nonceToSign;
}

